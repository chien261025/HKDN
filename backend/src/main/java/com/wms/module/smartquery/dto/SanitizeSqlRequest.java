package com.wms.module.smartquery.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Yêu cầu kiểm duyệt và làm sạch câu SQL do AI sinh ra")
public class SanitizeSqlRequest {

    @NotBlank(message = "Câu lệnh SQL không được để trống")
    @Schema(description = "Câu lệnh SQL thô do AI sinh ra (VD: SELECT * FROM v_stock_summary)",
            example = "SELECT sku, product_name, available_qty FROM v_stock_summary WHERE available_qty > 0")
    private String sql;
}
