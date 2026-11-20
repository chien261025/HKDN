package com.wms.module.order.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConfirmPickingRequest {

    private String notes;
    private String pickerName;
    private List<ItemPickingRequest> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemPickingRequest {
        private Long orderItemId;
        private Integer pickedQty;
    }
}

