package com.wms.module.smartquery.ai.dto;

import java.util.List;
import java.util.Map;

public record AiChatResponse(
        String answer,
        String sqlQuery,
        String astStatus,
        long executionTimeMs,
        List<Map<String, Object>> tableData,
        AiDiagnosisResponse diagnosis
) {
    public AiChatResponse(
            String answer,
            String sqlQuery,
            String astStatus,
            long executionTimeMs,
            List<Map<String, Object>> tableData
    ) {
        this(answer, sqlQuery, astStatus, executionTimeMs, tableData, null);
    }
}
