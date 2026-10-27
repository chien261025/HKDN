package com.wms.module.identity.service;

import com.wms.module.identity.constant.SecurityConstants;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Quản lý bảo mật đăng nhập chống Brute-Force (Tài khoản, IP & Thiết bị).
 * Phạt lũy tiến theo chuẩn doanh nghiệp: 1p -> 3p -> 15p...
 * Đồng bộ chu kỳ: Sau khi hết giờ phạt, người dùng luôn có trọn vẹn 5 lần thử mới.
 * Tự động dọn dẹp bộ nhớ định kỳ ngăn chặn rò rỉ RAM (Memory Leak Prevention).
 */
@Slf4j
@Service
public class LoginAttemptService {

    public record LockResult(boolean blocked, long remainingSeconds, int lockLevel, int remainingAttempts) {}

    private static class AttemptRecord {
        int consecutiveFails = 0;
        int lockLevel = 0; // 0: chưa khóa, 1: 1p, 2: 3p, 3: 15p...
        Instant blockedUntil;
        Instant lastAttemptAt = Instant.now();
    }

    private final Map<String, AttemptRecord> attemptsMap = new ConcurrentHashMap<>();
    private final Map<String, Instant> lastLockoutEndMap = new ConcurrentHashMap<>();

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

    public String formatIpKey(String clientIp) {
        return (clientIp != null && !clientIp.isBlank()) ? "IP:" + clientIp.trim() : "IP:127.0.0.1";
    }

    public String formatDevKey(String dfp) {
        return (dfp != null && !dfp.isBlank()) ? "DEV:" + dfp.trim() : "DEV:DEFAULT";
    }

    private void refreshRecordState(String key, AttemptRecord record, Instant now, Instant relevantLockoutEnd) {
        if (record == null) return;

        // 1. Nếu đã hết thời gian khóa -> Xóa mốc khóa và reset số lần sai về 0 cho chu kỳ mới
        if (record.blockedUntil != null && now.isAfter(record.blockedUntil)) {
            record.blockedUntil = null;
            record.consecutiveFails = 0;
        }

        // 2. Nếu lần nhập sai của record này diễn ra trước mốc mở khóa gần nhất -> Reset về 0
        if (relevantLockoutEnd != null && record.lastAttemptAt != null && record.lastAttemptAt.isBefore(relevantLockoutEnd)) {
            record.consecutiveFails = 0;
            if (record.blockedUntil != null && now.isAfter(record.blockedUntil)) {
                record.blockedUntil = null;
            }
        }

        // 3. Nếu quá 15 phút không có thao tác -> Reset hoàn toàn về mức 0
        if (record.blockedUntil == null && record.lastAttemptAt != null &&
                now.isAfter(record.lastAttemptAt.plusSeconds(SecurityConstants.INACTIVITY_EXPIRY_SECONDS))) {
            record.consecutiveFails = 0;
            record.lockLevel = 0;
        }
    }

    private Instant getLatestLockoutEnd(String ipKey, String devKey) {
        Instant t1 = lastLockoutEndMap.get(ipKey);
        Instant t2 = lastLockoutEndMap.get(devKey);
        if (t1 == null) return t2;
        if (t2 == null) return t1;
        return t1.isAfter(t2) ? t1 : t2;
    }

    public LockResult checkStatus(String username, String clientIp, String deviceFingerprint) {
        Instant now = Instant.now();
        String uKey = cleanKey(username);
        String ipKey = cleanKey(formatIpKey(clientIp));
        String devKey = cleanKey(formatDevKey(deviceFingerprint));
        Instant relevantLockEnd = getLatestLockoutEnd(ipKey, devKey);

        long secUser = getRemainingBlockedSeconds(uKey, now, relevantLockEnd);
        long secIp = getRemainingBlockedSeconds(ipKey, now, relevantLockEnd);
        long secDev = getRemainingBlockedSeconds(devKey, now, relevantLockEnd);
        long maxRemaining = Math.max(secUser, Math.max(secIp, secDev));

        int userLevel = getLockLevel(uKey);
        int ipLevel = getLockLevel(ipKey);
        int devLevel = getLockLevel(devKey);
        int maxLevel = Math.max(userLevel, Math.max(ipLevel, devLevel));

        int leftUser = getRemainingAttempts(uKey, now, relevantLockEnd);
        int leftIp = getRemainingAttempts(ipKey, now, relevantLockEnd);
        int leftDev = getRemainingAttempts(devKey, now, relevantLockEnd);
        int minLeft = Math.min(leftUser, Math.min(leftIp, leftDev));

        return new LockResult(maxRemaining > 0, maxRemaining, maxLevel, minLeft);
    }

    public long getRemainingBlockedSeconds(String key, Instant now, Instant relevantLockEnd) {
        if (key == null || key.isBlank()) return 0;
        AttemptRecord record = attemptsMap.get(cleanKey(key));
        if (record == null) return 0;
        refreshRecordState(key, record, now, relevantLockEnd);
        if (record.blockedUntil == null) return 0;
        return Math.max(0, record.blockedUntil.getEpochSecond() - now.getEpochSecond());
    }

    public int getLockLevel(String key) {
        if (key == null || key.isBlank()) return 0;
        AttemptRecord record = attemptsMap.get(cleanKey(key));
        return (record != null) ? record.lockLevel : 0;
    }

    public int getRemainingAttempts(String key, Instant now, Instant relevantLockEnd) {
        if (key == null || key.isBlank()) return SecurityConstants.MAX_FAILED_LOGIN_ATTEMPTS;
        AttemptRecord record = attemptsMap.get(cleanKey(key));
        if (record == null) return SecurityConstants.MAX_FAILED_LOGIN_ATTEMPTS;
        refreshRecordState(key, record, now, relevantLockEnd);
        return Math.max(0, SecurityConstants.MAX_FAILED_LOGIN_ATTEMPTS - record.consecutiveFails);
    }

