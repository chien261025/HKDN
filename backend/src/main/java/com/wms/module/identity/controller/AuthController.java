package com.wms.module.identity.controller;

import com.wms.common.constant.MessageConstants;
import com.wms.common.exception.BusinessException;
import com.wms.common.exception.ErrorCode;
import com.wms.common.response.ApiResponse;
import com.wms.module.identity.constant.SecurityConstants;
import com.wms.module.identity.dto.request.LoginRequest;
import com.wms.module.identity.dto.request.RegisterRequest;
import com.wms.module.identity.dto.response.AuthTokenResponse;
import com.wms.module.identity.entity.Role;
import com.wms.module.identity.entity.User;
import com.wms.module.identity.repository.RoleRepository;
import com.wms.module.identity.repository.UserRepository;
import com.wms.module.identity.security.JwtTokenProvider;
import com.wms.module.identity.service.LoginAttemptService;
import com.wms.module.identity.service.RedisLoginAttemptService;
import com.wms.module.identity.service.UserSessionService;
import com.wms.module.identity.util.DeviceDetectorUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Controller xử lý Định danh & Phiên đăng nhập (Authentication & Session Lifecycle).
 * Tối ưu theo chuẩn hằng số doanh nghiệp (SecurityConstants & MessageConstants).
 */
@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "1. Định danh & Phân quyền (Identity & RBAC)", description = "APIs đăng nhập, đăng ký JWT và thông tin người dùng")
public class AuthController {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final UserSessionService userSessionService;
    private final RedisLoginAttemptService loginAttemptService;

