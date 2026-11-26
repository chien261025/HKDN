package com.wms.module.smartquery.controller;

import com.wms.common.response.ApiResponse;
import com.wms.module.smartquery.ai.AiChatService;
import com.wms.module.smartquery.ai.GeminiDiagnosticService;
import com.wms.module.smartquery.ai.dto.AiChatRequest;
import com.wms.module.smartquery.ai.dto.AiChatResponse;
import com.wms.module.smartquery.ai.dto.AiDiagnoseRequest;
import com.wms.module.smartquery.ai.dto.AiDiagnosisResponse;
import com.wms.module.smartquery.dto.SanitizeSqlRequest;
import com.wms.module.smartquery.text2sql.SqlAstSanitizer;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/smartquery")
@RequiredArgsConstructor
@Tag(name = "6. Trợ Lý Gemini AI & Text-to-SQL AST", description = "APIs Trợ lý Gemini AI phân tích nguyên nhân sự cố xuất/tồn kho (Function Calling) và kiểm duyệt SQL AST")
public class SmartQueryController {

    private final SqlAstSanitizer sqlAstSanitizer;
    private final AiChatService aiChatService;
    private final GeminiDiagnosticService geminiDiagnosticService;

    @PostMapping("/chat")
    @Operation(summary = "Hỏi Trợ lý Gemini AI bằng dữ liệu kho thật (Function Calling & Text-to-SQL AST)")
    public ApiResponse<AiChatResponse> chat(@Valid @RequestBody AiChatRequest request) {
        return ApiResponse.success("Gemini AI đã phân tích dữ liệu kho", aiChatService.chat(request));
    }

    @PostMapping("/diagnose")
    @Operation(summary = "Chẩn đoán sự cố xuất kho SO, chênh lệch tồn kho SKU & điểm nghẽn vận hành bằng Gemini AI")
    public ApiResponse<AiDiagnosisResponse> diagnose(@Valid @RequestBody AiDiagnoseRequest request) {
        return ApiResponse.success("Gemini AI đã hoàn tất chẩn đoán", geminiDiagnosticService.diagnose(request));
    }

    @PostMapping("/sanitize-sql")
    @Operation(summary = "Kiểm duyệt an toàn câu lệnh SQL bằng AST (JSqlParser)",
               description = "Chặn đứng các câu lệnh phá hoại (DROP, DELETE, UPDATE, INSERT), chỉ cho phép SELECT và tự động tiêm 'LIMIT 50' để tránh tràn RAM.")
    public ApiResponse<Map<String, String>> sanitizeSql(@Valid @RequestBody SanitizeSqlRequest request) {
        log.info("Kiem duyet cau SQL: {}", request.getSql());
        String cleanSql = sqlAstSanitizer.sanitizeAndEnforceLimit(request.getSql());
        return ApiResponse.success("Câu truy vấn an toàn và đã được tối ưu!", Map.of(
                "inputSql", request.getSql(),
                "sanitizedSql", cleanSql
        ));
    }
}
