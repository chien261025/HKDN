package com.wms.module.identity.service;

import com.wms.module.identity.dto.request.CreateUserRequest;
import com.wms.module.identity.dto.response.UserResponse;

import java.util.List;

public interface UserService {
    List<UserResponse> getAllUsers();
    UserResponse getUserById(Long id);
    UserResponse createUser(CreateUserRequest request);
    UserResponse updateUserStatus(Long id, Boolean isActive);
    UserResponse updateUserRole(Long id, String newRole);
    void resetPassword(Long id, String newPassword);
    void changePassword(com.wms.module.identity.dto.request.ChangePasswordRequest request);
}
