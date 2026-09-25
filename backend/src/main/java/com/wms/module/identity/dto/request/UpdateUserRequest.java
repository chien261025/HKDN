package com.wms.module.identity.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Yêu cầu cập nhật thông tin và vai trò người dùng")
public class UpdateUserRequest {

    @NotBlank(message = "Họ và tên không được để trống!")
    @Size(max = 100, message = "Họ và tên tối đa 100 ký tự")
    @Schema(description = "Họ và tên đầy đủ", example = "Trần Trưởng Kho")
    private String fullName;

    @NotBlank(message = "Email không được để trống!")
    @Email(message = "Địa chỉ email không đúng định dạng!")
    @Schema(description = "Địa chỉ email liên hệ", example = "manager@smartwms.vn")
    private String email;

    @Schema(description = "Mã vai trò RBAC mới (ROLE_ADMIN, ROLE_WAREHOUSE_MANAGER, ROLE_OPERATOR)", example = "ROLE_WAREHOUSE_MANAGER")
    private String role;

    @Schema(description = "Kho hàng phụ trách", example = "Kho Tổng Tân Bình (ZONE A & B)")
    private String assignedWarehouse;

    @Schema(description = "Số điện thoại liên hệ", example = "0900000002")
    private String phone;
}
