package com.wms.module.reporting.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Yêu cầu kích hoạt tác vụ xuất báo cáo dữ liệu lớn ngầm")
public class ExportReportRequest {

    @NotBlank(message = "Loại báo cáo không được để trống")
    @Schema(description = "Loại báo cáo (VD: INVENTORY_BALANCE, EXPIRING_SOON)", example = "INVENTORY_BALANCE")
    private String reportType;
}
