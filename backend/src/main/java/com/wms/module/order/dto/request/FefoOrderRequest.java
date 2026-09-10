package com.wms.module.order.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Yêu cầu sinh lộ trình nhặt hàng theo chuẩn FEFO")
public class FefoOrderRequest {

    @NotNull(message = "Product ID không được để trống")
    @Schema(description = "ID của sản phẩm cần xuất (VD: 1 - Sữa Vinamilk)", example = "1")
    private Long productId;

    @NotNull(message = "Số lượng xuất không được để trống")
    @Min(value = 1, message = "Số lượng xuất tối thiểu là 1")
    @Schema(description = "Số lượng đơn vị cần xuất", example = "20")
    private Integer requiredQty;
}
