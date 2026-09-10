package com.wms.module.smartquery.text2sql;

import com.wms.common.exception.BusinessException;
import com.wms.common.exception.ErrorCode;
import net.sf.jsqlparser.parser.CCJSqlParserUtil;
import net.sf.jsqlparser.statement.Statement;
import net.sf.jsqlparser.statement.select.PlainSelect;
import net.sf.jsqlparser.statement.select.Select;
import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

/**
 * Bộ kiểm duyệt ngữ pháp AST bảo vệ Cơ sở dữ liệu trước các câu lệnh do AI sinh ra
 */
@Component
public class SqlAstSanitizer {

    private static final Pattern FORBIDDEN_WORDS = Pattern.compile(
            "\\b(DROP|DELETE|UPDATE|INSERT|TRUNCATE|ALTER|GRANT|REVOKE|EXEC|CREATE)\\b",
            Pattern.CASE_INSENSITIVE
    );

    /**
     * Phân tích và làm sạch câu SQL do AI sinh ra:
     * 1. Chỉ cho phép câu lệnh SELECT
     * 2. Chặn đứng mã độc phá hoại
     * 3. Ép thêm LIMIT 50 vào cuối câu để tránh tràn RAM
     */
    public String sanitizeAndEnforceLimit(String rawSql) {
        if (rawSql == null || rawSql.trim().isEmpty()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Câu truy vấn SQL không được để trống");
        }

        // Lớp 1: Kiểm tra từ khóa cấm bằng Regex
        if (FORBIDDEN_WORDS.matcher(rawSql).find()) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "Cảnh báo bảo mật: Phát hiện câu lệnh thao tác ghi/xóa cơ sở dữ liệu!");
        }

        try {
            // Lớp 2: Parse thành cây cú pháp trừu tượng (AST) với JSqlParser
            Statement statement = CCJSqlParserUtil.parse(rawSql);

            if (!(statement instanceof Select select)) {
                throw new BusinessException(ErrorCode.FORBIDDEN, "Trợ lý AI chỉ được phép thực hiện câu lệnh SELECT!");
            }

            PlainSelect plainSelect = select.getPlainSelect();
            if (plainSelect != null && plainSelect.getLimit() == null) {
                // Tự động ép LIMIT 50 nếu câu lệnh chưa có limit
                plainSelect.setLimit(new net.sf.jsqlparser.statement.select.Limit().withRowCount(
                        new net.sf.jsqlparser.expression.LongValue(50)
                ));
            }

            return select.toString();

        } catch (Exception e) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Cú pháp SQL do AI sinh ra không hợp lệ: " + e.getMessage());
        }
    }
}
