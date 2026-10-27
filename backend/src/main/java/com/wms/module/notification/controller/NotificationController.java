package com.wms.module.notification.controller;

import com.wms.common.response.ApiResponse;
import com.wms.module.notification.dto.NotificationMessage;
import com.wms.module.notification.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
@Tag(name = "8. Thông Báo Thời Gian Thực (WebSocket & SSE)", description = "APIs nhận và phát thông báo sự kiện kho hàng theo thời gian thực")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/recent")
    @Operation(summary = "Lấy danh sách thông báo gần đây", description = "Trả về tối đa 50 thông báo gần nhất để hiển thị trong Notification Center")
    public ApiResponse<List<NotificationMessage>> getRecentNotifications() {
        return ApiResponse.success("Lấy thông báo thành công!", notificationService.getRecentNotifications());
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Lấy số lượng thông báo chưa đọc", description = "Đếm số thông báo có isRead = false")
    public ApiResponse<java.util.Map<String, Long>> getUnreadCount() {
        long count = notificationService.getUnreadCount();
        return ApiResponse.success("Lấy số thông báo chưa đọc thành công!", java.util.Map.of("unreadCount", count));
    }

    @PutMapping("/{id}/read")
    @Operation(summary = "Đánh dấu thông báo đã đọc", description = "Cập nhật trạng thái isRead của một thông báo")
    public ApiResponse<String> markAsRead(@PathVariable String id) {
        notificationService.markAsRead(id);
        return ApiResponse.success("Đã đánh dấu đã đọc!", id);
    }

    @PutMapping("/read-all")
    @Operation(summary = "Đánh dấu tất cả thông báo đã đọc", description = "Chuyển tất cả thông báo hiện có sang trạng thái đã đọc")
    public ApiResponse<String> markAllAsRead() {
        notificationService.markAllAsRead();
        return ApiResponse.success("Đã đánh dấu tất cả đã đọc!");
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "Đăng ký nhận thông báo đẩy qua SSE (Server-Sent Events)", description = "Luồng kết nối stream thời gian thực cho trình duyệt")
    public SseEmitter subscribeStream() {
        return notificationService.subscribeSse();
    }

    @PostMapping("/test")
    @Operation(summary = "Phát thông báo thử nghiệm (Demo)", description = "Bắn thử thông báo để test hiển thị Toast và chuông báo trên giao diện")
    public ApiResponse<NotificationMessage> sendTestNotification(@RequestBody NotificationMessage message) {
        if (message.getTitle() == null) {
            message.setTitle("Cảnh báo thử nghiệm từ hệ thống");
        }
        if (message.getMessage() == null) {
            message.setMessage("Kiểm tra kênh thông báo thời gian thực WebSocket & Toast Notification.");
        }
        if (message.getSeverity() == null) {
            message.setSeverity("WARNING");
        }
        if (message.getType() == null) {
            message.setType("SYSTEM_ALERT");
        }
        notificationService.broadcast(message);
        return ApiResponse.success("Đã phát thông báo thử nghiệm thành công!", message);
    }
}
