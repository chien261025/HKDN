package com.wms.module.identity.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Yêu cầu thay đổi vai trò phân quyền người dùng")
public class UpdateUserRoleRequest {

    @NotBlank(message = "Mã vai trò không được để trống")
    @Schema(description = "Mã vai trò mới (ROLE_ADMIN, ROLE_WAREHOUSE_MANAGER, ROLE_OPERATOR)", example = "ROLE_WAREHOUSE_MANAGER")
    private String role;
}
