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
@Schema(description = "Dữ liệu yêu cầu đăng ký tài khoản mới")
public class RegisterRequest {

    @NotBlank(message = "Tên đăng nhập không được để trống")
    @Size(min = 3, max = 50, message = "Tên đăng nhập phải có độ dài từ 3 đến 50 ký tự")
    @Schema(description = "Tên tài khoản (username)", example = "nguyenkho")
    private String username;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 6, max = 100, message = "Mật khẩu phải có độ dài tối thiểu 6 ký tự")
    @Schema(description = "Mật khẩu người dùng", example = "123456")
    private String password;

    @NotBlank(message = "Họ và tên không được để trống")
    @Size(min = 2, max = 100, message = "Họ và tên phải có độ dài từ 2 đến 100 ký tự")
    @Schema(description = "Họ và tên đầy đủ", example = "Nguyễn Văn Kho")
    private String fullName;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Định dạng email không hợp lệ")
    @Schema(description = "Địa chỉ email liên hệ", example = "nguyenkho@smartwms.vn")
    private String email;

    @Schema(description = "Vai trò mong muốn (ROLE_OPERATOR, ROLE_WAREHOUSE_MANAGER, ROLE_ADMIN)", example = "ROLE_OPERATOR")
    private String role;
}
