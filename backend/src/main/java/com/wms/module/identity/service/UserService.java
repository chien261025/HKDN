package com.wms.module.identity.service;

import com.wms.module.identity.dto.request.CreateUserRequest;
import com.wms.module.identity.dto.response.UserResponse;

import java.util.List;

public interface UserService {
    List<UserResponse> getAllUsers();
    UserResponse getUserById(Long id);
    UserResponse createUser(CreateUserRequest request);
    UserResponse updateUserStatus(Long id, Boolean isActive);
    void bulkUpdateStatus(com.wms.module.identity.dto.request.BulkUpdateStatusRequest request);
    UserResponse updateUserRole(Long id, String newRole);
    void resetPassword(Long id, String newPassword, boolean mustChangePassword);
    default void resetPassword(Long id, String newPassword) {
        resetPassword(id, newPassword, false);
    }
    void changePassword(com.wms.module.identity.dto.request.ChangePasswordRequest request);
    UserResponse updateUser(Long id, com.wms.module.identity.dto.request.UpdateUserRequest request);
    void forceLogout(Long id);
    com.wms.module.identity.dto.response.UserSecurityLogResponse getUserSecurityLog(Long id);
}

