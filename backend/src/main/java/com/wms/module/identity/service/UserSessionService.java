package com.wms.module.identity.service;

import com.wms.module.identity.constant.SecurityConstants;
import com.wms.module.identity.dto.response.UserSessionResponse;
import com.wms.module.identity.entity.User;
import com.wms.module.identity.entity.UserSession;
import com.wms.module.masterdata.entity.Warehouse;

import java.util.List;

public interface UserSessionService {

    int MAX_CONCURRENT_SESSIONS = SecurityConstants.MAX_CONCURRENT_SESSIONS;

    UserSession registerSession(User user, String jwtToken, String deviceName, String deviceType, String ipAddress, String locationName);

    List<UserSessionResponse> getUserSessions(Long userId, String currentToken);

    void revokeSession(Long userId, String sessionId);

    void revokeOtherSessions(Long userId, String currentToken);

    void revokeCurrentToken(String jwtToken);

    void revokeAllSessions(Long userId, String reason);

    boolean isTokenRevoked(String jwtToken);

    void updateSessionLocation(Long userId, String token, String location, String ip);

    List<Warehouse> getTrustedNetworks();

    void updateWarehouseTrustedIps(Long warehouseId, String trustedIps);
}
