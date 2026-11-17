package com.wms.module.inventory.dto.request;

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

    private Integer countedQty;

    private Integer actualQuantity;

    private String notes;

    public Integer getEffectiveCountedQty() {
        return countedQty != null ? countedQty : actualQuantity;
    }
}
