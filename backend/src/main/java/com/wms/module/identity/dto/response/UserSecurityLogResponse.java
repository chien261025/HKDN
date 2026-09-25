package com.wms.module.identity.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Nhật ký an ninh và lịch sử đăng nhập tài khoản")
public class UserSecurityLogResponse {

    private Long userId;
    private String username;
    private String fullName;
    private String role;
    private String status;
    private Boolean isActive;
    private Instant lastLoginAt;
    private String lastLoginIp;
    private Integer failedLoginAttempts;
    private String riskLevel; // SAFE, LOW, MEDIUM, HIGH
    private Integer activeSessionsCount;
    private List<LoginHistoryEntry> recentLogins;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoginHistoryEntry {
        private String timestamp;
        private String ipAddress;
        private String location;
        private String userAgent;
        private String status; // SUCCESS, FAILED_BAD_PASSWORD, LOCKED
    }
}
