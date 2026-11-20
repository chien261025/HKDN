package com.wms.module.inventory.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConcurrencySimulationResponse {

    private String testName;
    private Long productId;
    private String productSku;
    private String productName;
    private int initialAvailableQty;
    private int totalThreads;
    private int requestedQtyPerThread;
    private int successfulReservations;
    private int blockedReservations;
    private int finalAvailableQty;
    private long executionTimeMs;
    private boolean isNegativeStockPrevented;
    private String lockingMechanism;
    private String conclusion;
    private List<ThreadLog> threadLogs;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ThreadLog {
        private int threadId;
        private String threadName;
        private boolean success;
        private int requestedQty;
        private String status;
        private String message;
        private long durationMicros;
    }
}

