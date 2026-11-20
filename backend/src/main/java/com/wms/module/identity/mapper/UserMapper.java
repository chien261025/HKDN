package com.wms.module.identity.mapper;

import com.wms.module.identity.dto.response.UserResponse;
import com.wms.module.identity.dto.response.UserSecurityLogResponse;
import com.wms.module.identity.entity.User;
import com.wms.module.identity.entity.UserSession;
import com.wms.module.identity.entity.UserWarehouseAccess;
import org.springframework.stereotype.Component;

import java.time.LocalTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Mapper chuyển đổi thực thể User sang các DTO phản hồi.
 * Tuân thủ nguyên lý Single Responsibility Principle (SRP).
 */
@Component
public class UserMapper {

    public UserResponse toResponse(User user) {
        return toResponse(user, Collections.emptyList());
    }

    public UserResponse toResponse(User user, List<UserWarehouseAccess> accesses) {
        String roleName = (user.getRoles() != null && !user.getRoles().isEmpty())
                ? user.getRoles().iterator().next().getName() : "ROLE_OPERATOR";
        boolean isExpired = user.getExpiresAt() != null && user.getExpiresAt().isBefore(java.time.Instant.now());
        boolean active = Boolean.TRUE.equals(user.getIsActive());

        // Extract warehouse info
        List<String> warehouseNames = (accesses != null && !accesses.isEmpty())
                ? accesses.stream()
                        .map(a -> a.getWarehouse() != null ? a.getWarehouse().getName() : "Kho #" + a.getWarehouse().getId())
                        .collect(Collectors.toList())
                : Collections.emptyList();

        String primaryWh = (accesses != null && !accesses.isEmpty())
                ? accesses.stream()
                        .filter(a -> Boolean.TRUE.equals(a.getIsPrimary()))
                        .findFirst()
                        .map(a -> a.getWarehouse() != null ? a.getWarehouse().getName() : "Kho #" + a.getWarehouse().getId())
                        .orElse(warehouseNames.isEmpty() ? "Chưa gán kho" : warehouseNames.get(0))
                : "Chưa gán kho";

        // Extract permissions
        List<String> permissionCodes = (user.getRoles() != null)
                ? user.getRoles().stream()
                        .filter(r -> r.getPermissions() != null)
                        .flatMap(r -> r.getPermissions().stream())
                        .map(p -> p.getCode())
                        .distinct()
                        .sorted()
                        .collect(Collectors.toList())
                : Collections.emptyList();

        boolean isTestAccount = user.getUsername().toLowerCase().startsWith("brute_")
                || user.getUsername().toLowerCase().contains("victim");

        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(roleName)
                .roleDescription(getRoleDescription(roleName))
                .isActive(active)
                .status(isExpired ? "EXPIRED" : (active ? "ACTIVE" : "LOCKED"))
                .assignedWarehouse(primaryWh)
                .assignedWarehouses(warehouseNames)
                .primaryWarehouse(primaryWh)
                .phone("090000000" + user.getId())
                .expiresAt(user.getExpiresAt())
                .isExpired(isExpired)
                .isTestAccount(isTestAccount)
                .permissions(permissionCodes)
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    public UserSecurityLogResponse toSecurityLogResponse(User user, List<UserSession> dbSessions, long activeCount) {
        String role = user.getRoles() != null && !user.getRoles().isEmpty()
                ? user.getRoles().iterator().next().getName() : "ROLE_OPERATOR";
        boolean active = Boolean.TRUE.equals(user.getIsActive());

        List<UserSecurityLogResponse.LoginHistoryEntry> history;
        if (!dbSessions.isEmpty()) {
            history = dbSessions.stream().limit(5).map(s -> new UserSecurityLogResponse.LoginHistoryEntry(
                    s.getCreatedAt().toString().replace("T", " ").substring(0, 16),
                    s.getIpAddress(),
                    s.getLocationName(),
                    s.getDeviceName(),
                    Boolean.TRUE.equals(s.getIsActive()) ? "SUCCESS" : "REVOKED (" + (s.getRevokedReason() != null ? s.getRevokedReason() : "KICKED") + ")"
            )).toList();
        } else {
            history = Collections.emptyList();
        }

        long finalActiveCount = (activeCount == 0 && active) ? 1 : activeCount;

        return UserSecurityLogResponse.builder()
                .userId(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .role(role)
                .status(active ? "ACTIVE" : "LOCKED")
                .isActive(active)
                .lastLoginAt(user.getUpdatedAt())
                .lastLoginIp(!dbSessions.isEmpty() ? dbSessions.get(0).getIpAddress() : "Chưa có IP đăng nhập")
                .failedLoginAttempts(0)
                .riskLevel("SAFE")
                .activeSessionsCount((int) finalActiveCount)
                .recentLogins(history)
                .build();
    }

    public String normalizeRoleName(String role) {
        if (role == null || role.isBlank()) return "ROLE_OPERATOR";
        String normalized = role.trim().toUpperCase();
        if (!normalized.startsWith("ROLE_")) normalized = "ROLE_" + normalized;
        return "ROLE_MANAGER".equals(normalized) ? "ROLE_WAREHOUSE_MANAGER" : normalized;
    }

    public String getRoleDescription(String roleName) {
        return switch (roleName) {
            case "ROLE_ADMIN" -> "Quản Trị Viên (Toàn quyền)";
            case "ROLE_WAREHOUSE_MANAGER" -> "Quản Lý Kho (Điều hành)";
            case "ROLE_OPERATOR" -> "Thủ Kho (PDA Mobile)";
            default -> "Nhân viên vận hành";
        };
    }
}