    public LockResult registerFailure(String username, String clientIp, String deviceFingerprint) {
        Instant now = Instant.now();
        String uKey = cleanKey(username);
        String ipKey = cleanKey(formatIpKey(clientIp));
        String devKey = cleanKey(formatDevKey(deviceFingerprint));
        Instant relevantLockEnd = getLatestLockoutEnd(ipKey, devKey);

        LockResult userRes = registerSingleFailure(uKey, now, relevantLockEnd);
        LockResult ipRes = registerSingleFailure(ipKey, now, relevantLockEnd);
        LockResult devRes = registerSingleFailure(devKey, now, relevantLockEnd);

        boolean anyBlocked = userRes.blocked() || ipRes.blocked() || devRes.blocked();
        long maxRemaining = Math.max(userRes.remainingSeconds(), Math.max(ipRes.remainingSeconds(), devRes.remainingSeconds()));
        int maxLevel = Math.max(userRes.lockLevel(), Math.max(ipRes.lockLevel(), devRes.lockLevel()));

        if (anyBlocked) {
            Instant blockEnd = now.plusSeconds(maxRemaining);
            lastLockoutEndMap.put(ipKey, blockEnd);
            lastLockoutEndMap.put(devKey, blockEnd);
            if (!uKey.isBlank()) lastLockoutEndMap.put(uKey, blockEnd);

            setLockoutState(uKey, blockEnd, maxLevel);
            setLockoutState(ipKey, blockEnd, maxLevel);
            setLockoutState(devKey, blockEnd, maxLevel);
            return new LockResult(true, maxRemaining, maxLevel, 0);
        }

        int minLeft = Math.min(userRes.remainingAttempts(), Math.min(ipRes.remainingAttempts(), devRes.remainingAttempts()));
        return new LockResult(false, 0, maxLevel, minLeft);
    }

    private void setLockoutState(String key, Instant blockEnd, int level) {
        if (key == null || key.isBlank()) return;
        attemptsMap.compute(key, (k, existing) -> {
            AttemptRecord rec = (existing != null) ? existing : new AttemptRecord();
            rec.blockedUntil = blockEnd;
            rec.lockLevel = level;
            rec.consecutiveFails = 0;
            rec.lastAttemptAt = Instant.now();
            return rec;
        });
    }

    private LockResult registerSingleFailure(String key, Instant now, Instant relevantLockEnd) {
        if (key == null || key.isBlank()) return new LockResult(false, 0, 0, SecurityConstants.MAX_FAILED_LOGIN_ATTEMPTS);
        AttemptRecord record = attemptsMap.compute(key, (unused, existing) -> {
            AttemptRecord rec = (existing != null) ? existing : new AttemptRecord();
            refreshRecordState(key, rec, now, relevantLockEnd);
            rec.lastAttemptAt = now;
            rec.consecutiveFails++;
            if (rec.consecutiveFails >= SecurityConstants.MAX_FAILED_LOGIN_ATTEMPTS) {
                rec.lockLevel++;
                long duration = calculateLockDurationSeconds(rec.lockLevel);
                rec.blockedUntil = now.plusSeconds(duration);
                rec.consecutiveFails = 0;
            }
            return rec;
        });

        long remaining = (record.blockedUntil != null)
                ? Math.max(0, record.blockedUntil.getEpochSecond() - now.getEpochSecond())
                : 0;
        int left = Math.max(0, SecurityConstants.MAX_FAILED_LOGIN_ATTEMPTS - record.consecutiveFails);
        return new LockResult(record.blockedUntil != null && remaining > 0, remaining, record.lockLevel, left);
    }

    public void loginSucceeded(String username, String clientIp, String deviceFingerprint) {
        if (username != null) {
            attemptsMap.remove(cleanKey(username));
            lastLockoutEndMap.remove(cleanKey(username));
        }
        if (clientIp != null) {
            attemptsMap.remove(cleanKey(formatIpKey(clientIp)));
            lastLockoutEndMap.remove(cleanKey(formatIpKey(clientIp)));
        }
        if (deviceFingerprint != null) {
            attemptsMap.remove(cleanKey(formatDevKey(deviceFingerprint)));
            lastLockoutEndMap.remove(cleanKey(formatDevKey(deviceFingerprint)));
        }
    }

    /**
     * Dọn dẹp định kỳ 5 phút một lần để giải phóng các bản ghi không còn hoạt động.
     * Chống rò rỉ bộ nhớ (Memory Leak Prevention) trong môi trường sản xuất.
     */
    @Scheduled(fixedRate = 300_000)
    public void cleanupExpiredRecords() {
        Instant cutoff = Instant.now().minusSeconds(SecurityConstants.INACTIVITY_EXPIRY_SECONDS);
        int initialSize = attemptsMap.size();
        attemptsMap.entrySet().removeIf(entry -> {
            AttemptRecord rec = entry.getValue();
            boolean expiredInactivity = rec.lastAttemptAt != null && rec.lastAttemptAt.isBefore(cutoff);
            boolean notBlocked = rec.blockedUntil == null || Instant.now().isAfter(rec.blockedUntil);
            return expiredInactivity && notBlocked;
        });
        lastLockoutEndMap.entrySet().removeIf(entry -> entry.getValue().isBefore(cutoff));
        if (attemptsMap.size() < initialSize) {
            log.info("[RATE-LIMIT] Da don dep {} ban ghi het han. So ban ghi hien tai: {}",
                    initialSize - attemptsMap.size(), attemptsMap.size());
        }
    }

    public void clearAllForTesting() {
        attemptsMap.clear();
        lastLockoutEndMap.clear();
    }
}
