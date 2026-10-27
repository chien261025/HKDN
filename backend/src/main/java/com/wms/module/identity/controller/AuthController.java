package com.wms.module.identity.controller;

import com.wms.common.exception.BusinessException;
import com.wms.common.exception.ErrorCode;
import com.wms.common.response.ApiResponse;
import com.wms.module.identity.dto.request.LoginRequest;
import com.wms.module.identity.dto.request.RegisterRequest;
import com.wms.module.identity.dto.response.AuthTokenResponse;
import com.wms.module.identity.entity.Role;
import com.wms.module.identity.entity.User;
import com.wms.module.identity.repository.RoleRepository;
import com.wms.module.identity.repository.UserRepository;
import com.wms.module.identity.security.JwtTokenProvider;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
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
    private final com.wms.module.identity.service.UserSessionService userSessionService;
    private final com.wms.module.identity.service.LoginAttemptService loginAttemptService;
    private final com.wms.module.notification.service.EmailService emailService;
    private final com.wms.module.identity.service.OtpService otpService;

    @PostMapping("/login")
    @Operation(summary = "Đăng nhập hệ thống (Lấy JWT Token)",
               description = "Đăng nhập với tên đăng nhập hoặc email và mật khẩu")
    public ApiResponse<AuthTokenResponse> login(
            @Valid @RequestBody LoginRequest request,
            jakarta.servlet.http.HttpServletRequest httpRequest) {
        String inputKey = request.getUsername().trim();
        String clientIp = (request.getClientIp() != null && !request.getClientIp().isBlank())
                ? request.getClientIp() : com.wms.module.identity.util.DeviceDetectorUtil.extractClientIp(httpRequest);
        String dfp = com.wms.module.identity.util.DeviceDetectorUtil.extractDeviceFingerprint(httpRequest);
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
            if (Boolean.FALSE.equals(user.getIsActive())) {
                throw new BusinessException(ErrorCode.FORBIDDEN, "Tài khoản đang bị tạm khóa. Vui lòng liên hệ Quản trị viên!");
            }

            boolean matches = passwordEncoder.matches(request.getPassword(), user.getPasswordHash());
            if (!matches) {
                var failRes = loginAttemptService.registerFailure(user.getUsername(), clientIp, dfp);
                if (failRes.blocked()) {
                    String timeDesc = failRes.lockLevel() == 1 ? "1 phút" : (failRes.lockLevel() == 2 ? "3 phút" : "15 phút");
                    throw new BusinessException(ErrorCode.BAD_REQUEST,
                            "Mật khẩu không đúng! Bạn đã nhập sai 5 lần. Tài khoản và thiết bị (IP) bị tạm khóa " + timeDesc + " để bảo vệ an toàn.");
                }
                throw new BusinessException(ErrorCode.UNAUTHORIZED,
                        "Mật khẩu không chính xác! Bạn còn " + failRes.remainingAttempts() + " lần thử.");
            }
            loginAttemptService.loginSucceeded(user.getUsername(), clientIp, dfp);
            if (user.getRoles() != null && !user.getRoles().isEmpty()) {
                roleName = user.getRoles().iterator().next().getName();
            }
            fullName = user.getFullName();
        } else {
            var failRes = loginAttemptService.registerFailure(inputKey, clientIp, dfp);
            throw new BusinessException(ErrorCode.UNAUTHORIZED,
                    failRes.blocked() ? "Tài khoản & Thiết bị (IP) đã bị tạm khóa do nhập sai nhiều lần." : "Tài khoản hoặc mật khẩu không đúng!");
        }

        String username = (user != null) ? user.getUsername() : inputKey;
        // 2. Tạo JWT Token
        String token = jwtTokenProvider.generateToken(username, roleName);

        // 3. Quản lý thiết bị & Phiên đồng thời (Device Session Tracking & Limit)
        if (user != null) {
            var dev = com.wms.module.identity.util.DeviceDetectorUtil.detectDevice(httpRequest);
            String loc = (request.getClientLocation() != null && !request.getClientLocation().isBlank())
                    ? request.getClientLocation() : com.wms.module.identity.util.DeviceDetectorUtil.resolveLocation(clientIp);
            userSessionService.registerSession(user, token, dev.deviceName(), dev.deviceType(), clientIp, loc);
        }

        AuthTokenResponse response = AuthTokenResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .username(request.getUsername())
                .fullName(fullName)
                .role(roleName)
                .expiresIn(86400000L)
                .build();

        return ApiResponse.success("Đăng nhập thành công!", response);
    }

    @PostMapping("/register")
    @Operation(summary = "Đăng ký tài khoản người dùng mới",
               description = "Đăng ký tài khoản mới và tự động cấp token đăng nhập tức thời")
    public ApiResponse<AuthTokenResponse> register(@Valid @RequestBody RegisterRequest request) {
        log.info("Yeu cau dang ky tai khoan moi: {}", request.getUsername());

        String cleanUsername = request.getUsername().trim().toLowerCase();
        String cleanEmail = request.getEmail().trim().toLowerCase();

        // 1. Kiểm tra trùng lặp username
        if (userRepository.existsByUsername(cleanUsername)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Tên đăng nhập '" + cleanUsername + "' đã tồn tại trong hệ thống!");
        }

        // 2. Kiểm tra trùng lặp email
        if (userRepository.existsByEmail(cleanEmail)) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Địa chỉ email '" + cleanEmail + "' đã được sử dụng bởi tài khoản khác!");
        }

        // 3. Chuẩn hóa và gán vai trò RBAC (Chặn đứng tấn công leo thang đặc quyền - CWE-269)
        // Mọi tài khoản tự đăng ký qua Internet đều mặc định là ROLE_OPERATOR
        String roleName = "ROLE_OPERATOR";

        Role role = roleRepository.findByName(roleName).orElse(null);
        if (role == null) {
            role = roleRepository.save(Role.builder()
                    .name(roleName)
                    .description("Vai trò vận hành kho tiêu chuẩn")
                    .build());
        }

        // 4. Lưu tài khoản người dùng mới với mật khẩu mã hóa BCrypt
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

        // 5. Cấp phát JWT Token đăng nhập ngay lập tức
        String token = jwtTokenProvider.generateToken(newUser.getUsername(), roleName);

        AuthTokenResponse response = AuthTokenResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .username(newUser.getUsername())
                .fullName(newUser.getFullName())
                .role(roleName)
                .expiresIn(86400000L)
                .build();

        return ApiResponse.success("Đăng ký tài khoản thành công!", response);
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
    public ApiResponse<User> getMyProfile(jakarta.servlet.http.HttpServletRequest httpRequest) {
        String authHeader = httpRequest.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) throw new BusinessException(ErrorCode.UNAUTHORIZED, "Chưa cung cấp Bearer token!");
        String username = jwtTokenProvider.getUsernameFromToken(authHeader.substring(7));
        User user = userRepository.findByUsername(username).orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy tài khoản: " + username));
        return ApiResponse.success("Lấy thông tin tài khoản thành công!", user);
    }

    @PostMapping("/forgot-password/send-otp")
    @Operation(summary = "Gửi mã OTP khôi phục mật khẩu qua Email")
    public ApiResponse<Map<String, Object>> sendForgotPasswordOtp(@RequestBody Map<String, String> body) {
        String identifier = body != null ? body.get("identifier") : null;
        if (identifier == null || identifier.isBlank()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Vui lòng nhập tên đăng nhập hoặc email!");
        }
        User user = userRepository.findByUsername(identifier.trim())
                .or(() -> userRepository.findByEmail(identifier.trim()))
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy tài khoản với: " + identifier));

        String otp = otpService.generateOtp(user.getUsername());
        boolean sent = emailService.sendOtpEmail(user.getEmail(), otp);
        return ApiResponse.success(sent ? "Mã OTP đã được gửi đến email!" : "Đã tạo mã xác thực thành công!",
                Map.of("email", user.getEmail(), "emailSent", sent, "expiresInSeconds", 180));
    }

    @PostMapping("/forgot-password/verify-otp")
    @Operation(summary = "Kiểm tra tính hợp lệ của mã OTP")
    public ApiResponse<Boolean> verifyForgotPasswordOtp(@RequestBody Map<String, String> body) {
        String identifier = body != null ? body.get("identifier") : null;
        String otpCode = body != null ? body.get("otpCode") : null;
        if (identifier == null || identifier.isBlank() || otpCode == null || otpCode.isBlank()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Vui lòng nhập đầy đủ tài khoản và mã OTP!");
        }
        User user = userRepository.findByUsername(identifier.trim())
                .or(() -> userRepository.findByEmail(identifier.trim()))
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy tài khoản với: " + identifier));

        boolean valid = otpService.checkOtp(user.getUsername(), otpCode.trim());
        if (!valid) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Mã OTP không chính xác hoặc đã hết hạn!");
        }
        return ApiResponse.success("Xác thực OTP thành công!", true);
    }

    @PostMapping("/forgot-password/reset")
    @Operation(summary = "Đặt lại mật khẩu sau khi xác thực OTP")
    public ApiResponse<String> resetForgottenPassword(@Valid @RequestBody com.wms.module.identity.dto.request.ForgotPasswordResetRequest request) {
        String idOrEmail = request.getIdentifier().trim();
        log.info("Yeu cau dat lai mat khau cho: {}", idOrEmail);

        User user = userRepository.findByUsername(idOrEmail).or(() -> userRepository.findByEmail(idOrEmail))
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy tài khoản với: " + idOrEmail));

        if (request.getOtpCode() == null || !otpService.verifyAndConsumeOtp(user.getUsername(), request.getOtpCode().trim())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Mã OTP không chính xác hoặc đã hết hạn!");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword().trim()));
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);
        userSessionService.revokeAllSessions(user.getId(), "PASSWORD_RESET_REVOKE_ALL");
        return ApiResponse.success("Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay với mật khẩu mới.", user.getUsername());
    }

    @PostMapping("/logout")
    @Operation(summary = "Đăng xuất tài khoản và hủy phiên làm việc hiện tại")
    public ApiResponse<String> logout(jakarta.servlet.http.HttpServletRequest httpRequest) {
        String authHeader = httpRequest.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            userSessionService.revokeCurrentToken(authHeader.substring(7));
        }
        return ApiResponse.success("Đăng xuất thành công! Phiên làm việc đã được hủy an toàn.");
    }

    @GetMapping("/session-status")
    @Operation(summary = "Kiểm tra phiên đăng nhập có còn hiệu lực không")
    public ApiResponse<Map<String, Object>> checkSessionStatus(jakarta.servlet.http.HttpServletRequest httpRequest) {
        String authHeader = httpRequest.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ApiResponse.success(Map.of("active", false, "reason", "NO_TOKEN", "maxConcurrentDevices", com.wms.module.identity.service.UserSessionService.MAX_CONCURRENT_SESSIONS));
        }
        boolean revoked = userSessionService.isTokenRevoked(authHeader.substring(7));
        return ApiResponse.success(Map.of("active", !revoked, "maxConcurrentDevices", com.wms.module.identity.service.UserSessionService.MAX_CONCURRENT_SESSIONS, "reason", revoked ? "SESSION_REVOKED" : "ACTIVE"));
    }

    @GetMapping("/lockout-status")
    @Operation(summary = "Kiểm tra trạng thái tạm khóa của tài khoản, IP hoặc Thiết bị")
    public ApiResponse<Map<String, Object>> getLockoutStatus(
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String deviceFingerprint,
            jakarta.servlet.http.HttpServletRequest httpRequest) {
        String clientIp = com.wms.module.identity.util.DeviceDetectorUtil.extractClientIp(httpRequest);
        String dfp = (deviceFingerprint != null && !deviceFingerprint.isBlank())
                ? deviceFingerprint.trim() : com.wms.module.identity.util.DeviceDetectorUtil.extractDeviceFingerprint(httpRequest);
        var res = loginAttemptService.checkStatus(username, clientIp, dfp);
        return ApiResponse.success(Map.of("blocked", res.blocked(), "remainingSeconds", res.remainingSeconds(), "lockLevel", res.lockLevel(), "clientIp", clientIp));
    }
}

