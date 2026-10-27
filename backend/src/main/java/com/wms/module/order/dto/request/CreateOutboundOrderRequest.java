package com.wms.module.order.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateOutboundOrderRequest {

    private String orderCode;

    private Long warehouseId;

    private String customerName;

    private String notes;

    @NotEmpty(message = "Danh sách sản phẩm xuất không được để trống")
    @Valid
    private List<ItemRequest> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemRequest {
        @NotNull(message = "ID sản phẩm không được để trống")
        private Long productId;

        @NotNull(message = "Số lượng yêu cầu xuất không được để trống")
        @Positive(message = "Số lượng xuất phải lớn hơn 0")
        private Integer requestedQty;

        private Integer allocatedQty;

        private BigDecimal unitPrice;
    }
}
