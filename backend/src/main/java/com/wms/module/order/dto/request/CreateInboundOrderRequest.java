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
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateInboundOrderRequest {

    private String orderCode;

    private Long warehouseId;

    private Long supplierId;

    private String notes;

    @NotEmpty(message = "Danh sách sản phẩm nhập không được để trống")
    @Valid
    private List<ItemRequest> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemRequest {
        @NotNull(message = "ID sản phẩm không được để trống")
        private Long productId;

        @NotNull(message = "Số lượng kỳ vọng không được để trống")
        @Positive(message = "Số lượng kỳ vọng phải lớn hơn 0")
        private Integer expectedQty;

        private String batchNumber;

        private LocalDate expiryDate;

        private BigDecimal unitPrice;
    }
}
