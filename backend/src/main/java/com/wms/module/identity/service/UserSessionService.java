package com.wms.module.identity.service;

import com.wms.module.identity.dto.response.UserSessionResponse;
import com.wms.module.identity.entity.User;
import com.wms.module.identity.entity.UserSession;

import java.util.List;

public interface UserSessionService {

    int MAX_CONCURRENT_SESSIONS = 2; // Giới hạn tối đa 2 thiết bị đồng thời

    UserSession registerSession(User user, String jwtToken, String deviceName, String deviceType, String ipAddress, String locationName);

    List<UserSessionResponse> getUserSessions(Long userId, String currentToken);

    void revokeSession(Long userId, String sessionId);

    void revokeOtherSessions(Long userId, String currentToken);

    void revokeCurrentToken(String jwtToken);

    void revokeAllSessions(Long userId, String reason);

    boolean isTokenRevoked(String jwtToken);
    void updateSessionLocation(Long userId, String token, String location, String ip);
    List<com.wms.module.masterdata.entity.Warehouse> getTrustedNetworks();
    void updateWarehouseTrustedIps(Long warehouseId, String trustedIps);
}


