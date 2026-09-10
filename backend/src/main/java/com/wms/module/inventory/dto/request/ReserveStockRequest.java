package com.wms.module.inventory.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(description = "Yêu cầu khóa và giữ trước hàng (Pessimistic Lock)")
public class ReserveStockRequest {

    @NotNull(message = "Product ID không được để trống")
    @Schema(description = "ID của sản phẩm", example = "1")
    private Long productId;

    @NotNull(message = "Location ID không được để trống")
    @Schema(description = "ID của ô kệ chứa hàng", example = "5")
    private Long locationId;

    @NotNull(message = "Batch ID không được để trống")
    @Schema(description = "ID của lô hàng", example = "1")
    private Long batchId;

    @NotNull(message = "Số lượng yêu cầu giữ không được để trống")
    @Min(value = 1, message = "Số lượng giữ phải lớn hơn hoặc bằng 1")
    @Schema(description = "Số lượng muốn giữ", example = "5")
    private Integer requestedQty;
}