    @PostMapping("/login")
    @Operation(summary = "Đăng nhập hệ thống (Lấy JWT Token)",
               description = "Đăng nhập với tên đăng nhập hoặc email và mật khẩu")
    public ApiResponse<AuthTokenResponse> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {
        String inputKey = request.getUsername().trim();
        String clientIp = (request.getClientIp() != null && !request.getClientIp().isBlank())
                ? request.getClientIp() : DeviceDetectorUtil.extractClientIp(httpRequest);
        String dfp = DeviceDetectorUtil.extractDeviceFingerprint(httpRequest);
        log.info("Yeu cau dang nhap tu: {} (IP: {}, Dev: {})", inputKey, clientIp, dfp);

        // 0. Chống dò mật khẩu (Khóa lũy tiến 1p -> 3p -> 15p theo cả Tài khoản, IP & Thiết bị)
        var lockStatus = loginAttemptService.checkStatus(inputKey, clientIp, dfp);
        if (lockStatus.blocked()) {
            String timeDesc = lockStatus.remainingSeconds() > 180 ? "15 phút" : (lockStatus.remainingSeconds() > 60 ? "3 phút" : "1 phút");
            throw new BusinessException(ErrorCode.BAD_REQUEST,
                    "Tài khoản hoặc thiết bị (IP) đang bị tạm khóa " + timeDesc + ". Vui lòng thử lại sau " + lockStatus.remainingSeconds() + " giây!");
        }

        // 1. Kiểm tra tài khoản trong Database (Hỗ trợ cả Username và Email)
        User user = userRepository.findByUsername(inputKey)
                .or(() -> userRepository.findByEmail(inputKey))
                .orElse(null);

        String roleName = "ROLE_WAREHOUSE_MANAGER";
        String fullName = "Người dùng";

        if (user != null) {
            // 1. Kiểm tra mật khẩu trước (chống brute-force và password enumeration)
            boolean matches = passwordEncoder.matches(request.getPassword(), user.getPasswordHash());
            if (!matches) {
                var failRes = loginAttemptService.registerFailure(user.getUsername(), clientIp, dfp);
                if (failRes.blocked()) {
                    String timeDesc = failRes.lockLevel() == 1 ? "1 phút" : (failRes.lockLevel() == 2 ? "3 phút" : "15 phút");
                    throw new BusinessException(ErrorCode.BAD_REQUEST,
                            "Mật khẩu không đúng! Bạn đã nhập sai " + SecurityConstants.MAX_FAILED_LOGIN_ATTEMPTS
                                    + " lần. Tài khoản và thiết bị bị tạm khóa " + timeDesc + ". Vui lòng thử lại sau " + failRes.remainingSeconds() + " giây!");
                }
                throw new BusinessException(ErrorCode.UNAUTHORIZED,
                        "Mật khẩu không chính xác! Bạn còn " + failRes.remainingAttempts() + " lần thử.");
            }

            // 2. Mật khẩu đúng nhưng tài khoản đã bị khóa bởi Quản trị viên
            if (Boolean.FALSE.equals(user.getIsActive())) {
                var failRes = loginAttemptService.registerFailure(user.getUsername(), clientIp, dfp);
                if (failRes.blocked()) {
                    String timeDesc = failRes.lockLevel() == 1 ? "1 phút" : (failRes.lockLevel() == 2 ? "3 phút" : "15 phút");
                    throw new BusinessException(ErrorCode.BAD_REQUEST,
                            "Tài khoản hoặc thiết bị (IP) đang bị tạm khóa " + timeDesc + ". Vui lòng thử lại sau " + failRes.remainingSeconds() + " giây!");
                }
                throw new BusinessException(ErrorCode.FORBIDDEN, MessageConstants.ERR_ACCOUNT_LOCKED);
            }

            // 3. Mật khẩu đúng nhưng tài khoản đã hết hạn sử dụng (Account Expired)
            if (user.getExpiresAt() != null && user.getExpiresAt().isBefore(Instant.now())) {
                var failRes = loginAttemptService.registerFailure(user.getUsername(), clientIp, dfp);
                if (failRes.blocked()) {
                    String timeDesc = failRes.lockLevel() == 1 ? "1 phút" : (failRes.lockLevel() == 2 ? "3 phút" : "15 phút");
                    throw new BusinessException(ErrorCode.BAD_REQUEST,
                            "Tài khoản hoặc thiết bị (IP) đang bị tạm khóa " + timeDesc + ". Vui lòng thử lại sau " + failRes.remainingSeconds() + " giây!");
                }
                throw new BusinessException(ErrorCode.FORBIDDEN, "Tài khoản đã hết hạn sử dụng! Vui lòng liên hệ Quản trị viên.");
            }

            loginAttemptService.loginSucceeded(user.getUsername(), clientIp, dfp);
            if (user.getRoles() != null && !user.getRoles().isEmpty()) {
                roleName = user.getRoles().iterator().next().getName();
            }
            fullName = user.getFullName();
        } else {
            var failRes = loginAttemptService.registerFailure(inputKey, clientIp, dfp);
            if (failRes.blocked()) {
                String timeDesc = failRes.lockLevel() == 1 ? "1 phút" : (failRes.lockLevel() == 2 ? "3 phút" : "15 phút");
                throw new BusinessException(ErrorCode.BAD_REQUEST,
                        "Tài khoản hoặc thiết bị (IP) đang bị tạm khóa " + timeDesc + ". Vui lòng thử lại sau " + failRes.remainingSeconds() + " giây!");
            }
            throw new BusinessException(ErrorCode.UNAUTHORIZED, MessageConstants.ERR_INVALID_CREDENTIALS);
        }

        String username = (user != null) ? user.getUsername() : inputKey;
        String token = jwtTokenProvider.generateToken(username, roleName);

        // 3. Quản lý thiết bị & Phiên đồng thời (FIFO 2 thiết bị)
        if (user != null) {
            var dev = DeviceDetectorUtil.detectDevice(httpRequest);
            String loc = (request.getClientLocation() != null && !request.getClientLocation().isBlank())
                    ? request.getClientLocation() : DeviceDetectorUtil.resolveLocation(clientIp);
            userSessionService.registerSession(user, token, dev.deviceName(), dev.deviceType(), clientIp, loc);
        }

        AuthTokenResponse response = AuthTokenResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .username(request.getUsername())
                .fullName(fullName)
                .role(roleName)
                .expiresIn(SecurityConstants.JWT_EXPIRATION_MS)
                .mustChangePassword(user != null && Boolean.TRUE.equals(user.getMustChangePassword()))
                .build();

        return ApiResponse.success(MessageConstants.LOGIN_SUCCESS, response);
    }

