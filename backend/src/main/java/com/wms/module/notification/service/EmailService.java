package com.wms.module.notification.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    public boolean sendOtpEmail(String toEmail, String otpCode) {
        String sender = (fromEmail != null && !fromEmail.isBlank()) ? fromEmail : "noreply@smartwms.vn";

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(sender, "Smart WMS - Quản Lý Kho");
            helper.setTo(toEmail);
            helper.setSubject("[Smart WMS] Mã xác thực đặt lại mật khẩu của bạn");

            String html = """
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; background-color: #ffffff;">
                    <h2 style="color: #4f46e5; margin-top: 0; font-size: 20px;">SMART WMS ENTERPRISE</h2>
                    <p style="color: #475569; font-size: 14px;">Xin chào,</p>
                    <p style="color: #475569; font-size: 14px;">Hệ thống nhận được yêu cầu khôi phục mật khẩu. Dưới đây là mã xác thực OTP 6 chữ số của bạn:</p>
                    <div style="background-color: #f1f5f9; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0;">
                        <span style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #1e1b4b;">%s</span>
                    </div>
                    <p style="color: #64748b; font-size: 12px;">Mã có hiệu lực trong vòng <strong>3 phút</strong>. Nếu bạn không gửi yêu cầu này, vui lòng bỏ qua thư này để bảo vệ tài khoản.</p>
                </div>
            """.formatted(otpCode);

            helper.setText(html, true);
            mailSender.send(message);
            log.info("[EMAIL] Đã gửi thành công mã OTP tới email: {}", toEmail);
            return true;
        } catch (Exception e) {
            log.error("[EMAIL] Lỗi khi gửi email tới {}: {}", toEmail, e.getMessage());
            return false;
        }
    }
}
