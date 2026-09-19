package com.wms.module.identity.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Yêu cầu đặt lại mật khẩu sau khi đã xác thực OTP")
public class ForgotPasswordResetRequest {

    @NotBlank(message = "Tên đăng nhập hoặc email không được để trống")
    @Schema(description = "Tên đăng nhập hoặc địa chỉ email", example = "admin")
    private String identifier;

    @NotBlank(message = "Mật khẩu mới không được để trống")
    @Size(min = 6, max = 100, message = "Mật khẩu mới phải từ 6 ký tự trở lên")
    @Schema(description = "Mật khẩu mới cần đặt", example = "NewPass@2026")
    private String newPassword;
}
