package com.wms.module.identity.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Thông tin phản hồi sau khi xác thực thành công")
public class AuthTokenResponse {

    @Schema(description = "JWT Access Token dùng để gắn vào header: Authorization: Bearer <token>")
    private String accessToken;

    @Schema(description = "Loại Token", example = "Bearer")
    @Builder.Default
    private String tokenType = "Bearer";

    @Schema(description = "Tên đăng nhập", example = "manager01")
    private String username;

    @Schema(description = "Họ và tên", example = "Trần Trưởng Kho")
    private String fullName;

    @Schema(description = "Vai trò trong hệ thống", example = "ROLE_WAREHOUSE_MANAGER")
    private String role;

    @Schema(description = "Thời gian hết hạn của Token (mili-giây)", example = "86400000")
    private Long expiresIn;
}
