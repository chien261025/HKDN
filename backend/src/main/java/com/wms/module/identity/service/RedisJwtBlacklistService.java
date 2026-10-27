package com.wms.module.identity.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;

/**
 * Quản lý danh sách đen JWT (JWT Blacklist) phân tán bằng Redis Key TTL.
 * Đồng bộ trạng thái hủy phiên (Logout, Đổi mật khẩu, Giới hạn 2 thiết bị)
 * trên toàn bộ cụm máy chủ Backend với độ trễ O(1).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RedisJwtBlacklistService {

    private final StringRedisTemplate stringRedisTemplate;
    private static final String BLACKLIST_PREFIX = "wms:jwt:blacklist:";

    public String hashToken(String token) {
        if (token == null) return "";
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            return String.valueOf(token.hashCode());
        }
    }

    public void blacklistToken(String jwtToken, Duration ttl, String reason) {
        if (jwtToken == null || jwtToken.isBlank()) return;
        try {
            String tokenHash = hashToken(jwtToken);
            String key = BLACKLIST_PREFIX + tokenHash;
            stringRedisTemplate.opsForValue().set(key, reason != null ? reason : "REVOKED", ttl);
            log.info("[REDIS-BLACKLIST] Da dua token vao danh sach den: {} | Ly do: {} | TTL: {}s",
                    tokenHash.substring(0, Math.min(10, tokenHash.length())), reason, ttl.toSeconds());
        } catch (Exception e) {
            log.warn("[REDIS-BLACKLIST] Khong the ghi token blacklist vao Redis: {}", e.getMessage());
        }
    }

    public boolean isBlacklisted(String jwtToken) {
        if (jwtToken == null || jwtToken.isBlank()) return false;
        try {
            String tokenHash = hashToken(jwtToken);
            Boolean exists = stringRedisTemplate.hasKey(BLACKLIST_PREFIX + tokenHash);
            return Boolean.TRUE.equals(exists);
        } catch (Exception e) {
            log.warn("[REDIS-BLACKLIST] Loi khi kiem tra blacklist tu Redis: {}", e.getMessage());
            return false;
        }
    }

    public void removeBlacklist(String jwtToken) {
        try {
            stringRedisTemplate.delete(BLACKLIST_PREFIX + hashToken(jwtToken));
        } catch (Exception ignored) {}
    }
}
