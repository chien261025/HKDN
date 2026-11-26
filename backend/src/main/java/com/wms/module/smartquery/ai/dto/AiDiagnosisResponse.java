package com.wms.module.smartquery.ai.dto;

import java.util.List;

/**
 * Phản hồi chẩn đoán sự cố có bằng chứng của Trợ lý Gemini AI SMART WMS.
 * Toàn bộ số liệu breakdown và chứng từ evidences được xuất trực tiếp từ Java Service để loại bỏ sai số LLM.
 */
public record AiDiagnosisResponse(
        String answer,
        String engineMode,
        String warehouseCode,
        String warehouseName,
        DiagnosisBreakdown breakdown,
        List<DiagnosisEvidence> evidences,
        List<String> recommendations,
        List<ToolCallLog> toolLogs,
        List<ActionLink> actions,
        long executionTimeMs
) {
    public record DiagnosisBreakdown(
            String orderCode,
            String sku,
            String productName,
            String unit,
            Integer requestedQty,
            Integer onHandQty,
            Integer reservedQty,
            Integer unavailableQty,
            Integer availableQty,
            Integer shortageQty,
            boolean consistent
    ) {}

    public record DiagnosisEvidence(
            String type,
            String code,
            Integer qty,
            String statusLabel,
            String detail,
            String link
    ) {}

    public record ToolCallLog(
            String toolName,
            String argsSummary,
            String status,
            long durationMs
    ) {}

    public record ActionLink(
            String label,
            String targetUrl,
            String variant
    ) {}
}

