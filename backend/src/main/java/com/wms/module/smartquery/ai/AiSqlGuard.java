package com.wms.module.smartquery.ai;

import com.wms.common.exception.BusinessException;
import com.wms.common.exception.ErrorCode;
import com.wms.module.smartquery.text2sql.SqlAstSanitizer;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Locale;
import java.util.regex.Pattern;

@Component
@RequiredArgsConstructor
public class AiSqlGuard {
    private static final Pattern ALLOWED_VIEW = Pattern.compile(
            "(?:\\b(?:FROM|JOIN)\\s+)(?:`?wms_db`?\\.)?`?(v_stock_summary|v_expiring_batches)`?\\b",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern FORBIDDEN = Pattern.compile(
            "\\b(UNION|SLEEP|BENCHMARK|LOAD_FILE|INTO\\s+OUTFILE|FOR\\s+UPDATE|INFORMATION_SCHEMA|MYSQL\\.|SYS\\.)\\b",
            Pattern.CASE_INSENSITIVE);
    private final SqlAstSanitizer sanitizer;

    public String guard(String rawSql) {
        String normalized = rawSql == null ? "" : rawSql.trim();
        if (FORBIDDEN.matcher(normalized).find() || !ALLOWED_VIEW.matcher(normalized).find()) {
            throw new BusinessException(ErrorCode.FORBIDDEN,
                    "Trợ lý Gemini chỉ được đọc dữ liệu từ các view kho đã được cho phép");
        }
        String safeSql = sanitizer.sanitizeAndEnforceLimit(normalized);
        if (safeSql.toLowerCase(Locale.ROOT).contains("limit ")) return safeSql;
        return safeSql;
    }
}
