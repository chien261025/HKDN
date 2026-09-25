package com.wms.module.identity.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Chi tiết phiên làm việc và thiết bị đăng nhập của người dùng")
public class UserSessionResponse {

    @Schema(description = "Mã định danh duy nhất của phiên (UUID)", example = "3fa85f64-5717-4562-b3fc-2c963f66afa6")
    private String id;

    @Schema(description = "ID người dùng", example = "1")
    private Long userId;

    @Schema(description = "Tên đăng nhập", example = "admin")
    private String username;

    @Schema(description = "Tên thiết bị nhận diện", example = "Windows 11 (Google Chrome)")
    private String deviceName;

    @Schema(description = "Phân loại thiết bị (DESKTOP, MOBILE_PDA, TABLET)", example = "DESKTOP")
    private String deviceType;

    @Schema(description = "Địa chỉ IP thực của thiết bị", example = "192.168.1.101")
    private String ipAddress;

    @Schema(description = "Vị trí địa lý / Mạng LAN kho hàng", example = "Kho Tổng Tân Bình - ZONE A (LAN Nội Bộ)")
    private String locationName;

    @Schema(description = "Trạng thái phiên đang hoạt động", example = "true")
    private Boolean isActive;

    @Schema(description = "Đánh dấu thiết bị đang gửi request hiện tại", example = "true")
    private Boolean isCurrentSession;

    @Schema(description = "Thời điểm đăng nhập thiết bị")
    private Instant createdAt;

    @Schema(description = "Thời điểm tương tác gần nhất")
    private Instant lastActiveAt;

    @Schema(description = "Lý do thu hồi phiên nếu bị ngắt", example = "KICKED_FIFO_BY_NEW_DEVICE")
    private String revokedReason;
}
