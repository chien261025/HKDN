package com.wms.module.identity.controller;

import com.wms.common.response.ApiResponse;
import com.wms.module.identity.dto.request.CreateUserRequest;
import com.wms.module.identity.dto.request.UpdateUserRoleRequest;
import com.wms.module.identity.dto.request.UpdateUserStatusRequest;
import com.wms.module.identity.dto.response.UserResponse;
import com.wms.module.identity.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Tag(name = "1.1 Quản lý Người dùng & RBAC (User Management)", description = "APIs quản lý danh sách tài khoản, phân quyền và khóa/mở khóa tài khoản")
public class UserController {

    private final UserService userService;

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả người dùng trong hệ thống", description = "Truy vấn toàn bộ tài khoản người dùng và vai trò RBAC từ cơ sở dữ liệu PostgreSQL")
    public ApiResponse<List<UserResponse>> getAllUsers() {
        log.info("API lay danh sach tat ca nguoi dung");
        List<UserResponse> users = userService.getAllUsers();
        return ApiResponse.success("Lấy danh sách người dùng thành công!", users);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy thông tin chi tiết một người dùng", description = "Tìm kiếm người dùng theo mã định danh ID")
    public ApiResponse<UserResponse> getUserById(@PathVariable Long id) {
        log.info("API lay thong tin nguoi dung id: {}", id);
        UserResponse user = userService.getUserById(id);
        return ApiResponse.success("Lấy thông tin người dùng thành công!", user);
    }

    @PostMapping
    @Operation(summary = "Thêm người dùng mới từ trang Quản trị", description = "Admin khởi tạo tài khoản mới với mật khẩu và phân quyền ban đầu")
    public ApiResponse<UserResponse> createUser(@Valid @RequestBody CreateUserRequest request) {
        log.info("API tao moi nguoi dung: {}", request.getUsername());
        UserResponse createdUser = userService.createUser(request);
        return ApiResponse.success("Tạo tài khoản mới thành công!", createdUser);
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Khóa hoặc Mở khóa tài khoản người dùng", description = "Cập nhật trạng thái isActive (true = Hoạt động, false = Tạm khóa)")
    public ApiResponse<UserResponse> updateUserStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserStatusRequest request) {
        log.info("API cap nhat trang thai user id: {} -> isActive: {}", id, request.getIsActive());
        UserResponse updatedUser = userService.updateUserStatus(id, request.getIsActive());
        String msg = Boolean.TRUE.equals(request.getIsActive())
                ? "Mở khóa tài khoản thành công!"
                : "Đã tạm khóa tài khoản người dùng!";
        return ApiResponse.success(msg, updatedUser);
    }

    @PutMapping("/{id}/role")
    @Operation(summary = "Cập nhật vai trò phân quyền người dùng", description = "Gán vai trò mới theo RBAC: ROLE_ADMIN, ROLE_WAREHOUSE_MANAGER, ROLE_OPERATOR")
    public ApiResponse<UserResponse> updateUserRole(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRoleRequest request) {
        log.info("API cap nhat vai tro user id: {} -> role: {}", id, request.getRole());
        UserResponse updatedUser = userService.updateUserRole(id, request.getRole());
        return ApiResponse.success("Cập nhật vai trò thành công!", updatedUser);
    }

    @PutMapping("/{id}/reset-password")
    @Operation(summary = "Khôi phục mật khẩu tài khoản về mặc định", description = "Đặt lại mật khẩu thành 123456 hoặc mật khẩu mới chỉ định")
    public ApiResponse<String> resetPassword(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> payload) {
        String newPassword = (payload != null) ? payload.get("newPassword") : "123456";
        log.info("API reset mat khau user id: {}", id);
        userService.resetPassword(id, newPassword);
        return ApiResponse.success("Mật khẩu đã được đặt lại thành công về: " + (newPassword != null ? newPassword : "123456"));
    }

    @PutMapping("/change-password")
    @Operation(summary = "Người dùng tự đổi mật khẩu cá nhân", description = "Xác thực mật khẩu cũ và đổi sang mật khẩu mới")
    public ApiResponse<String> changePassword(@Valid @RequestBody com.wms.module.identity.dto.request.ChangePasswordRequest request) {
        log.info("API nguoi dung {} doi mat khau", request.getUsername());
        userService.changePassword(request);
        return ApiResponse.success("Đổi mật khẩu thành công! Vui lòng ghi nhớ mật khẩu mới cho các lần đăng nhập tiếp theo.", "SUCCESS");
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật thông tin và vai trò tài khoản", description = "Admin cập nhật họ tên, email, vai trò và kho phụ trách")
    public ApiResponse<UserResponse> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody com.wms.module.identity.dto.request.UpdateUserRequest request) {
        log.info("API cap nhat thong tin user id: {}", id);
        UserResponse updated = userService.updateUser(id, request);
        return ApiResponse.success("Cập nhật thông tin tài khoản thành công!", updated);
    }

    @PostMapping("/{id}/force-logout")
    @Operation(summary = "Cưỡng chế hủy phiên đăng nhập (Force Logout)", description = "Thu hồi toàn bộ Token và đăng xuất tài khoản ngay lập tức")
    public ApiResponse<String> forceLogout(@PathVariable Long id) {
        log.info("API cuong che dang xuat user id: {}", id);
        userService.forceLogout(id);
        return ApiResponse.success("Đã cưỡng chế đăng xuất và thu hồi phiên làm việc của người dùng!", "LOGGED_OUT");
    }

    @GetMapping("/{id}/security-log")
    @Operation(summary = "Xem nhật ký an ninh và lịch sử đăng nhập", description = "Truy vết lịch sử IP, thiết bị và đánh giá mức độ rủi ro")
    public ApiResponse<com.wms.module.identity.dto.response.UserSecurityLogResponse> getSecurityLog(@PathVariable Long id) {
        log.info("API lay security audit log user id: {}", id);
        var logResponse = userService.getUserSecurityLog(id);
        return ApiResponse.success("Lấy nhật ký an ninh thành công!", logResponse);
    }
}


