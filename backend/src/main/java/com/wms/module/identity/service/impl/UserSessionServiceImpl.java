package com.wms.module.identity.service.impl;

import com.wms.common.exception.BusinessException;
import com.wms.common.exception.ErrorCode;
import com.wms.module.identity.dto.response.UserSessionResponse;
import com.wms.module.identity.entity.User;
import com.wms.module.identity.entity.UserSession;
import com.wms.module.identity.repository.UserSessionRepository;
import com.wms.module.identity.service.RedisJwtBlacklistService;
import com.wms.module.identity.service.UserSessionService;
import com.wms.module.masterdata.entity.Warehouse;
import com.wms.module.masterdata.repository.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserSessionServiceImpl implements UserSessionService {

    private final UserSessionRepository sessionRepository;
    private final WarehouseRepository warehouseRepository;
    private final RedisJwtBlacklistService redisJwtBlacklistService;

    @Override
    @Transactional
    public UserSession registerSession(User user, String jwtToken, String deviceName, String deviceType, String ipAddress, String locationName) {
        List<UserSession> activeSessions = sessionRepository.findByUserIdAndIsActiveTrueOrderByLastActiveAtAsc(user.getId());
        if (activeSessions.size() >= MAX_CONCURRENT_SESSIONS) {
            int toRevokeCount = activeSessions.size() - MAX_CONCURRENT_SESSIONS + 1;
            for (int i = 0; i < toRevokeCount && i < activeSessions.size(); i++) {
                UserSession oldest = activeSessions.get(i);
                oldest.setIsActive(false);
                oldest.setRevokedReason("KICKED_FIFO_BY_NEW_DEVICE");
                oldest.setLastActiveAt(Instant.now());
                sessionRepository.save(oldest);
                redisJwtBlacklistService.blacklistToken(oldest.getTokenHash(), Duration.ofHours(24), "KICKED_FIFO_BY_NEW_DEVICE");
                log.warn("Nguoi dung {} vuot qua gioi han {} thiet bi. Da thu hoi phien cu tren Redis: [{}]",
                        user.getUsername(), MAX_CONCURRENT_SESSIONS, oldest.getDeviceName());
            }
        }

        String tokenHash = hashToken(jwtToken);
        UserSession session = UserSession.builder()
                .id(UUID.randomUUID().toString())
                .user(user)
                .deviceName(deviceName)
                .deviceType(deviceType)
                .ipAddress(ipAddress)
                .locationName(locationName)
                .tokenHash(tokenHash)
                .isActive(true)
                .createdAt(Instant.now())
                .lastActiveAt(Instant.now())
                .build();

        return sessionRepository.save(session);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserSessionResponse> getUserSessions(Long userId, String currentToken) {
        String currentHash = (currentToken != null && !currentToken.isBlank()) ? hashToken(currentToken) : "";
        List<UserSession> sessions = sessionRepository.findByUserIdOrderByLastActiveAtDesc(userId);

        return sessions.stream().map(s -> {
            boolean isCurrent = s.getTokenHash() != null && s.getTokenHash().equals(currentHash);
            return UserSessionResponse.builder()
                    .id(s.getId())
                    .userId(userId)
                    .deviceName(s.getDeviceName())
                    .deviceType(s.getDeviceType())
                    .ipAddress(s.getIpAddress())
                    .locationName(s.getLocationName())
                    .createdAt(s.getCreatedAt())
                    .lastActiveAt(s.getLastActiveAt())
                    .isCurrentSession(isCurrent)
                    .isActive(s.getIsActive())
                    .revokedReason(s.getRevokedReason())
                    .build();
        }).toList();
    }

    @Override
    @Transactional
    public void revokeSession(Long userId, String sessionId) {
        UserSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy phiên làm việc"));

        if (!session.getUser().getId().equals(userId)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "Bạn không có quyền thu hồi phiên này");
        }

        session.setIsActive(false);
        session.setRevokedReason("USER_MANUAL_REVOKE");
        session.setLastActiveAt(Instant.now());
        sessionRepository.save(session);
        redisJwtBlacklistService.blacklistToken(session.getTokenHash(), Duration.ofHours(24), "USER_MANUAL_REVOKE");
    }

    @Override
    @Transactional
    public void revokeOtherSessions(Long userId, String currentToken) {
        String currentHash = hashToken(currentToken);
        List<UserSession> activeSessions = sessionRepository.findByUserIdAndIsActiveTrueOrderByLastActiveAtAsc(userId);

        for (UserSession s : activeSessions) {
            if (!s.getTokenHash().equals(currentHash)) {
                s.setIsActive(false);
                s.setRevokedReason("REVOKED_OTHER_SESSIONS");
                s.setLastActiveAt(Instant.now());
                sessionRepository.save(s);
                redisJwtBlacklistService.blacklistToken(s.getTokenHash(), Duration.ofHours(24), "REVOKED_OTHER_SESSIONS");
            }
        }
    }

    @Override
    @Transactional
    public void revokeCurrentToken(String jwtToken) {
        if (jwtToken == null || jwtToken.isBlank()) return;
        String hash = hashToken(jwtToken);
        redisJwtBlacklistService.blacklistToken(jwtToken, Duration.ofHours(24), "USER_LOGOUT");
        redisJwtBlacklistService.blacklistToken(hash, Duration.ofHours(24), "USER_LOGOUT");

        sessionRepository.findFirstByTokenHashOrderByCreatedAtDesc(hash)
                .ifPresent(session -> {
                    session.setIsActive(false);
                    session.setRevokedReason("USER_LOGOUT");
                    session.setLastActiveAt(Instant.now());
                    sessionRepository.save(session);
                    log.info("Da huy session {} cua user {}", session.getId(), session.getUser().getUsername());
                });
    }

    @Override
    @Transactional
    public void revokeAllSessions(Long userId, String reason) {
        List<UserSession> activeSessions = sessionRepository.findByUserIdAndIsActiveTrueOrderByLastActiveAtAsc(userId);
        for (UserSession s : activeSessions) {
            redisJwtBlacklistService.blacklistToken(s.getTokenHash(), Duration.ofHours(24), reason);
        }
        sessionRepository.revokeAllSessions(userId, reason, Instant.now());
        log.info("Da thu hoi toan bo session cua user id: {} tren CSDL va Redis voi ly do: {}", userId, reason);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isTokenRevoked(String jwtToken) {
        if (jwtToken == null || jwtToken.isBlank()) return true;
        if (redisJwtBlacklistService.isBlacklisted(jwtToken)) {
            return true;
        }
        String hash = hashToken(jwtToken);
        if (redisJwtBlacklistService.isBlacklisted(hash)) {
            return true;
        }
        return sessionRepository.findFirstByTokenHashOrderByCreatedAtDesc(hash)
                .map(s -> Boolean.FALSE.equals(s.getIsActive()))
                .orElse(false);
    }

    @Override
    @Transactional
    public void updateSessionLocation(Long userId, String token, String location, String ip) {
        if (token == null || token.isBlank()) return;
        String hash = hashToken(token);
        sessionRepository.findFirstByTokenHashOrderByCreatedAtDesc(hash).ifPresent(s -> {
            if (location != null && !location.isBlank()) s.setLocationName(location);
            if (ip != null && !ip.isBlank()) s.setIpAddress(ip);
            s.setLastActiveAt(Instant.now());
            sessionRepository.save(s);
            log.info("Cap nhat vi tri phien lam viec: [{}] - [{}]", location, ip);
        });
    }

    private String hashToken(String token) {
        if (token == null || token.isBlank()) return "";
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
            return Integer.toHexString(token.hashCode());
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<Warehouse> getTrustedNetworks() {
        return warehouseRepository.findAll();
    }

    @Override
    @Transactional
    public void updateWarehouseTrustedIps(Long warehouseId, String trustedIps) {
        Warehouse warehouse = warehouseRepository.findById(warehouseId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy kho"));
        warehouse.setTrustedIps(trustedIps);
        warehouseRepository.save(warehouse);
    }
}
