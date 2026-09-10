package com.wms.module.order.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Yêu cầu thuật toán gợi ý vị trí cất hàng (Put-away)")
public class SuggestLocationRequest {

    @NotBlank(message = "Phân khu ưu tiên không được để trống")
    @Schema(description = "Phân khu lưu trữ (ZONE_A: Hàng khô, ZONE_B: Hàng mát)", example = "ZONE_A")
    private String preferredZone;

    @NotNull(message = "Trọng lượng kiện hàng không được để trống")
    @Schema(description = "Tổng trọng lượng hàng (kg). Nếu > 100kg thuật toán tự động ưu tiên tầng trệt S01", example = "120.5")
    private BigDecimal totalWeightKg;
}
