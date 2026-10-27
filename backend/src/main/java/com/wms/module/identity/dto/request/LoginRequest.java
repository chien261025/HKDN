package com.wms.module.identity.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Thông tin đăng nhập hệ thống Smart WMS")
public class LoginRequest {

    @NotBlank(message = "Tên đăng nhập không được để trống")
    @Schema(description = "Tên tài khoản (VD: admin, manager01, operator01)", example = "manager01")
    private String username;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Schema(description = "Mật khẩu (Mặc định demo: 123456)", example = "123456")
    private String password;

    @Schema(description = "Vị trí địa lý thực tế (GPS / Tỉnh Thành)", example = "TP. Hồ Chí Minh, VN")
    private String clientLocation;

    @Schema(description = "Địa chỉ IP thực tế của client", example = "171.243.48.41")
    private String clientIp;
}
