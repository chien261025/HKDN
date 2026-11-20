package com.wms.module.identity.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Yêu cầu cập nhật danh sách quyền cho vai trò")
public class UpdateRbacMatrixRequest {

    @NotBlank(message = "Mã vai trò không được để trống")
    private String roleName;

    private List<String> permissionCodes;
}

