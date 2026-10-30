package com.wms.module.identity.service.impl;

import com.wms.common.exception.BusinessException;
import com.wms.common.exception.ErrorCode;
import com.wms.module.identity.dto.request.ChangePasswordRequest;
import com.wms.module.identity.dto.request.CreateUserRequest;
import com.wms.module.identity.dto.request.UpdateUserRequest;
import com.wms.module.identity.dto.response.UserResponse;
import com.wms.module.identity.dto.response.UserSecurityLogResponse;
import com.wms.module.identity.entity.Role;
import com.wms.module.identity.entity.User;
import com.wms.module.identity.mapper.UserMapper;
import com.wms.module.identity.repository.RoleRepository;
import com.wms.module.identity.repository.UserRepository;
import com.wms.module.identity.repository.UserSessionRepository;
import com.wms.module.identity.service.UserService;
import com.wms.module.identity.service.UserSessionService;
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
    private final UserSessionRepository sessionRepository;
    private final UserSessionService userSessionService;
    private final UserMapper userMapper;

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll(Sort.by(Sort.Direction.ASC, "id"))
                .stream()
                .map(userMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy người dùng với ID: " + id));
        return userMapper.toResponse(user);
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

        String roleName = userMapper.normalizeRoleName(request.getRole());
        Role role = roleRepository.findByName(roleName).orElseGet(() ->
                roleRepository.save(Role.builder()
                        .name(roleName)
                        .description(userMapper.getRoleDescription(roleName))
                        .build())
        );

        User newUser = User.builder()
                .username(cleanUsername)
                .passwordHash(passwordEncoder.encode(request.getPassword().trim()))
                .fullName(request.getFullName().trim())
                .email(cleanEmail)
                .roles(new HashSet<>(Set.of(role)))
                .isActive(true)
                .expiresAt(request.getExpiresAt())
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        User savedUser = userRepository.save(newUser);
        log.info("Admin da tao moi user: {} voi vai tro: {}", cleanUsername, roleName);
        return userMapper.toResponse(savedUser);
    }

    @Override
    @Transactional
    public UserResponse updateUserStatus(Long id, Boolean isActive) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy tài khoản với ID: " + id));

        if ("admin".equalsIgnoreCase(user.getUsername()) && Boolean.FALSE.equals(isActive)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Không thể khóa tài khoản Quản trị viên tối cao (admin)!");
        }

        user.setIsActive(isActive);
        user.setUpdatedAt(Instant.now());
        User updated = userRepository.save(user);

        if (Boolean.FALSE.equals(isActive)) {
            userSessionService.revokeAllSessions(user.getId(), "ADMIN_LOCK_STATUS");
        }

        log.info("Cap nhat trang thai user {} -> isActive: {}", user.getUsername(), isActive);
        return userMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public void bulkUpdateStatus(com.wms.module.identity.dto.request.BulkUpdateStatusRequest request) {
        if (request.getUserIds() == null || request.getUserIds().isEmpty()) {
            return;
        }

        List<User> targetUsers = userRepository.findAllById(request.getUserIds());
        for (User u : targetUsers) {
            // Không bao giờ khóa tài khoản admin tối cao
            if ("admin".equalsIgnoreCase(u.getUsername()) && Boolean.FALSE.equals(request.getIsActive())) {
                continue;
            }
            u.setIsActive(request.getIsActive());
            u.setUpdatedAt(Instant.now());

            if (Boolean.FALSE.equals(request.getIsActive())) {
                userSessionService.revokeAllSessions(u.getId(), "ADMIN_BULK_LOCK");
            }
        }
        userRepository.saveAll(targetUsers);
        log.info("Admin da cap nhat trang thai hang loat cho {} tai khoan -> isActive: {}", targetUsers.size(), request.getIsActive());
    }

    @Override
    @Transactional
    public UserResponse updateUserRole(Long id, String newRole) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy tài khoản với ID: " + id));

        String roleName = userMapper.normalizeRoleName(newRole);
        Role role = roleRepository.findByName(roleName).orElseGet(() ->
                roleRepository.save(Role.builder()
                        .name(roleName)
                        .description(userMapper.getRoleDescription(roleName))
                        .build())
        );

        user.setRoles(new HashSet<>(Set.of(role)));
        user.setUpdatedAt(Instant.now());
        User updated = userRepository.save(user);

        log.info("Cap nhat vai tro user {} -> {}", user.getUsername(), roleName);
        return userMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public void resetPassword(Long id, String newPassword, boolean mustChangePassword) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy tài khoản với ID: " + id));

        if ("admin".equalsIgnoreCase(user.getUsername())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Không thể cấp lại mật khẩu cho tài khoản Quản trị viên tối cao. Vui lòng đổi mật khẩu tại trang Hồ sơ cá nhân!");
        }

        String targetPassword = (newPassword != null && !newPassword.isBlank()) ? newPassword.trim() : "123456";
        user.setPasswordHash(passwordEncoder.encode(targetPassword));
        user.setMustChangePassword(mustChangePassword);
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);

        userSessionService.revokeAllSessions(user.getId(), "ADMIN_RESET_PASSWORD_REVOKE");
        log.info("Da reset mat khau (mustChangePassword={}) va huy toan bo phien cu cua user: {}", mustChangePassword, user.getUsername());
    }

    @Override
    public void resetPassword(Long id, String newPassword) {
        resetPassword(id, newPassword, false);
    }

    @Override
    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy người dùng: " + request.getUsername()));

        boolean matches = passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash());
        if (!matches) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Mật khẩu hiện tại không chính xác!");
        }

        if (request.getNewPassword().equals(request.getCurrentPassword())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Mật khẩu mới không được trùng với mật khẩu hiện tại!");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword().trim()));
        user.setMustChangePassword(false);
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);

        userSessionService.revokeAllSessions(user.getId(), "USER_CHANGE_PASSWORD_REVOKE");
        log.info("Nguoi dung {} da doi mat khau va huy toan bo phien cu thanh cong", user.getUsername());
    }

    @Override
    @Transactional
    public UserResponse updateUser(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy người dùng: " + id));

        String cleanEmail = request.getEmail().trim().toLowerCase();
        if (!cleanEmail.equalsIgnoreCase(user.getEmail()) && userRepository.existsByEmail(cleanEmail)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Email '" + cleanEmail + "' đã được sử dụng!");
        }

        user.setFullName(request.getFullName().trim());
        user.setEmail(cleanEmail);

        if ("admin".equalsIgnoreCase(user.getUsername())) {
            user.setExpiresAt(null);
        } else {
            user.setExpiresAt(request.getExpiresAt());
        }

        if (request.getRole() != null && !request.getRole().isBlank()) {
            if ("admin".equalsIgnoreCase(user.getUsername()) && !"ROLE_ADMIN".equalsIgnoreCase(request.getRole())) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, "Không thể hạ quyền Quản trị viên tối cao (root admin)!");
            }
            String roleName = userMapper.normalizeRoleName(request.getRole());
            Role role = roleRepository.findByName(roleName).orElseGet(() ->
                    roleRepository.save(Role.builder().name(roleName).description(userMapper.getRoleDescription(roleName)).build()));
            user.setRoles(new HashSet<>(Set.of(role)));
        }

        user.setUpdatedAt(Instant.now());
        log.info("Cap nhat thong tin user: {}", user.getUsername());
        return userMapper.toResponse(userRepository.save(user));
    }

    @Override
    @Transactional
    public void forceLogout(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy tài khoản: " + id));
        userSessionService.revokeAllSessions(user.getId(), "ADMIN_FORCE_LOGOUT");
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);
        log.info("Admin da Force Logout toan bo thiet bi cua user: {}", user.getUsername());
    }

    @Override
    @Transactional(readOnly = true)
    public UserSecurityLogResponse getUserSecurityLog(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy tài khoản: " + id));

        var dbSessions = sessionRepository.findByUserIdOrderByLastActiveAtDesc(user.getId());
        long activeCount = sessionRepository.countByUserIdAndIsActiveTrue(user.getId());

        return userMapper.toSecurityLogResponse(user, dbSessions, activeCount);
    }
}
