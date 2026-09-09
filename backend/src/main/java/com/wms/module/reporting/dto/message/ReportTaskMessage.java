package com.wms.module.reporting.dto.message;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportTaskMessage implements Serializable {
    private UUID jobId;
    private String reportType; // INVENTORY_SUMMARY, STOCK_LEDGER, EXPIRING_BATCHES
    private String requestedBy;
    private long requestedAtTimestamp;
}
