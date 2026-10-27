package com.wms.module.identity.service;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpService {

    private static final long OTP_VALID_SECONDS = 180; // 3 phút

    private static class OtpEntry {
        String code;
        Instant expiresAt;

        OtpEntry(String code, Instant expiresAt) {
            this.code = code;
            this.expiresAt = expiresAt;
        }
    }

    private final Map<String, OtpEntry> otpStorage = new ConcurrentHashMap<>();
    private final Random random = new Random();

    public String generateOtp(String key) {
        if (key == null) return null;
        String cleanKey = key.trim().toLowerCase();
        String code = String.format("%06d", random.nextInt(1000000));
        otpStorage.put(cleanKey, new OtpEntry(code, Instant.now().plusSeconds(OTP_VALID_SECONDS)));
        return code;
    }

    public boolean checkOtp(String key, String inputCode) {
        if (key == null || inputCode == null) return false;
        String cleanKey = key.trim().toLowerCase();
        OtpEntry entry = otpStorage.get(cleanKey);

        if (entry == null) return false;
        if (Instant.now().isAfter(entry.expiresAt)) {
            otpStorage.remove(cleanKey);
            return false;
        }

        return entry.code.equals(inputCode.trim());
    }

    public boolean verifyAndConsumeOtp(String key, String inputCode) {
        boolean isValid = checkOtp(key, inputCode);
        if (isValid) {
            otpStorage.remove(key.trim().toLowerCase());
        }
        return isValid;
    }
}
