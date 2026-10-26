package com.wms.module.order.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExecutePutawayRequest {

    @NotNull(message = "Mã đơn nhập kho không được để trống")
    private Long orderId;

    private Long orderItemId;

    @NotNull(message = "Mã sản phẩm không được để trống")
    private Long productId;

    @NotNull(message = "Mã ô kệ cất hàng không được để trống")
    private Long locationId;

    @NotNull(message = "Số lượng cất hàng không được để trống")
    @Positive(message = "Số lượng phải lớn hơn 0")
    private Integer quantity;

    private String batchNumber;

    private LocalDate expiryDate;
}
