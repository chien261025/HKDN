package com.wms.module.identity.controller;

import com.wms.common.exception.BusinessException;
import com.wms.common.exception.ErrorCode;
import com.wms.common.response.ApiResponse;
import com.wms.module.identity.dto.request.ForgotPasswordResetRequest;
import com.wms.module.identity.dto.request.SendOtpRequest;
import com.wms.module.identity.dto.request.VerifyOtpRequest;
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
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;

/**
 * Controller xử lý quy trình khôi phục mật khẩu qua Email OTP.
 * Tách biệt theo chuẩn Single Responsibility Principle (SRP) và phòng chống User Enumeration.
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
    public ApiResponse<Map<String, Object>> sendForgotPasswordOtp(@Valid @RequestBody SendOtpRequest request) {
        String identifier = request.getIdentifier().trim();
        Optional<User> userOpt = userRepository.findByUsername(identifier)
                .or(() -> userRepository.findByEmail(identifier));

        if (userOpt.isEmpty()) {
            log.warn("[FORGOT_PASSWORD] Yêu cầu gửi OTP cho tài khoản không tồn tại: {}", identifier);
            // Phòng chống User Enumeration Attack: Luôn trả về thông điệp thành công trung tính
            return ApiResponse.success("Nếu thông tin khớp với tài khoản trong hệ thống, mã OTP đã được gửi đến email đăng ký.",
                    Map.of("emailSent", true, "expiresInSeconds", 180));
        }

        User user = userOpt.get();
        String otp = otpService.generateOtp(user.getUsername());
        boolean sent = emailService.sendOtpEmail(user.getEmail(), otp);
        return ApiResponse.success(sent ? "Mã OTP đã được gửi đến email đăng ký!" : "Đã tạo mã xác thực thành công!",
                Map.of("email", maskEmail(user.getEmail()), "emailSent", sent, "expiresInSeconds", 180));
    }

    @PostMapping("/verify-otp")
    @Operation(summary = "Kiểm tra tính hợp lệ của mã OTP")
    public ApiResponse<Boolean> verifyForgotPasswordOtp(@Valid @RequestBody VerifyOtpRequest request) {
        String identifier = request.getIdentifier().trim();
        String otpCode = request.getOtpCode().trim();

        User user = userRepository.findByUsername(identifier)
                .or(() -> userRepository.findByEmail(identifier))
                .orElseThrow(() -> new BusinessException(ErrorCode.BAD_REQUEST, "Mã OTP không chính xác hoặc đã hết hạn!"));

        boolean valid = otpService.checkOtp(user.getUsername(), otpCode);
        if (!valid) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Mã OTP không chính xác hoặc đã hết hạn!");
        }
        return ApiResponse.success("Xác thực OTP thành công!", true);
    }

    @Transactional
    @PostMapping("/reset")
    @Operation(summary = "Đặt lại mật khẩu sau khi xác thực OTP")
    public ApiResponse<String> resetForgottenPassword(@Valid @RequestBody ForgotPasswordResetRequest request) {
        String idOrEmail = request.getIdentifier().trim();
        log.info("Yeu cau dat lai mat khau cho: {}", idOrEmail);

        User user = userRepository.findByUsername(idOrEmail)
                .or(() -> userRepository.findByEmail(idOrEmail))
                .orElseThrow(() -> new BusinessException(ErrorCode.BAD_REQUEST, "Mã OTP không chính xác hoặc đã hết hạn!"));

        if (request.getOtpCode() == null || !otpService.verifyAndConsumeOtp(user.getUsername(), request.getOtpCode().trim())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Mã OTP không chính xác hoặc đã hết hạn!");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword().trim()));
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);

        // Thu hồi toàn bộ phiên làm việc của tài khoản trên các thiết bị
        userSessionService.revokeAllSessions(user.getId(), "PASSWORD_RESET_REVOKE_ALL");

        return ApiResponse.success("Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay với mật khẩu mới.", user.getUsername());
    }

    private String maskEmail(String email) {
        if (email == null || !email.contains("@")) return email;
        int atIndex = email.indexOf('@');
        if (atIndex <= 2) return "***" + email.substring(atIndex);
        return email.charAt(0) + "***" + email.charAt(atIndex - 1) + email.substring(atIndex);
    }
}
