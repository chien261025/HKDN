package com.wms.module.smartquery.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wms.common.exception.BusinessException;
import com.wms.common.exception.ErrorCode;
import com.wms.module.smartquery.ai.dto.AiChatRequest;
import com.wms.module.smartquery.ai.dto.AiChatResponse;
import com.wms.module.smartquery.ai.dto.SqlPlan;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.ColumnMapRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AiChatService {
    private static final String SQL_SYSTEM = """
            Bạn là bộ sinh SQL cho Smart WMS. Chỉ trả JSON đúng dạng {\"sql\":\"...\"}, không markdown.
            Chỉ được SELECT từ v_stock_summary hoặc v_expiring_batches. Không dùng bảng khác, UNION, ghi dữ liệu,
            information_schema, hàm SLEEP/LOAD_FILE, FOR UPDATE. Luôn có LIMIT tối đa 50.
            Schema v_stock_summary (chính xác): warehouse_code, warehouse_name, zone_code, aisle, rack, shelf, bin,
            bin_barcode, sku, product_name, category_name, unit, batch_number, expiry_date, batch_status,
            on_hand_qty, reserved_qty, available_qty. Không dùng location_code; mã vị trí là bin_barcode.
            Schema v_expiring_batches (chính xác): sku, product_name, category_name, batch_number, expiry_date,
            days_until_expiry, total_on_hand, total_reserved, total_available. Không dùng on_hand_qty hoặc location_code.
            Khi hỏi theo phân khu, dùng zone_code; khi hỏi theo ô kệ, dùng bin_barcode.
            Câu hỏi ngoài phạm vi dữ liệu phải trả SQL SELECT hợp lệ với LIMIT 50 và không bịa bảng.
            """;
    private static final String ANSWER_SYSTEM = "Bạn là trợ lý kho vận Gemini. Trả lời tiếng Việt ngắn gọn, chỉ dựa trên rows được cung cấp. Không bịa số liệu.";

    private final GeminiClient geminiClient;
    private final AiSqlGuard sqlGuard;
    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;

    public AiChatResponse chat(AiChatRequest request) {
        long started = System.currentTimeMillis();
        try {
            String planJson = geminiClient.generate(SQL_SYSTEM, request.question(), true);
            SqlPlan plan = objectMapper.readValue(stripCodeFence(planJson), SqlPlan.class);
            String safeSql = sqlGuard.guard(plan.sql());
            List<Map<String, Object>> rows = jdbcTemplate.query(safeSql, new ColumnMapRowMapper());
            String answer = rows.isEmpty()
                    ? "Không tìm thấy dữ liệu phù hợp trong phạm vi dữ liệu kho được phép tra cứu."
                    : geminiClient.generate(ANSWER_SYSTEM,
                    "Câu hỏi: " + request.question() + "\nSQL: " + safeSql + "\nDữ liệu JSON: " + objectMapper.writeValueAsString(rows), false);
            return new AiChatResponse(answer, safeSql, "VERIFIED", System.currentTimeMillis() - started, rows);
        } catch (BusinessException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR, "Không thể xử lý câu hỏi với Gemini: " + ex.getMessage());
        }
    }

    private String stripCodeFence(String value) {
        return value.replace("```json", "").replace("```", "").trim();
    }
}
