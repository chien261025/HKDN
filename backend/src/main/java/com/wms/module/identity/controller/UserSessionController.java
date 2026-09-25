package com.wms.module.identity.controller;

import com.wms.common.response.ApiResponse;
import com.wms.module.identity.dto.response.UserSessionResponse;
import com.wms.module.identity.repository.UserRepository;
import com.wms.module.identity.security.JwtTokenProvider;
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
@RequestMapping("/users")
@RequiredArgsConstructor
@Tag(name = "1.2 Quản lý Phiên & Thiết bị Đăng nhập (Device Session Management)", description = "APIs quản lý đa thiết bị, giới hạn phiên đồng thời và đăng xuất từ xa")
public class UserSessionController {

    private final UserSessionService sessionService;
    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;

    @GetMapping("/{userId}/sessions")
    @Operation(summary = "Lấy danh sách các thiết bị đang đăng nhập", description = "Liệt kê chi tiết thiết bị, IP, vị trí địa lý và phiên hiện tại của người dùng")
    public ApiResponse<List<UserSessionResponse>> getUserSessions(
            @PathVariable Long userId,
            HttpServletRequest request) {
        String token = extractBearerToken(request);
        log.info("API lay danh sach thiet bi dang nhap cua user id: {}", userId);
        List<UserSessionResponse> sessions = sessionService.getUserSessions(userId, token);
        return ApiResponse.success("Lấy danh sách thiết bị thành công!", sessions);
    }

    @DeleteMapping("/{userId}/sessions/{sessionId}")
    @Operation(summary = "Đăng xuất từ xa một thiết bị cụ thể", description = "Thu hồi quyền truy cập và chấm dứt phiên làm việc của một thiết bị chỉ định")
    public ApiResponse<String> revokeSession(
            @PathVariable Long userId,
            @PathVariable String sessionId) {
        log.info("API thu hoi thiet bi {} cua user id: {}", sessionId, userId);
        sessionService.revokeSession(userId, sessionId);
        return ApiResponse.success("Đã đăng xuất thiết bị thành công!", sessionId);
    }

    @DeleteMapping("/{userId}/sessions/others")
    @Operation(summary = "Đăng xuất khỏi tất cả các thiết bị khác", description = "Thu hồi toàn bộ phiên làm việc trên các thiết bị khác ngoại trừ thiết bị hiện hành")
    public ApiResponse<String> revokeOtherSessions(
            @PathVariable Long userId,
            HttpServletRequest request) {
        String token = extractBearerToken(request);
        log.info("API dang xuat tat ca cac thiet bi khac cua user id: {}", userId);
        sessionService.revokeOtherSessions(userId, token);
        return ApiResponse.success("Đã đăng xuất khỏi tất cả các thiết bị khác thành công!");
    }

    // --- Self-service endpoints for currently logged-in user ---

    @GetMapping("/me/sessions")
    @Operation(summary = "Lấy danh sách phiên đăng nhập của chính mình", description = "Dành cho màn hình cài đặt tài khoản cá nhân")
    public ApiResponse<List<UserSessionResponse>> getMySessions(HttpServletRequest request) {
        String token = extractBearerToken(request);
        Long userId = resolveCurrentUserId(token);
        log.info("API lay danh sach thiet bi cua phien hien tai (userId: {})", userId);
        List<UserSessionResponse> sessions = sessionService.getUserSessions(userId, token);
        return ApiResponse.success("Lấy danh sách thiết bị thành công!", sessions);
    }

    @DeleteMapping("/me/sessions/{sessionId}")
    @Operation(summary = "Tự đăng xuất một thiết bị", description = "Thu hồi phiên làm việc của một thiết bị cụ thể")
    public ApiResponse<String> revokeMySession(
            @PathVariable String sessionId,
            HttpServletRequest request) {
        String token = extractBearerToken(request);
        Long userId = resolveCurrentUserId(token);
        log.info("API user {} tu thu hoi thiet bi: {}", userId, sessionId);
        sessionService.revokeSession(userId, sessionId);
        return ApiResponse.success("Đã đăng xuất thiết bị thành công!", sessionId);
    }

    @DeleteMapping("/me/sessions/others")
    @Operation(summary = "Tự đăng xuất khỏi tất cả các thiết bị khác", description = "Thu hồi phiên làm việc trên tất cả các thiết bị khác")
    public ApiResponse<String> revokeMyOtherSessions(HttpServletRequest request) {
        String token = extractBearerToken(request);
        Long userId = resolveCurrentUserId(token);
        log.info("API user {} tu dang xuat khoi tat ca cac thiet bi khac", userId);
        sessionService.revokeOtherSessions(userId, token);
        return ApiResponse.success("Đã đăng xuất khỏi tất cả các thiết bị khác thành công!");
    }

    private Long resolveCurrentUserId(String token) {
        if (token == null) {
            throw new IllegalArgumentException("Không tìm thấy phiên xác thực!");
        }
        String username = jwtTokenProvider.getUsernameFromToken(token);
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thông tin tài khoản: " + username))
                .getId();
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

