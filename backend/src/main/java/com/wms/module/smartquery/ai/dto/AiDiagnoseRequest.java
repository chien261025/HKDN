package com.wms.module.smartquery.ai.dto;

import jakarta.validation.constraints.Size;

/**
 * Yêu cầu chẩn đoán sự cố kho vận gửi tới Trợ lý Gemini AI.
 * Hỗ trợ cả hỏi tự do (question) lẫn ngữ cảnh định danh (orderCode, sku, warehouseCode, requestedQty).
 */
public record AiDiagnoseRequest(
        @Size(max = 1000, message = "Câu hỏi không được vượt quá 1000 ký tự")
        String question,
        String warehouseCode,
        String orderCode,
        String sku,
        Integer requestedQty,
        String historyContext
) {
    public AiDiagnoseRequest(String question, String warehouseCode, String orderCode, String sku, Integer requestedQty) {
        this(question, warehouseCode, orderCode, sku, requestedQty, null);
    }
}

