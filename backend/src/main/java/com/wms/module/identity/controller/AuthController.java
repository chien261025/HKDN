package com.wms.module.identity.controller;

import com.wms.common.exception.BusinessException;
import com.wms.common.exception.ErrorCode;
import com.wms.common.response.ApiResponse;
import com.wms.module.identity.dto.request.LoginRequest;
import com.wms.module.identity.dto.response.AuthTokenResponse;
import com.wms.module.identity.entity.User;
import com.wms.module.identity.repository.UserRepository;
import com.wms.module.identity.security.JwtTokenProvider;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "1. Định danh & Phân quyền (Identity & RBAC)", description = "APIs đăng nhập JWT và thông tin người dùng")
public class AuthController {

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    @Operation(summary = "Đăng nhập hệ thống (Lấy JWT Token)",
               description = "Nhập tài khoản và mật khẩu. Tài khoản mẫu: manager01 / 123456 hoặc admin / 123456")
    public ApiResponse<AuthTokenResponse> login(@Valid @RequestBody LoginRequest request) {
        log.info("Yeu cau dang nhap tu: {}", request.getUsername());

        // 1. Kiểm tra tài khoản trong Database
        User user = userRepository.findByUsername(request.getUsername()).orElse(null);

        String roleName = "ROLE_WAREHOUSE_MANAGER";
        String fullName = "Trần Trưởng Kho";

        if (user != null) {
            // Kiểm tra mật khẩu mã hóa BCrypt
            boolean matches = passwordEncoder.matches(request.getPassword(), user.getPasswordHash())
                    || "123456".equals(request.getPassword()); // Hỗ trợ mật khẩu demo 123456

            if (!matches) {
                throw new BusinessException(ErrorCode.UNAUTHORIZED, "Mật khẩu không chính xác");
            }
            if (user.getRoles() != null && !user.getRoles().isEmpty()) {
                roleName = user.getRoles().iterator().next().getName();
            }
            fullName = user.getFullName();
        } else {
            // Hỗ trợ chế độ demo nhanh nếu chưa seed DB
            if ("admin".equalsIgnoreCase(request.getUsername()) && "123456".equals(request.getPassword())) {
                roleName = "ROLE_ADMIN";
                fullName = "Nguyễn Quản Trị";
            } else if ("manager01".equalsIgnoreCase(request.getUsername()) && "123456".equals(request.getPassword())) {
                roleName = "ROLE_WAREHOUSE_MANAGER";
                fullName = "Trần Trưởng Kho";
            } else if ("operator01".equalsIgnoreCase(request.getUsername()) && "123456".equals(request.getPassword())) {
                roleName = "ROLE_OPERATOR";
                fullName = "Lê Thủ Kho";
            } else {
                throw new BusinessException(ErrorCode.UNAUTHORIZED, "Tài khoản hoặc mật khẩu không đúng!");
            }
        }

        // 2. Tạo JWT Token
        String token = jwtTokenProvider.generateToken(request.getUsername(), roleName);

        AuthTokenResponse response = AuthTokenResponse.builder()
                .accessToken(token)
                .tokenType("Bearer")
                .username(request.getUsername())
                .fullName(fullName)
                .role(roleName)
                .expiresIn(86400000L)
                .build();

        return ApiResponse.success("Đăng nhập thành công!", response);
    }

    @GetMapping("/demo-accounts")
    @Operation(summary = "Xem danh sách tài khoản demo có sẵn", description = "Danh sách tài khoản và mật khẩu mặc định để test trên Swagger")
    public ApiResponse<List<Map<String, String>>> getDemoAccounts() {
        List<Map<String, String>> accounts = List.of(
                Map.of("username", "admin", "password", "123456", "role", "ROLE_ADMIN", "desc", "Quản trị viên"),
                Map.of("username", "manager01", "password", "123456", "role", "ROLE_WAREHOUSE_MANAGER", "desc", "Trưởng kho"),
                Map.of("username", "operator01", "password", "123456", "role", "ROLE_OPERATOR", "desc", "Thủ kho quét mã")
        );
        return ApiResponse.success(accounts);
    }
}
