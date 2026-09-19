package com.wms.module.identity.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Thông tin chi tiết tài khoản người dùng")
public class UserResponse {

    @Schema(description = "Mã định danh ID tài khoản", example = "1")
    private Long id;

    @Schema(description = "Tên đăng nhập hệ thống", example = "manager01")
    private String username;

    @Schema(description = "Họ và tên đầy đủ", example = "Trần Trưởng Kho")
    private String fullName;

    @Schema(description = "Địa chỉ email", example = "manager@smartwms.vn")
    private String email;

    @Schema(description = "Mã vai trò RBAC chính", example = "ROLE_WAREHOUSE_MANAGER")
    private String role;

    @Schema(description = "Tên vai trò hiển thị thân thiện", example = "Quản Lý Kho (Manager)")
    private String roleDescription;

    @Schema(description = "Trạng thái kích hoạt (true = Hoạt động, false = Bị khóa)", example = "true")
    private Boolean isActive;

    @Schema(description = "Trạng thái hiển thị (ACTIVE hoặc LOCKED)", example = "ACTIVE")
    private String status;

    @Schema(description = "Kho hàng mặc định phụ trách", example = "Kho Tổng Tân Bình (ZONE A & B)")
    private String assignedWarehouse;

    @Schema(description = "Thời gian khởi tạo tài khoản")
    private Instant createdAt;

    @Schema(description = "Thời gian cập nhật gần nhất")
    private Instant updatedAt;
}
