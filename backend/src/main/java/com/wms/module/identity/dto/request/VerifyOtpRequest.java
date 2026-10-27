package com.wms.module.identity.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerifyOtpRequest {
    @NotBlank(message = "Tên đăng nhập hoặc email không được để trống")
    private String identifier;

    @NotBlank(message = "Mã OTP không được để trống")
    private String otpCode;
}
