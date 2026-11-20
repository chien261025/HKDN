package com.wms.module.identity.service;

import com.wms.module.identity.dto.request.*;
import com.wms.module.identity.dto.response.*;

import java.util.List;

public interface UserService {
    List<UserResponse> getAllUsers();
    UserResponse getUserById(Long id);
    UserResponse createUser(CreateUserRequest request);
    UserResponse updateUserStatus(Long id, Boolean isActive);
    void bulkUpdateStatus(BulkUpdateStatusRequest request);
    UserResponse updateUserRole(Long id, String newRole);
    void resetPassword(Long id, String newPassword, boolean mustChangePassword);
    default void resetPassword(Long id, String newPassword) {
        resetPassword(id, newPassword, false);
    }
    void changePassword(ChangePasswordRequest request);
    UserResponse updateUser(Long id, UpdateUserRequest request);
    void forceLogout(Long id);
    UserSecurityLogResponse getUserSecurityLog(Long id);

    List<AuditLogResponse> getAuditLogs();
    List<AuditLogResponse> getUserAuditLogs(Long userId);
    List<RbacMatrixResponse> getRbacMatrix();
    void updateRbacMatrix(UpdateRbacMatrixRequest request);
}
