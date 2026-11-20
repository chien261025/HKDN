package com.wms.module.identity.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.*;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Nhật ký kiểm toán an ninh và thay đổi phân quyền")
public class AuditLogResponse {

    private Long id;
    private String action;
    private String actorUsername;
    private String targetType;
    private String targetId;
    private String targetName;
    private String details;
    private String ipAddress;
    private String userAgent;
    private Instant createdAt;
}

