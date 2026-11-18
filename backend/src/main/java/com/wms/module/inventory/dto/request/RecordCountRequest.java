package com.wms.module.inventory.dto.request;

import jakarta.validation.constraints.Min;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecordCountRequest {

    private Long itemId;

    private Long locationId;

    private Long productId;

    @Min(value = 0, message = "Số lượng kiểm đếm không được là số âm")
    private Integer countedQty;

    @Min(value = 0, message = "Số lượng kiểm đếm không được là số âm")
    private Integer actualQuantity;

    private String notes;

    public Integer getEffectiveCountedQty() {
        return countedQty != null ? countedQty : actualQuantity;
    }
}
