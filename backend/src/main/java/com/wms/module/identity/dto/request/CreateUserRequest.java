package com.wms.module.identity.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Thông tin yêu cầu tạo tài khoản từ Admin")
public class CreateUserRequest {

    @NotBlank(message = "Tên đăng nhập không được để trống")
    @Size(min = 3, max = 50, message = "Tên đăng nhập từ 3 đến 50 ký tự")
    @Schema(description = "Tên tài khoản", example = "operator_pda2")
    private String username;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 6, max = 100, message = "Mật khẩu tối thiểu 6 ký tự")
    @Schema(description = "Mật khẩu khởi tạo", example = "123456")
    private String password;

    @NotBlank(message = "Họ và tên không được để trống")
    @Schema(description = "Họ và tên đầy đủ", example = "Phạm Văn Vận Hành")
    private String fullName;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không đúng định dạng")
    @Schema(description = "Địa chỉ email", example = "pda2@smartwms.vn")
    private String email;

    @Schema(description = "Vai trò RBAC (ROLE_ADMIN, ROLE_WAREHOUSE_MANAGER, ROLE_OPERATOR)", example = "ROLE_OPERATOR")
    private String role;
}
