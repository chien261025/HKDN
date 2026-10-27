package com.wms.module.identity.service;

import com.wms.module.identity.constant.SecurityConstants;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.concurrent.TimeUnit;

/**
 * Service quản lý giới hạn tần suất đăng nhập (Rate-Limiting) phân tán qua Redis.
 * Tận dụng triệt để Redis Key TTL để tự động giải phóng tài nguyên.
 * Đồng bộ hóa trạng thái khóa giữa toàn bộ cụm máy chủ Backend.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RedisLoginAttemptService {

    private final StringRedisTemplate redisTemplate;
    private final LoginAttemptService inMemoryFallback;

    private static final String PREFIX_ATTEMPT = "wms:ratelimit:attempts:";
    private static final String PREFIX_LOCKOUT = "wms:ratelimit:lockout:";
    private static final String PREFIX_LEVEL = "wms:ratelimit:level:";

    public record LockResult(boolean blocked, long remainingSeconds, int lockLevel, int remainingAttempts) {}

    public long calculateLockDurationSeconds(int level) {
        return switch (level) {
            case 1 -> SecurityConstants.LOCKOUT_LEVEL_1_SECONDS;
            case 2 -> SecurityConstants.LOCKOUT_LEVEL_2_SECONDS;
            case 3 -> SecurityConstants.LOCKOUT_LEVEL_3_SECONDS;
            default -> Math.min(SecurityConstants.LOCKOUT_MAX_SECONDS,
                    SecurityConstants.LOCKOUT_LEVEL_3_SECONDS + (long) (level - 3) * SecurityConstants.LOCKOUT_LEVEL_3_SECONDS);
        };
    }

    private String cleanKey(String key) {
        return (key != null) ? key.toLowerCase().trim() : "";
    }

    private String formatIpKey(String clientIp) {
        return (clientIp != null && !clientIp.isBlank()) ? "ip:" + clientIp.trim() : "ip:127.0.0.1";
    }

    private String formatDevKey(String dfp) {
        return (dfp != null && !dfp.isBlank()) ? "dev:" + dfp.trim() : "dev:default";
    }

    public LockResult checkStatus(String username, String clientIp, String deviceFingerprint) {
        try {
            String uKey = cleanKey(username);
            String ipKey = formatIpKey(clientIp);
            String devKey = formatDevKey(deviceFingerprint);

            long secUser = getLockoutRemainingSeconds(uKey);
            long secIp = getLockoutRemainingSeconds(ipKey);
            long secDev = getLockoutRemainingSeconds(devKey);
            long maxRemaining = Math.max(secUser, Math.max(secIp, secDev));

            int userLevel = getLockLevel(uKey);
            int ipLevel = getLockLevel(ipKey);
            int devLevel = getLockLevel(devKey);
            int maxLevel = Math.max(userLevel, Math.max(ipLevel, devLevel));

            int leftUser = getRemainingAttempts(uKey);
            int leftIp = getRemainingAttempts(ipKey);
            int leftDev = getRemainingAttempts(devKey);
            int minLeft = Math.min(leftUser, Math.min(leftIp, leftDev));

            return new LockResult(maxRemaining > 0, maxRemaining, maxLevel, minLeft);
        } catch (Exception e) {
            log.warn("[REDIS-RATELIMIT] Loi Redis khi checkStatus, chuyen sang InMemory Fallback: {}", e.getMessage());
            var res = inMemoryFallback.checkStatus(username, clientIp, deviceFingerprint);
            return new LockResult(res.blocked(), res.remainingSeconds(), res.lockLevel(), res.remainingAttempts());
        }
    }

    public LockResult registerFailure(String username, String clientIp, String deviceFingerprint) {
        try {
            String uKey = cleanKey(username);
            String ipKey = formatIpKey(clientIp);
            String devKey = formatDevKey(deviceFingerprint);

            LockResult userRes = registerSingleFailure(uKey);
            LockResult ipRes = registerSingleFailure(ipKey);
            LockResult devRes = registerSingleFailure(devKey);

            boolean anyBlocked = userRes.blocked() || ipRes.blocked() || devRes.blocked();
            long maxRemaining = Math.max(userRes.remainingSeconds(), Math.max(ipRes.remainingSeconds(), devRes.remainingSeconds()));
            int maxLevel = Math.max(userRes.lockLevel(), Math.max(ipRes.lockLevel(), devRes.lockLevel()));

            if (anyBlocked) {
                applyLockout(uKey, maxRemaining, maxLevel);
                applyLockout(ipKey, maxRemaining, maxLevel);
                applyLockout(devKey, maxRemaining, maxLevel);
                return new LockResult(true, maxRemaining, maxLevel, 0);
            }

            int minLeft = Math.min(userRes.remainingAttempts(), Math.min(ipRes.remainingAttempts(), devRes.remainingAttempts()));
            return new LockResult(false, 0, maxLevel, minLeft);
        } catch (Exception e) {
            log.warn("[REDIS-RATELIMIT] Loi Redis khi registerFailure, chuyen sang InMemory Fallback: {}", e.getMessage());
            var res = inMemoryFallback.registerFailure(username, clientIp, deviceFingerprint);
            return new LockResult(res.blocked(), res.remainingSeconds(), res.lockLevel(), res.remainingAttempts());
        }
    }

    private LockResult registerSingleFailure(String key) {
        if (key == null || key.isBlank()) {
            return new LockResult(false, 0, 0, SecurityConstants.MAX_FAILED_LOGIN_ATTEMPTS);
        }

        String attemptKey = PREFIX_ATTEMPT + key;
        Long attempts = redisTemplate.opsForValue().increment(attemptKey);
        if (attempts != null && attempts == 1) {
            redisTemplate.expire(attemptKey, SecurityConstants.INACTIVITY_EXPIRY_SECONDS, TimeUnit.SECONDS);
        }

        int currentAttempts = attempts != null ? attempts.intValue() : 1;
        int level = getLockLevel(key);

        if (currentAttempts >= SecurityConstants.MAX_FAILED_LOGIN_ATTEMPTS) {
            level++;
            setLockLevel(key, level);
            long duration = calculateLockDurationSeconds(level);
            applyLockout(key, duration, level);
            redisTemplate.delete(attemptKey);
            return new LockResult(true, duration, level, 0);
        }

        int remainingAttempts = Math.max(0, SecurityConstants.MAX_FAILED_LOGIN_ATTEMPTS - currentAttempts);
        return new LockResult(false, 0, level, remainingAttempts);
    }

    private void applyLockout(String key, long durationSeconds, int level) {
        if (key == null || key.isBlank() || durationSeconds <= 0) return;
        String lockKey = PREFIX_LOCKOUT + key;
        redisTemplate.opsForValue().set(lockKey, String.valueOf(level), Duration.ofSeconds(durationSeconds));
        setLockLevel(key, level);
        redisTemplate.delete(PREFIX_ATTEMPT + key);
        log.info("[REDIS-RATELIMIT] Da kich hoat khoa phan tan cho key: {} | Thoi gian: {}s | Level: {}", key, durationSeconds, level);
    }

    private long getLockoutRemainingSeconds(String key) {
        if (key == null || key.isBlank()) return 0;
        Long ttl = redisTemplate.getExpire(PREFIX_LOCKOUT + key, TimeUnit.SECONDS);
        return (ttl != null && ttl > 0) ? ttl : 0;
    }

    private int getLockLevel(String key) {
        if (key == null || key.isBlank()) return 0;
        String val = redisTemplate.opsForValue().get(PREFIX_LEVEL + key);
        if (val != null) {
            try { return Integer.parseInt(val); } catch (NumberFormatException ignored) {}
        }
        return 0;
    }

    private void setLockLevel(String key, int level) {
        if (key == null || key.isBlank()) return;
        String levelKey = PREFIX_LEVEL + key;
        redisTemplate.opsForValue().set(levelKey, String.valueOf(level), Duration.ofSeconds(SecurityConstants.INACTIVITY_EXPIRY_SECONDS * 2));
    }

    private int getRemainingAttempts(String key) {
        if (key == null || key.isBlank()) return SecurityConstants.MAX_FAILED_LOGIN_ATTEMPTS;
        String val = redisTemplate.opsForValue().get(PREFIX_ATTEMPT + key);
        if (val != null) {
            try {
                int attempts = Integer.parseInt(val);
                return Math.max(0, SecurityConstants.MAX_FAILED_LOGIN_ATTEMPTS - attempts);
            } catch (NumberFormatException ignored) {}
        }
        return SecurityConstants.MAX_FAILED_LOGIN_ATTEMPTS;
    }

    public void loginSucceeded(String username, String clientIp, String deviceFingerprint) {
        try {
            if (username != null) clearKey(cleanKey(username));
            if (clientIp != null) clearKey(formatIpKey(clientIp));
            if (deviceFingerprint != null) clearKey(formatDevKey(deviceFingerprint));
        } catch (Exception e) {
            log.warn("[REDIS-RATELIMIT] Loi khi loginSucceeded: {}", e.getMessage());
        }
        inMemoryFallback.loginSucceeded(username, clientIp, deviceFingerprint);
    }

    private void clearKey(String key) {
        redisTemplate.delete(PREFIX_ATTEMPT + key);
        redisTemplate.delete(PREFIX_LOCKOUT + key);
        redisTemplate.delete(PREFIX_LEVEL + key);
    }
}
