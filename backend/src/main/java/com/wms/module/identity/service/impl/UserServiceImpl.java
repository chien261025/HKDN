package com.wms.module.identity.service.impl;

import com.wms.common.exception.BusinessException;
import com.wms.common.exception.ErrorCode;
import com.wms.module.identity.dto.request.*;
import com.wms.module.identity.dto.response.*;
import com.wms.module.identity.entity.*;
import com.wms.module.identity.mapper.UserMapper;
import com.wms.module.identity.repository.*;
import com.wms.module.identity.service.UserService;
import com.wms.module.identity.service.UserSessionService;
import com.wms.module.identity.util.SecurityUtils;
import com.wms.module.masterdata.entity.Warehouse;
import com.wms.module.masterdata.repository.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final UserWarehouseAccessRepository userWarehouseAccessRepository;
    private final WarehouseRepository warehouseRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserSessionRepository sessionRepository;
    private final UserSessionService userSessionService;
    private final UserMapper userMapper;

    @Override
    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        List<User> users = userRepository.findAll(Sort.by(Sort.Direction.ASC, "id"));
        List<Long> userIds = users.stream().map(User::getId).toList();
        List<UserWarehouseAccess> allAccesses = userWarehouseAccessRepository.findByUserIdIn(userIds);
        Map<Long, List<UserWarehouseAccess>> accessByUserId = allAccesses.stream()
                .collect(Collectors.groupingBy(UserWarehouseAccess::getUserId));

        return users.stream()
                .map(u -> userMapper.toResponse(u, accessByUserId.getOrDefault(u.getId(), Collections.emptyList())))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy người dùng với ID: " + id));
        List<UserWarehouseAccess> accesses = userWarehouseAccessRepository.findByUserId(user.getId());
        return userMapper.toResponse(user, accesses);
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

        // Multi-warehouse assignment
        List<UserWarehouseAccess> accesses = new ArrayList<>();
        List<Long> whIds = request.getAssignedWarehouseIds();
        Long primaryId = request.getPrimaryWarehouseId();

        if (whIds == null || whIds.isEmpty()) {
            whIds = warehouseRepository.findAll().stream()
                    .map(Warehouse::getId)
                    .findFirst()
                    .map(List::of)
                    .orElse(Collections.emptyList());
        }
        if (primaryId == null) {
            primaryId = whIds.get(0);
        }

        for (Long whId : whIds) {
            Optional<Warehouse> whOpt = warehouseRepository.findById(whId);
            if (whOpt.isPresent()) {
                UserWarehouseAccess uwa = UserWarehouseAccess.builder()
                        .userId(savedUser.getId())
                        .warehouse(whOpt.get())
                        .isPrimary(whId.equals(primaryId))
                        .createdAt(Instant.now())
                        .build();
                accesses.add(userWarehouseAccessRepository.save(uwa));
            }
        }

        saveAuditLog("USER_CREATE", "USER", savedUser.getId().toString(), savedUser.getUsername(),
                "Khởi tạo tài khoản @" + savedUser.getUsername() + " (" + savedUser.getFullName() + ") với vai trò " + roleName);

        log.info("Admin da tao moi user: {} voi vai tro: {}", cleanUsername, roleName);
        return userMapper.toResponse(savedUser, accesses);
    }

    @Override
    @Transactional
    public UserResponse updateUserStatus(Long id, Boolean isActive) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy tài khoản với ID: " + id));

        if ("admin".equalsIgnoreCase(user.getUsername()) && Boolean.FALSE.equals(isActive)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Không thể khóa tài khoản Quản trị viên tối cao (root admin)!");
        }

        // Kiểm tra an toàn: Không được khóa Quản trị viên duy nhất còn lại
        if (Boolean.FALSE.equals(isActive) && isUserAdmin(user)) {
            long activeAdminCount = userRepository.findAll().stream()
                    .filter(u -> Boolean.TRUE.equals(u.getIsActive()) && isUserAdmin(u) && !u.getId().equals(user.getId()))
                    .count();
            if (activeAdminCount == 0) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, "Hệ thống phải duy trì ít nhất 1 Quản trị viên (Admin) đang hoạt động!");
            }
        }

        user.setIsActive(isActive);
        user.setUpdatedAt(Instant.now());
        User updated = userRepository.save(user);

        if (Boolean.FALSE.equals(isActive)) {
            userSessionService.revokeAllSessions(user.getId(), "ADMIN_LOCK_STATUS");
        }

        saveAuditLog(Boolean.TRUE.equals(isActive) ? "USER_UNLOCK" : "USER_LOCK", "USER",
                user.getId().toString(), user.getUsername(),
                Boolean.TRUE.equals(isActive) ? "Mở khóa hoạt động tài khoản" : "Tạm khóa tài khoản & thu hồi phiên làm việc");

        log.info("Cap nhat trang thai user {} -> isActive: {}", user.getUsername(), isActive);
        List<UserWarehouseAccess> accesses = userWarehouseAccessRepository.findByUserId(user.getId());
        return userMapper.toResponse(updated, accesses);
    }

    @Override
    @Transactional
    public void bulkUpdateStatus(BulkUpdateStatusRequest request) {
        if (request.getUserIds() == null || request.getUserIds().isEmpty()) {
            return;
        }

        List<User> targetUsers = userRepository.findAllById(request.getUserIds());
        int affectedCount = 0;
        for (User u : targetUsers) {
            // Không bao giờ khóa tài khoản admin tối cao
            if ("admin".equalsIgnoreCase(u.getUsername()) && Boolean.FALSE.equals(request.getIsActive())) {
                continue;
            }
            u.setIsActive(request.getIsActive());
            u.setUpdatedAt(Instant.now());
            affectedCount++;

            if (Boolean.FALSE.equals(request.getIsActive())) {
                userSessionService.revokeAllSessions(u.getId(), "ADMIN_BULK_LOCK");
            }
        }
        userRepository.saveAll(targetUsers);

        saveAuditLog(Boolean.TRUE.equals(request.getIsActive()) ? "BULK_UNLOCK" : "BULK_LOCK", "USER",
                "BULK", affectedCount + " tài khoản",
                "Thao tác hàng loạt: " + (Boolean.TRUE.equals(request.getIsActive()) ? "Mở khóa " : "Tạm khóa ") + affectedCount + " tài khoản nhân sự");

        log.info("Admin da cap nhat trang thai hang loat cho {} tai khoan -> isActive: {}", targetUsers.size(), request.getIsActive());
    }

    @Override
    @Transactional
    public UserResponse updateUserRole(Long id, String newRole) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy tài khoản với ID: " + id));

        if ("admin".equalsIgnoreCase(user.getUsername()) && !"ROLE_ADMIN".equalsIgnoreCase(newRole)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Không thể hạ quyền Quản trị viên tối cao (root admin)!");
        }

        String roleName = userMapper.normalizeRoleName(newRole);
        Role role = roleRepository.findByName(roleName).orElseGet(() ->
                roleRepository.save(Role.builder()
                        .name(roleName)
                        .description(userMapper.getRoleDescription(roleName))
                        .build())
        );

        String oldRole = user.getRoles() != null && !user.getRoles().isEmpty() ? user.getRoles().iterator().next().getName() : "NONE";
        user.setRoles(new HashSet<>(Set.of(role)));
        user.setUpdatedAt(Instant.now());
        User updated = userRepository.save(user);

        saveAuditLog("ROLE_CHANGE", "USER", user.getId().toString(), user.getUsername(),
                "Thay đổi vai trò từ " + oldRole + " sang " + roleName);

        log.info("Cap nhat vai tro user {} -> {}", user.getUsername(), roleName);
        List<UserWarehouseAccess> accesses = userWarehouseAccessRepository.findByUserId(user.getId());
        return userMapper.toResponse(updated, accesses);
    }

    @Override
    @Transactional
    public void resetPassword(Long id, String newPassword, boolean mustChangePassword) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy tài khoản với ID: " + id));

        if ("admin".equalsIgnoreCase(user.getUsername())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Không thể cấp lại mật khẩu cho Quản trị viên tối cao. Vui lòng đổi mật khẩu tại trang Hồ sơ cá nhân!");
        }

        String targetPassword = (newPassword != null && !newPassword.isBlank()) ? newPassword.trim() : "123456";
        user.setPasswordHash(passwordEncoder.encode(targetPassword));
        user.setMustChangePassword(mustChangePassword);
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);

        userSessionService.revokeAllSessions(user.getId(), "ADMIN_RESET_PASSWORD_REVOKE");

        saveAuditLog("PASSWORD_RESET", "USER", user.getId().toString(), user.getUsername(),
                "Cấp lại mật khẩu mặc định (mustChangePassword=" + mustChangePassword + ") và hủy toàn bộ phiên làm việc");

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

        saveAuditLog("USER_CHANGE_PASSWORD", "USER", user.getId().toString(), user.getUsername(),
                "Người dùng tự đổi mật khẩu cá nhân thành công");

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

        // Multi-warehouse access update
        List<UserWarehouseAccess> accesses = userWarehouseAccessRepository.findByUserId(user.getId());
        if (request.getAssignedWarehouseIds() != null && !request.getAssignedWarehouseIds().isEmpty()) {
            userWarehouseAccessRepository.deleteByUserId(user.getId());
            accesses = new ArrayList<>();
            Long primaryId = request.getPrimaryWarehouseId() != null
                    ? request.getPrimaryWarehouseId() : request.getAssignedWarehouseIds().get(0);

            for (Long whId : request.getAssignedWarehouseIds()) {
                Optional<Warehouse> whOpt = warehouseRepository.findById(whId);
                if (whOpt.isPresent()) {
                    UserWarehouseAccess uwa = UserWarehouseAccess.builder()
                            .userId(user.getId())
                            .warehouse(whOpt.get())
                            .isPrimary(whId.equals(primaryId))
                            .createdAt(Instant.now())
                            .build();
                    accesses.add(userWarehouseAccessRepository.save(uwa));
                }
            }
        }

        user.setUpdatedAt(Instant.now());
        User saved = userRepository.save(user);

        saveAuditLog("USER_UPDATE", "USER", user.getId().toString(), user.getUsername(),
                "Cập nhật thông tin tài khoản: " + user.getFullName() + ", Email: " + user.getEmail());

        log.info("Cap nhat thong tin user: {}", user.getUsername());
        return userMapper.toResponse(saved, accesses);
    }

    @Override
    @Transactional
    public void forceLogout(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy tài khoản: " + id));
        userSessionService.revokeAllSessions(user.getId(), "ADMIN_FORCE_LOGOUT");
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);

        saveAuditLog("FORCE_LOGOUT", "USER", user.getId().toString(), user.getUsername(),
                "Cưỡng chế đăng xuất tất cả phiên làm việc và thiết bị");

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

    @Override
    @Transactional(readOnly = true)
    public List<AuditLogResponse> getAuditLogs() {
        return auditLogRepository.findTop50ByOrderByCreatedAtDesc().stream()
                .map(this::mapAuditLog)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AuditLogResponse> getUserAuditLogs(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy người dùng: " + userId));
        return auditLogRepository.findByTargetNameOrderByCreatedAtDesc(user.getUsername()).stream()
                .map(this::mapAuditLog)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<RbacMatrixResponse> getRbacMatrix() {
        List<Permission> permissions = permissionRepository.findByOrderByModuleAscIdAsc();
        Role adminRole = roleRepository.findByName("ROLE_ADMIN").orElse(null);
        Role managerRole = roleRepository.findByName("ROLE_WAREHOUSE_MANAGER").orElse(null);
        Role operatorRole = roleRepository.findByName("ROLE_OPERATOR").orElse(null);

        Set<Integer> adminPermIds = (adminRole != null && adminRole.getPermissions() != null)
                ? adminRole.getPermissions().stream().map(Permission::getId).collect(Collectors.toSet())
                : Collections.emptySet();

        Set<Integer> managerPermIds = (managerRole != null && managerRole.getPermissions() != null)
                ? managerRole.getPermissions().stream().map(Permission::getId).collect(Collectors.toSet())
                : Collections.emptySet();

        Set<Integer> operatorPermIds = (operatorRole != null && operatorRole.getPermissions() != null)
                ? operatorRole.getPermissions().stream().map(Permission::getId).collect(Collectors.toSet())
                : Collections.emptySet();

        return permissions.stream().map(p -> RbacMatrixResponse.builder()
                .permissionId(p.getId())
                .code(p.getCode())
                .name(p.getName())
                .module(p.getModule())
                .description(p.getDescription())
                .adminAllowed(adminPermIds.contains(p.getId()))
                .managerAllowed(managerPermIds.contains(p.getId()))
                .operatorAllowed(operatorPermIds.contains(p.getId()))
                .build())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void updateRbacMatrix(UpdateRbacMatrixRequest request) {
        String roleName = userMapper.normalizeRoleName(request.getRoleName());
        if ("ROLE_ADMIN".equalsIgnoreCase(roleName)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Không thể giới hạn quyền của Quản trị viên tối cao (ROLE_ADMIN)!");
        }

        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy vai trò: " + roleName));

        List<Permission> allPermissions = permissionRepository.findAll();
        Set<String> targetCodes = new HashSet<>(request.getPermissionCodes() != null ? request.getPermissionCodes() : Collections.emptyList());

        Set<Permission> assigned = allPermissions.stream()
                .filter(p -> targetCodes.contains(p.getCode()))
                .collect(Collectors.toSet());

        role.setPermissions(assigned);
        roleRepository.save(role);

        saveAuditLog("RBAC_MATRIX_UPDATE", "ROLE", role.getId().toString(), role.getName(),
                "Cập nhật ma trận quyền cho vai trò " + role.getName() + " (" + assigned.size() + " quyền hạn)");

        log.info("Admin da cap nhat ma tran quyen cho vai tro {} -> {} quyen", roleName, assigned.size());
    }

    private boolean isUserAdmin(User user) {
        if (user.getRoles() == null) return false;
        return user.getRoles().stream().anyMatch(r -> "ROLE_ADMIN".equalsIgnoreCase(r.getName()));
    }

    private void saveAuditLog(String action, String targetType, String targetId, String targetName, String details) {
        try {
            String currentActor = SecurityUtils.getCurrentUsername().orElse("admin");
            AuditLog auditLog = AuditLog.builder()
                    .action(action)
                    .actorUsername(currentActor)
                    .targetType(targetType)
                    .targetId(targetId)
                    .targetName(targetName)
                    .details(details)
                    .ipAddress("192.168.1.100")
                    .createdAt(Instant.now())
                    .build();
            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            log.warn("Khong the ghi Audit Log: {}", e.getMessage());
        }
    }

    private AuditLogResponse mapAuditLog(AuditLog a) {
        return AuditLogResponse.builder()
                .id(a.getId())
                .action(a.getAction())
                .actorUsername(a.getActorUsername())
                .targetType(a.getTargetType())
                .targetId(a.getTargetId())
                .targetName(a.getTargetName())
                .details(a.getDetails())
                .ipAddress(a.getIpAddress())
                .userAgent(a.getUserAgent())
                .createdAt(a.getCreatedAt())
                .build();
    }
}