    @PostMapping("/register")
    @Operation(summary = "Đăng ký tài khoản người dùng mới",
               description = "Đăng ký tài khoản mới và tự động cấp token đăng nhập tức thời")
    public ApiResponse<AuthTokenResponse> register(@Valid @RequestBody RegisterRequest request) {
        log.info("Yeu cau dang ky tai khoan moi: {}", request.getUsername());

        String cleanUsername = request.getUsername().trim().toLowerCase();
        String cleanEmail = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByUsername(cleanUsername)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, MessageConstants.ERR_USERNAME_EXISTS);
        }

        if (userRepository.existsByEmail(cleanEmail)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, MessageConstants.ERR_EMAIL_EXISTS);
        }

        String roleName = "ROLE_OPERATOR";
        Role role = roleRepository.findByName(roleName).orElseGet(() ->
                roleRepository.save(Role.builder()
                        .name(roleName)
                        .description("Vai trò vận hành kho tiêu chuẩn")
                        .build())
        );

        User newUser = User.builder()
                .username(cleanUsername)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName().trim())
                .email(cleanEmail)
                .roles(new HashSet<>(Set.of(role)))
                .isActive(true)
                .createdAt(Instant.now())
                .updatedAt(Instant.now())
                .build();

        userRepository.save(newUser);
        log.info("Da dang ky thanh cong user: {} voi role: {}", cleanUsername, roleName);

        String token = jwtTokenProvider.generateToken(newUser.getUsername(), roleName);

        AuthTokenResponse response = AuthTokenResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .username(newUser.getUsername())
                .fullName(newUser.getFullName())
                .role(roleName)
                .expiresIn(SecurityConstants.JWT_EXPIRATION_MS)
                .build();

        return ApiResponse.success(MessageConstants.REGISTER_SUCCESS, response);
    }

    @GetMapping("/demo-accounts")
    @Operation(summary = "Xem danh sách các vai trò tài khoản trong hệ thống", description = "Danh mục vai trò hỗ trợ kiểm thử hệ thống")
    public ApiResponse<List<Map<String, String>>> getDemoAccounts() {
        List<Map<String, String>> accounts = List.of(
                Map.of("username", "admin", "role", "ROLE_ADMIN", "desc", "Quản trị viên"),
                Map.of("username", "manager01", "role", "ROLE_WAREHOUSE_MANAGER", "desc", "Trưởng kho"),
                Map.of("username", "operator01", "role", "ROLE_OPERATOR", "desc", "Thủ kho quét mã")
        );
        return ApiResponse.success(accounts);
    }

    @GetMapping("/me")
    @Operation(summary = "Lấy hồ sơ cá nhân của người dùng hiện tại")
    public ApiResponse<User> getMyProfile(HttpServletRequest httpRequest) {
        String authHeader = httpRequest.getHeader(SecurityConstants.HEADER_AUTHORIZATION);
        if (authHeader == null || !authHeader.startsWith(SecurityConstants.TOKEN_PREFIX)) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED, MessageConstants.ERR_UNAUTHORIZED);
        }
        String username = jwtTokenProvider.getUsernameFromToken(authHeader.substring(SecurityConstants.TOKEN_PREFIX.length()));
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, MessageConstants.ERR_USER_NOT_FOUND));
        return ApiResponse.success(MessageConstants.PROFILE_LOAD_SUCCESS, user);
    }

    @PostMapping("/logout")
    @Operation(summary = "Đăng xuất tài khoản và hủy phiên làm việc hiện tại")
    public ApiResponse<String> logout(HttpServletRequest httpRequest) {
        String authHeader = httpRequest.getHeader(SecurityConstants.HEADER_AUTHORIZATION);
        if (authHeader != null && authHeader.startsWith(SecurityConstants.TOKEN_PREFIX)) {
            userSessionService.revokeCurrentToken(authHeader.substring(SecurityConstants.TOKEN_PREFIX.length()));
        }
        return ApiResponse.success(MessageConstants.LOGOUT_SUCCESS);
    }

    @GetMapping("/session-status")
    @Operation(summary = "Kiểm tra phiên đăng nhập có còn hiệu lực không")
    public ApiResponse<Map<String, Object>> checkSessionStatus(HttpServletRequest httpRequest) {
        String authHeader = httpRequest.getHeader(SecurityConstants.HEADER_AUTHORIZATION);
        if (authHeader == null || !authHeader.startsWith(SecurityConstants.TOKEN_PREFIX)) {
            return ApiResponse.success(Map.of("active", false, "reason", SecurityConstants.REASON_NO_TOKEN,
                    "maxConcurrentDevices", SecurityConstants.MAX_CONCURRENT_SESSIONS));
        }
        boolean revoked = userSessionService.isTokenRevoked(authHeader.substring(SecurityConstants.TOKEN_PREFIX.length()));
        return ApiResponse.success(Map.of(
                "active", !revoked,
                "maxConcurrentDevices", SecurityConstants.MAX_CONCURRENT_SESSIONS,
                "reason", revoked ? SecurityConstants.REASON_SESSION_REVOKED : SecurityConstants.REASON_ACTIVE
        ));
    }

    @GetMapping("/lockout-status")
    @Operation(summary = "Kiểm tra trạng thái tạm khóa của tài khoản, IP hoặc Thiết bị")
    public ApiResponse<Map<String, Object>> getLockoutStatus(
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String deviceFingerprint,
            HttpServletRequest httpRequest) {
        String clientIp = DeviceDetectorUtil.extractClientIp(httpRequest);
        String dfp = (deviceFingerprint != null && !deviceFingerprint.isBlank())
                ? deviceFingerprint.trim() : DeviceDetectorUtil.extractDeviceFingerprint(httpRequest);
        var res = loginAttemptService.checkStatus(username, clientIp, dfp);
        return ApiResponse.success(Map.of("blocked", res.blocked(), "remainingSeconds", res.remainingSeconds(), "lockLevel", res.lockLevel(), "clientIp", clientIp));
    }
}
