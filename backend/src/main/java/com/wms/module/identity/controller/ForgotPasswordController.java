package com.wms.module.identity.controller;

import com.wms.common.exception.BusinessException;
import com.wms.common.exception.ErrorCode;
import com.wms.common.response.ApiResponse;
import com.wms.module.identity.dto.request.ForgotPasswordResetRequest;
import com.wms.module.identity.entity.User;
import com.wms.module.identity.repository.UserRepository;
import com.wms.module.identity.service.OtpService;
import com.wms.module.identity.service.UserSessionService;
import com.wms.module.notification.service.EmailService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;

/**
 * Controller xử lý quy trình khôi phục mật khẩu qua Email OTP.
 * Tách biệt theo chuẩn Single Responsibility Principle (SRP).
 */
@Slf4j
@RestController
@RequestMapping("/auth/forgot-password")
@RequiredArgsConstructor
@Tag(name = "1.2 Khôi phục Mật khẩu (Password Recovery)", description = "APIs gửi OTP qua Email, xác minh mã OTP và đặt lại mật khẩu")
public class ForgotPasswordController {

    private final UserRepository userRepository;
    private final OtpService otpService;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final UserSessionService userSessionService;

    @PostMapping("/send-otp")
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

    @PostMapping("/verify-otp")
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

    @PostMapping("/reset")
    @Operation(summary = "Đặt lại mật khẩu sau khi xác thực OTP")
    public ApiResponse<String> resetForgottenPassword(@Valid @RequestBody ForgotPasswordResetRequest request) {
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
}
