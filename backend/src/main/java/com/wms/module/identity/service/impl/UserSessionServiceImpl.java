package com.wms.module.identity.service.impl;

import com.wms.common.exception.BusinessException;
import com.wms.common.exception.ErrorCode;
import com.wms.module.identity.dto.response.UserSessionResponse;
import com.wms.module.identity.entity.User;
import com.wms.module.identity.entity.UserSession;
import com.wms.module.identity.repository.UserSessionRepository;
import com.wms.module.identity.service.UserSessionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserSessionServiceImpl implements UserSessionService {

    private final UserSessionRepository sessionRepository;

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
                log.warn("Nguoi dung {} vuot qua gioi han {} thiet bi dong thoi. Cuong che thu hoi phien cu: [{}]",
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
        String currentHash = hashToken(currentToken);
        return sessionRepository.findByUserIdOrderByLastActiveAtDesc(userId).stream()
                .map(s -> UserSessionResponse.builder()
                        .id(s.getId())
                        .userId(s.getUser().getId())
                        .username(s.getUser().getUsername())
                        .deviceName(s.getDeviceName())
                        .deviceType(s.getDeviceType())
                        .ipAddress(s.getIpAddress())
                        .locationName(s.getLocationName())
                        .isActive(Boolean.TRUE.equals(s.getIsActive()))
                        .isCurrentSession(currentHash != null && currentHash.equals(s.getTokenHash()))
                        .createdAt(s.getCreatedAt())
                        .lastActiveAt(s.getLastActiveAt())
                        .revokedReason(s.getRevokedReason())
                        .build())
                .toList();
    }

    @Override
    @Transactional
    public void revokeSession(Long userId, String sessionId) {
        UserSession session = sessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy phiên làm việc: " + sessionId));
        session.setIsActive(false);
        session.setRevokedReason("USER_REMOTE_LOGOUT");
        session.setLastActiveAt(Instant.now());
        sessionRepository.save(session);
        log.info("Da thu hoi phien thiet bi: {} cua user: {}", sessionId, userId);
    }

    @Override
    @Transactional
    public void revokeOtherSessions(Long userId, String currentToken) {
        String currentHash = hashToken(currentToken);
        Optional<UserSession> current = sessionRepository.findFirstByTokenHashOrderByCreatedAtDesc(currentHash);
        String excludeId = current.map(UserSession::getId).orElse("NONE");
        sessionRepository.revokeOtherSessions(userId, excludeId, "USER_LOGOUT_ALL_OTHERS", Instant.now());
        log.info("Da dang xuat tat ca thiet bi khac cua user id: {}", userId);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isTokenRevoked(String jwtToken) {
        if (jwtToken == null || jwtToken.isBlank()) return true;
        String hash = hashToken(jwtToken);
        return sessionRepository.findFirstByTokenHashOrderByCreatedAtDesc(hash)
                .map(s -> Boolean.FALSE.equals(s.getIsActive()))
                .orElse(false);
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
}
