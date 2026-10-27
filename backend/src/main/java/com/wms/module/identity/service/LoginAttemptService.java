package com.wms.module.identity.service;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Chống tấn công dò quét Brute-Force mật khẩu theo cả Tài khoản, Địa chỉ IP và Thiết bị (Device Fingerprint).
 * Chặn đứng việc mở Tab ẩn danh (Incognito) hoặc đổi trình duyệt để vượt rào.
 * Cơ chế phạt tăng dần: 1 phút (60s) -> 3 phút (180s) -> 15 phút (900s) -> 30 phút...
 */
@Service
public class LoginAttemptService {

    public static final int MAX_ATTEMPTS = 5;

    public record LockResult(boolean blocked, long remainingSeconds, int lockLevel, int remainingAttempts) {}

    private static class AttemptRecord {
        int consecutiveFails = 1;
        int lockLevel = 0; // 0: chua khoa, 1: 1p, 2: 3p, 3: 15p...
        Instant blockedUntil;
        Instant lastAttemptAt = Instant.now();
    }

    private final Map<String, AttemptRecord> attemptsMap = new ConcurrentHashMap<>();

    public long calculateLockDurationSeconds(int level) {
        return switch (level) {
            case 1 -> 60;    // Lần 1: 1 phút
            case 2 -> 180;   // Lần 2: 3 phút
            case 3 -> 900;   // Lần 3: 15 phút
            default -> Math.min(3600, 900 + (long) (level - 3) * 900); // Lần 4+: 30p, 45p, tối đa 60p
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

    public LockResult checkStatus(String username, String clientIp, String deviceFingerprint) {
        long secUser = getRemainingBlockedSeconds(username);
        long secIp = getRemainingBlockedSeconds(formatIpKey(clientIp));
        long secDev = getRemainingBlockedSeconds(formatDevKey(deviceFingerprint));
        long maxRemaining = Math.max(secUser, Math.max(secIp, secDev));

        int userLevel = getLockLevel(username);
        int ipLevel = getLockLevel(formatIpKey(clientIp));
        int devLevel = getLockLevel(formatDevKey(deviceFingerprint));
        int maxLevel = Math.max(userLevel, Math.max(ipLevel, devLevel));

        int leftUser = getRemainingAttempts(username);
        int leftIp = getRemainingAttempts(formatIpKey(clientIp));
        int leftDev = getRemainingAttempts(formatDevKey(deviceFingerprint));
        int minLeft = Math.min(leftUser, Math.min(leftIp, leftDev));

        return new LockResult(maxRemaining > 0, maxRemaining, maxLevel, minLeft);
    }

    public boolean isBlocked(String key) {
        if (key == null || key.isBlank()) return false;
        AttemptRecord record = attemptsMap.get(cleanKey(key));
        if (record == null || record.blockedUntil == null) return false;
        if (Instant.now().isBefore(record.blockedUntil)) return true;
        record.blockedUntil = null;
        return false;
    }

    public long getRemainingBlockedSeconds(String key) {
        if (key == null || key.isBlank()) return 0;
        AttemptRecord record = attemptsMap.get(cleanKey(key));
        if (record == null || record.blockedUntil == null) return 0;
        long remaining = record.blockedUntil.getEpochSecond() - Instant.now().getEpochSecond();
        return Math.max(0, remaining);
    }

    public int getLockLevel(String key) {
        if (key == null || key.isBlank()) return 0;
        AttemptRecord record = attemptsMap.get(cleanKey(key));
        return (record != null) ? record.lockLevel : 0;
    }

    public int getRemainingAttempts(String key) {
        if (key == null || key.isBlank()) return MAX_ATTEMPTS;
        AttemptRecord record = attemptsMap.get(cleanKey(key));
        if (record == null) return MAX_ATTEMPTS;
        return Math.max(0, MAX_ATTEMPTS - record.consecutiveFails);
    }

    public LockResult registerFailure(String username, String clientIp, String deviceFingerprint) {
        LockResult userRes = registerSingleFailure(username);
        LockResult ipRes = registerSingleFailure(formatIpKey(clientIp));
        LockResult devRes = registerSingleFailure(formatDevKey(deviceFingerprint));

        long maxRemaining = Math.max(userRes.remainingSeconds(), Math.max(ipRes.remainingSeconds(), devRes.remainingSeconds()));
        int maxLevel = Math.max(userRes.lockLevel(), Math.max(ipRes.lockLevel(), devRes.lockLevel()));
        int minLeft = Math.min(userRes.remainingAttempts(), Math.min(ipRes.remainingAttempts(), devRes.remainingAttempts()));

        return new LockResult(maxRemaining > 0, maxRemaining, maxLevel, minLeft);
    }

    private LockResult registerSingleFailure(String key) {
        if (key == null || key.isBlank()) return new LockResult(false, 0, 0, MAX_ATTEMPTS);
        String k = cleanKey(key);
        AttemptRecord record = attemptsMap.compute(k, (unused, existing) -> {
            Instant now = Instant.now();
            if (existing == null) return new AttemptRecord();
            existing.lastAttemptAt = now;
            existing.consecutiveFails++;
            if (existing.consecutiveFails >= MAX_ATTEMPTS) {
                existing.lockLevel++; // Tăng mức phạt: 1 (1p), 2 (3p), 3 (15p)...
                long duration = calculateLockDurationSeconds(existing.lockLevel);
                existing.blockedUntil = now.plusSeconds(duration);
                existing.consecutiveFails = 0; // reset đợt nhập để sẵn sàng cho chu kỳ sau
            }
            return existing;
        });

        long remaining = (record.blockedUntil != null)
                ? Math.max(0, record.blockedUntil.getEpochSecond() - Instant.now().getEpochSecond())
                : 0;
        int left = Math.max(0, MAX_ATTEMPTS - record.consecutiveFails);
        return new LockResult(record.blockedUntil != null && remaining > 0, remaining, record.lockLevel, left);
    }

    public void loginSucceeded(String username, String clientIp, String deviceFingerprint) {
        if (username != null) attemptsMap.remove(cleanKey(username));
        if (clientIp != null) attemptsMap.remove(cleanKey(formatIpKey(clientIp)));
        if (deviceFingerprint != null) attemptsMap.remove(cleanKey(formatDevKey(deviceFingerprint)));
    }
}
