package com.wms.module.inventory.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConcurrencySimulationRequest {
    private Long productId;
    private Long locationId;
    private Long batchId;
    @Builder.Default
    private Integer threadCount = 20;
    @Builder.Default
    private Integer requestedQtyPerThread = 1;
}

