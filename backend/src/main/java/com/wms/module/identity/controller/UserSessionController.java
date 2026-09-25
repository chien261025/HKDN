package com.wms.module.identity.controller;

import com.wms.common.response.ApiResponse;
import com.wms.module.identity.dto.response.UserSessionResponse;
import com.wms.module.identity.service.UserSessionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/users/{userId}/sessions")
@RequiredArgsConstructor
@Tag(name = "1.2 Quản lý Phiên & Thiết bị Đăng nhập (Device Session Management)", description = "APIs quản lý đa thiết bị, giới hạn phiên đồng thời và đăng xuất từ xa theo chuẩn Shopee/Google")
public class UserSessionController {

    private final UserSessionService sessionService;

    @GetMapping
    @Operation(summary = "Lấy danh sách các thiết bị đang đăng nhập", description = "Liệt kê chi tiết thiết bị, IP, vị trí địa lý và phiên hiện tại của người dùng")
    public ApiResponse<List<UserSessionResponse>> getUserSessions(
            @PathVariable Long userId,
            HttpServletRequest request) {
        String token = extractBearerToken(request);
        log.info("API lay danh sach thiet bi dang nhap cua user id: {}", userId);
        List<UserSessionResponse> sessions = sessionService.getUserSessions(userId, token);
        return ApiResponse.success("Lấy danh sách thiết bị thành công!", sessions);
    }

    @DeleteMapping("/{sessionId}")
    @Operation(summary = "Đăng xuất từ xa một thiết bị cụ thể", description = "Thu hồi quyền truy cập và chấm dứt phiên làm việc của một thiết bị chỉ định")
    public ApiResponse<String> revokeSession(
            @PathVariable Long userId,
            @PathVariable String sessionId) {
        log.info("API thu hoi thiet bi {} cua user id: {}", sessionId, userId);
        sessionService.revokeSession(userId, sessionId);
        return ApiResponse.success("Đã đăng xuất thiết bị thành công!", sessionId);
    }

    @DeleteMapping("/others")
    @Operation(summary = "Đăng xuất khỏi tất cả các thiết bị khác", description = "Thu hồi toàn bộ phiên làm việc trên các thiết bị khác ngoại trừ thiết bị hiện hành")
    public ApiResponse<String> revokeOtherSessions(
            @PathVariable Long userId,
            HttpServletRequest request) {
        String token = extractBearerToken(request);
        log.info("API dang xuat tat ca cac thiet bi khac cua user id: {}", userId);
        sessionService.revokeOtherSessions(userId, token);
        return ApiResponse.success("Đã đăng xuất khỏi tất cả các thiết bị khác thành công!");
    }

    private String extractBearerToken(HttpServletRequest request) {
        if (request == null) return null;
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return null;
    }
}
