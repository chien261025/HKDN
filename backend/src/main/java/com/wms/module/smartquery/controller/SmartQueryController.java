package com.wms.module.smartquery.controller;

import com.wms.common.response.ApiResponse;
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
@Tag(name = "6. Trợ Lý AI Smart Query & Text-to-SQL AST", description = "APIs kiểm duyệt cú pháp AST và bảo vệ an toàn CSDL trước câu lệnh AI")
public class SmartQueryController {

    private final SqlAstSanitizer sqlAstSanitizer;

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
