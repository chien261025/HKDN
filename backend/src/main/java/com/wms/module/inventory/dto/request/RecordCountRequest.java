package com.wms.module.inventory.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecordCountRequest {

    @NotNull(message = "ItemId không được để trống")
    private Long itemId;

    @NotNull(message = "Số lượng đếm không được để trống")
    private Integer countedQty;

    private String notes;
}
