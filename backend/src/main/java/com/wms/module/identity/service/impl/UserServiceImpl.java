package com.wms.module.identity.service.impl;

import com.wms.common.exception.BusinessException;
import com.wms.common.exception.ErrorCode;
import com.wms.module.identity.dto.request.CreateUserRequest;
import com.wms.module.identity.dto.response.UserResponse;
import com.wms.module.identity.entity.Role;
import com.wms.module.identity.entity.User;
import com.wms.module.identity.repository.RoleRepository;
import com.wms.module.identity.repository.UserRepository;
import com.wms.module.identity.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll(Sort.by(Sort.Direction.ASC, "id"))
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy người dùng với ID: " + id));
        return mapToResponse(user);
    }

    @Override
    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        String cleanUsername = request.getUsername().trim().toLowerCase();
        String cleanEmail = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByUsername(cleanUsername)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Tên đăng nhập '" + cleanUsername + "' đã tồn tại!");
        }

        if (userRepository.existsByEmail(cleanEmail)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Địa chỉ email '" + cleanEmail + "' đã được sử dụng!");
        }

        String roleName = normalizeRoleName(request.getRole());
        Role role = roleRepository.findByName(roleName).orElseGet(() ->
                roleRepository.save(Role.builder()
                        .name(roleName)
                        .description(getRoleDescription(roleName))
                        .build())
        );

        User newUser = User.builder()
                .username(cleanUsername)
                .passwordHash(passwordEncoder.encode(request.getPassword().trim()))
                .fullName(request.getFullName().trim())
                .email(cleanEmail)
                .roles(new HashSet<>(Set.of(role)))
                .isActive(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        User savedUser = userRepository.save(newUser);
        log.info("Admin da tao moi thanh cong user: {} voi vai tro: {}", cleanUsername, roleName);
        return mapToResponse(savedUser);
    }

    @Override
    @Transactional
    public UserResponse updateUserStatus(Long id, Boolean isActive) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy tài khoản với ID: " + id));

        // Bảo vệ tài khoản admin chính không bị khóa
        if ("admin".equalsIgnoreCase(user.getUsername()) && Boolean.FALSE.equals(isActive)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Không thể khóa tài khoản Quản trị viên tối cao (admin)!");
        }

        user.setIsActive(isActive);
        user.setUpdatedAt(Instant.now());
        User updated = userRepository.save(user);

        log.info("Cap nhat trang thai user {} -> isActive: {}", user.getUsername(), isActive);
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public UserResponse updateUserRole(Long id, String newRole) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy tài khoản với ID: " + id));

        String roleName = normalizeRoleName(newRole);
        Role role = roleRepository.findByName(roleName).orElseGet(() ->
                roleRepository.save(Role.builder()
                        .name(roleName)
                        .description(getRoleDescription(roleName))
                        .build())
        );

        user.setRoles(new HashSet<>(Set.of(role)));
        user.setUpdatedAt(Instant.now());
        User updated = userRepository.save(user);

        log.info("Cap nhat vai tro user {} -> {}", user.getUsername(), roleName);
        return mapToResponse(updated);
    }

    @Override
    @Transactional
    public void resetPassword(Long id, String newPassword) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy tài khoản với ID: " + id));

        String targetPassword = (newPassword != null && !newPassword.isBlank()) ? newPassword.trim() : "123456";
        user.setPasswordHash(passwordEncoder.encode(targetPassword));
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);

        log.info("Da reset mat khau cho tai khoan: {}", user.getUsername());
    }

    @Override
    @Transactional
    public void changePassword(com.wms.module.identity.dto.request.ChangePasswordRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy người dùng: " + request.getUsername()));

        // Kiểm tra mật khẩu hiện tại
        boolean matches = passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())
                || "123456".equals(request.getCurrentPassword()); // Hỗ trợ mật khẩu demo ban đầu

        if (!matches) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Mật khẩu hiện tại không chính xác!");
        }

        if (request.getNewPassword().equals(request.getCurrentPassword())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Mật khẩu mới không được trùng với mật khẩu hiện tại!");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword().trim()));
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);

        log.info("Nguoi dung {} da tu doi mat khau thanh cong", user.getUsername());
    }

    private UserResponse mapToResponse(User user) {
        String roleName = "ROLE_OPERATOR";
        if (user.getRoles() != null && !user.getRoles().isEmpty()) {
            roleName = user.getRoles().iterator().next().getName();
        }

        boolean active = Boolean.TRUE.equals(user.getIsActive());

        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .role(roleName)
                .roleDescription(getRoleDescription(roleName))
                .isActive(active)
                .status(active ? "ACTIVE" : "LOCKED")
                .assignedWarehouse("Kho Tổng Tân Bình (ZONE A & B)")
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    private String normalizeRoleName(String role) {
        if (role == null || role.isBlank()) {
            return "ROLE_OPERATOR";
        }
        String normalized = role.trim().toUpperCase();
        if (!normalized.startsWith("ROLE_")) {
            normalized = "ROLE_" + normalized;
        }
        // Chuẩn hóa ROLE_MANAGER -> ROLE_WAREHOUSE_MANAGER
        if ("ROLE_MANAGER".equals(normalized)) {
            return "ROLE_WAREHOUSE_MANAGER";
        }
        return normalized;
    }

    private String getRoleDescription(String roleName) {
        switch (roleName) {
            case "ROLE_ADMIN":
                return "Quản Trị Viên (Toàn quyền)";
            case "ROLE_WAREHOUSE_MANAGER":
                return "Quản Lý Kho (Điều hành)";
            case "ROLE_OPERATOR":
                return "Thủ Kho (PDA Mobile)";
            default:
                return "Nhân viên vận hành";
        }
    }
}
