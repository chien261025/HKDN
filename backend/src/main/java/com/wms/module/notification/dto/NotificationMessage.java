package com.wms.module.notification.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Thông báo thời gian thực phát qua WebSocket và SSE")
public class NotificationMessage {

    private String id;
    private String type; // AUDIT_DISCREPANCY, AUDIT_RECONCILED, NEW_INBOUND, NEW_OUTBOUND, STOCK_TRANSFER, LOW_STOCK
    private String title;
    private String message;
    private String severity; // INFO, SUCCESS, WARNING, ERROR
    private String referenceCode;
    private String link;
    
    @Builder.Default
    private Instant timestamp = Instant.now();
    
    @Builder.Default
    private boolean isRead = false;
}
