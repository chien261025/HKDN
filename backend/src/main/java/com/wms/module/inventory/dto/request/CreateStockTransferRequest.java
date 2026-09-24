package com.wms.module.inventory.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Yêu cầu thực hiện điều chuyển tồn kho giữa các ô kệ")
public class CreateStockTransferRequest {

    @NotNull(message = "Mã sản phẩm không được để trống")
    @Schema(description = "ID của sản phẩm cần điều chuyển", example = "1")
    private Long productId;

    @NotNull(message = "Vị trí ô nguồn không được để trống")
    @Schema(description = "ID ô kệ nguồn lấy hàng", example = "5")
    private Long fromLocationId;

    @NotNull(message = "Vị trí ô đích không được để trống")
    @Schema(description = "ID ô kệ đích cất hàng", example = "6")
    private Long toLocationId;

    @NotNull(message = "Mã lô hàng không được để trống")
    @Schema(description = "ID lô hàng cần điều chuyển", example = "1")
    private Long batchId;

    @NotNull(message = "Số lượng điều chuyển không được để trống")
    @Min(value = 1, message = "Số lượng điều chuyển tối thiểu là 1")
    @Schema(description = "Số lượng hàng thực tế cần chuyển", example = "10")
    private Integer quantity;

    @Schema(description = "Ghi chú hoặc lý do điều chuyển", example = "Sắp xếp lại kho hàng, dồn về ô gần xuất")
    private String notes;
}
