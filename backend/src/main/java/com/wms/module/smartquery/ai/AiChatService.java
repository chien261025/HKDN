package com.wms.module.smartquery.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wms.common.exception.BusinessException;
import com.wms.common.exception.ErrorCode;
import com.wms.module.masterdata.entity.Warehouse;
import com.wms.module.masterdata.repository.WarehouseRepository;
import com.wms.module.smartquery.ai.dto.AiChatRequest;
import com.wms.module.smartquery.ai.dto.AiChatResponse;
import com.wms.module.smartquery.ai.dto.AiDiagnoseRequest;
import com.wms.module.smartquery.ai.dto.AiDiagnosisResponse;
import com.wms.module.smartquery.ai.dto.SqlPlan;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.ColumnMapRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.time.DayOfWeek;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AiChatService {
    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter VN_DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy 'lúc' HH:mm");
    private static final Set<String> WH_GENERIC_TOKENS = Set.of(
            "kho", "tong", "phan", "phoi", "van", "trung", "chuyen", "tam", "chi", "nhanh", "tp", "mien"
    );

    private static final String SQL_SYSTEM = """
            Bạn là bộ phân loại ý định và sinh SQL cho Kora AI — trợ lý kho vận thông minh của SMART WMS. Chỉ trả JSON thuần, KHÔNG markdown:
            {"inScope": true|false, "sql": "...", "directReply": "..."}
            1. NẾU câu hỏi yêu cầu tra cứu dữ liệu THỰC TẾ trong kho (tồn kho, sản phẩm cụ thể, danh sách/top SKU, lô hàng, hạn sử dụng, phân khu, vị trí ô kệ, tình trạng hết hàng/tồn thấp):
               - Đặt "inScope": true, "directReply": "".
               - Viết 1 câu SELECT hợp lệ từ v_stock_summary hoặc v_expiring_batches, KHÔNG dùng bảng khác, KHÔNG UNION, KHÔNG ghi dữ liệu, KHÔNG information_schema/SLEEP/LOAD_FILE/FOR UPDATE, luôn lọc WHERE warehouse_code = '...' và có LIMIT tối đa 50.
               - Schema v_stock_summary (MỖI DÒNG LÀ 1 Ô KỆ x 1 LÔ): warehouse_code, warehouse_name, zone_code, aisle, rack, shelf, bin, bin_barcode, location_active, sku, product_name, category_name, unit, batch_number, expiry_date, batch_status, on_hand_qty, reserved_qty, unavailable_qty, available_qty. Không dùng location_code; mã vị trí là bin_barcode.
               - Schema v_expiring_batches: warehouse_code, warehouse_name, sku, product_name, category_name, batch_number, expiry_date, days_until_expiry, total_on_hand, total_reserved, total_available. Không dùng on_hand_qty hoặc location_code.
               - QUY TẮC CẤP TỔNG HỢP (GRAIN RULE - BẮT BUỘC):
                 + Khi hỏi về "tình trạng tồn kho", "tồn kho chi nhánh", "danh sách mặt hàng", "tồn thấp", "sắp hết" hoặc không nhắc tới ô kệ/bin/lô cụ thể: BẮT BUỘC phải tổng hợp theo sản phẩm bằng GROUP BY sku, product_name, unit và SUM(on_hand_qty) AS total_on_hand, SUM(reserved_qty) AS total_reserved, SUM(unavailable_qty) AS total_blocked, SUM(available_qty) AS total_available (kèm HAVING SUM(on_hand_qty) > 0 nếu không hỏi riêng hàng hết = 0, ORDER BY total_available DESC hoặc ASC). TUYỆT ĐỐI KHÔNG SELECT thô on_hand_qty/available_qty thiếu GROUP BY vì 1 SKU có nhiều ô kệ rỗng sẽ bị cắt mất bởi LIMIT 50.
                 + CHỈ bỏ GROUP BY sku khi hỏi chi tiết vị trí ô kệ (`bin_barcode`), kệ đang khóa (`location_active = 0`) hoặc từng mã lô (`batch_number`), và luôn thêm `AND (on_hand_qty > 0 OR reserved_qty > 0)` để bỏ qua ô kệ rỗng lịch sử.
               - Khi hỏi theo phân khu, dùng zone_code với giá trị chuẩn: 'ZONE_A', 'ZONE_B', 'ZONE_C', 'ZONE_QUA' (KHÔNG viết 'A'/'B' đơn lẻ; VD Phân khu A là zone_code = 'ZONE_A', khu cách ly là zone_code = 'ZONE_QUA').
            2. NẾU câu hỏi là giao tiếp thông thường (chào hỏi, hỏi ngày/thứ/giờ, thời tiết, tính toán nhanh, kiến thức kho vận tổng quát như FEFO/FIFO là gì, hoặc chuyện đời thường không cần đọc bảng MySQL):
               - Đặt "inScope": false, "sql": "", "directReply": "".
            """;
    private static final String ANSWER_SYSTEM = """
            Bạn là Kora AI — trợ lý kho vận thông minh của SMART WMS. Trả lời tiếng Việt ngắn gọn, chuyên nghiệp, chính xác 100% chỉ theo dữ liệu `rows`. Không bịa số liệu.
            NGUYÊN TẮC TRÌNH BÀY:
            1. Tuyệt đối KHÔNG viết kiểu số rời rạc từng lô như "0 - 33 - 2 (tùy lô)" hay "40, 45, 0, 50, 1".
            2. Nếu `rows` có nhiều hơn 5 dòng (VD tổng hợp tồn kho chi nhánh): KHÔNG copy-paste lại toàn bộ bảng thành danh sách dài. Thay vào đó:
               - Tóm tắt nhanh trong 1-2 câu về phạm vi kho và tổng số mặt hàng/bản ghi trả về.
               - Nêu 3-5 điểm nổi bật & cảnh báo cần lưu ý (Top mặt hàng tồn khả dụng cao nhất; mặt hàng có hàng đang giữ chỗ `reserved` hoặc khóa/hết hạn `blocked`; mặt hàng tồn thấp <= 10 hoặc hết hàng = 0).
               - Kết thúc bằng câu mời xem chi tiết đầy đủ từng dòng trong bảng dữ liệu ngay bên dưới.
            3. Nếu `rows` có từ 1 đến 5 dòng: liệt kê súc tích từng dòng kèm đầy đủ tên, SKU, số lượng và đơn vị tính.
            """;
    private static final String CONVERSATIONAL_SYSTEM = """
            Bạn là Kora AI — trợ lý kho vận thông minh của hệ thống quản lý kho doanh nghiệp SMART WMS.
            Phong cách: Lịch sự, thân thiện, tự nhiên và chuyên nghiệp như một trợ lý quản trị kho hiện đại (xưng 'Kora' hoặc 'tôi', gọi 'Quản lý' hoặc 'bạn').
            NGUYÊN TẮC BẮT BUỘC:
            1. Sử dụng chính xác [Thời gian thực tế] được hệ thống cung cấp bên dưới để trả lời các câu hỏi về thứ, ngày, tháng, năm, giờ hoặc đếm ngược ngày — tuyệt đối KHÔNG tự đoán ngày sai.
            2. Với câu hỏi giao tiếp, kiến thức chung hoặc nghiệp vụ kho vận tổng quát (VD: FEFO/FIFO, Safety Stock, Putaway...), hãy trả lời đầy đủ, dễ hiểu và súc tích.
            3. Tuyệt đối KHÔNG tự bịa bất kỳ con số tồn kho, mã đơn SO/PO hay mã lô BATCH thực tế nào của doanh nghiệp.
            4. Cuối câu trả lời, có thể gợi ý nhẹ 1 câu ngắn dẫn về công việc kho tại chi nhánh đang chọn (VD: kiểm tra đơn SO chờ xử lý, hàng cận hạn hôm nay) để tạo trải nghiệm liền mạch.
            5. Không dùng LaTeX ($...$), chỉ dùng văn bản thuần hoặc Markdown nhẹ.
            """;

    private final GeminiClient geminiClient;
    private final AiSqlGuard sqlGuard;
    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;
    private final GeminiDiagnosticService geminiDiagnosticService;
    private final WmsWarehouseAccessGuard accessGuard;
    private final WarehouseRepository warehouseRepository;

    public AiChatResponse chat(AiChatRequest request) {
        long started = System.currentTimeMillis();
        String effectiveWhHint = resolveEffectiveWarehouseHint(request.warehouseCode(), request.question());

        // 1. Các câu hỏi chẩn đoán sự cố / nguyên nhân / đơn SO / SKU thiếu tồn -> Gemini Function Calling
        if (isDiagnosticIntent(request.question())) {
            String historyContext = buildHistoryContext(request.history());
            AiDiagnosisResponse diag = geminiDiagnosticService.diagnose(
                    new AiDiagnoseRequest(request.question(), effectiveWhHint, null, null, null, historyContext)
            );
            String toolSummary = diag.toolLogs().isEmpty()
                    ? "-- Gemini Function Calling"
                    : "-- Gemini Function Calling: "
                            + diag.toolLogs().stream().map(t -> t.toolName() + t.argsSummary()).collect(Collectors.joining(" -> "));
            return new AiChatResponse(
                    diag.answer(),
                    toolSummary,
                    "VERIFIED",
                    System.currentTimeMillis() - started,
                    List.of(),
                    diag
            );
        }

        // 2. Các câu hỏi tra cứu bảng dữ liệu -> Kiểm tra quyền kho JWT + Gemini Text-to-SQL + SQL AST Guard
        Warehouse allowedWh = accessGuard.resolveAndRequireAccess(effectiveWhHint);

        // Chặn tức thì mọi yêu cầu có dấu hiệu SQL Injection / đọc bảng nhạy cảm hoặc số liệu tài chính ngoài phạm vi kho
        if (isSecuritySensitiveOrOutOfScopeQuery(request.question())) {
            return new AiChatResponse(
                    buildPolicyRejectionMessage(request.question()),
                    "-- Blocked by AiSqlGuard Security & Scope Policy",
                    "REJECTED",
                    System.currentTimeMillis() - started,
                    List.of(),
                    null
            );
        }

        if (!geminiClient.isAvailable()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST,
                    "Trợ lý Gemini AI chưa được kích hoạt hoặc thiếu GEMINI_API_KEY.");
        }

        try {
            String scopedQuestion = request.question() + " (Nếu inScope=true, chỉ truy vấn dữ liệu trong phạm vi kho warehouse_code='" + allowedWh.getCode() + "')";
            String planJson = geminiClient.generate(SQL_SYSTEM, scopedQuestion, true);
            SqlPlan plan = objectMapper.readValue(stripCodeFence(planJson), SqlPlan.class);

            if (Boolean.FALSE.equals(plan.inScope()) || plan.sql() == null || plan.sql().isBlank()) {
                String convContext = buildConversationalSystemPrompt(allowedWh);
                String historyContext = buildHistoryContext(request.history());
                String userPrompt = historyContext != null
                        ? "[Ngữ cảnh hội thoại gần đây]\n" + historyContext + "\n[Câu hỏi hiện tại]\n" + request.question()
                        : request.question();
                String conversationalReply = geminiClient.generate(convContext, userPrompt, false);
                return new AiChatResponse(conversationalReply, null, "VERIFIED", System.currentTimeMillis() - started, List.of(), null);
            }

            String safeSql = sqlGuard.guard(plan.sql());
            List<Map<String, Object>> rows = jdbcTemplate.query(safeSql, new ColumnMapRowMapper());
            String answer = rows.isEmpty()
                    ? "Không tìm thấy dữ liệu phù hợp trong phạm vi kho " + allowedWh.getCode() + "."
                    : geminiClient.generate(ANSWER_SYSTEM,
                    "Câu hỏi: " + request.question() + "\nSQL: " + safeSql + "\nDữ liệu JSON: " + objectMapper.writeValueAsString(rows), false);
            return new AiChatResponse(answer, safeSql, "VERIFIED", System.currentTimeMillis() - started, rows, null);
        } catch (BusinessException ex) {
            if (ex.getErrorCode() == ErrorCode.FORBIDDEN) {
                return new AiChatResponse(
                        ex.getMessage(),
                        "-- Blocked by AiSqlGuard AST Policy",
                        "REJECTED",
                        System.currentTimeMillis() - started,
                        List.of(),
                        null
                );
            }
            throw ex;
        } catch (Exception ex) {
            throw new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR,
                    "Gemini AI không thể xử lý truy vấn SQL này lúc này: " + ex.getMessage());
        }
    }

    private String buildHistoryContext(List<AiChatRequest.HistoryTurn> history) {
        if (history == null || history.isEmpty()) return null;
        int start = Math.max(0, history.size() - 4);
        StringBuilder sb = new StringBuilder();
        for (int i = start; i < history.size(); i++) {
            AiChatRequest.HistoryTurn turn = history.get(i);
            if (turn == null || turn.text() == null || turn.text().isBlank()) continue;
            String role = "user".equalsIgnoreCase(turn.sender()) ? "Người dùng" : "Kora AI";
            String text = turn.text().trim().replaceAll("\\s+", " ");
            if (text.length() > 300) text = text.substring(0, 300) + "...";
            sb.append(role).append(": ").append(text).append("\n");
        }
        String res = sb.toString().trim();
        return res.isEmpty() ? null : res;
    }

    private String resolveEffectiveWarehouseHint(String requestWh, String question) {
        if (question != null && !question.isBlank()) {
            String normQ = normalizeText(question);
            List<Warehouse> allWarehouses = warehouseRepository.findAll();
            for (Warehouse w : allWarehouses) {
                if (w.getCode() != null) {
                    String codeLower = w.getCode().toLowerCase(Locale.ROOT);
                    if (java.util.regex.Pattern.compile("\\b" + java.util.regex.Pattern.quote(codeLower) + "\\b")
                            .matcher(normQ).find()) {
                        return w.getCode();
                    }
                }
                if (w.getName() != null) {
                    for (String part : normalizeText(w.getName()).split("[-–/]+")) {
                        List<String> significant = java.util.Arrays.stream(part.trim().split("\\s+"))
                                .map(s -> s.replaceAll("[^a-z0-9]", ""))
                                .filter(s -> s.length() >= 3 && !WH_GENERIC_TOKENS.contains(s))
                                .toList();
                        if (significant.isEmpty()) continue;
                        String phrase = String.join(" ", significant);
                        if (phrase.length() >= 5 && normQ.contains(phrase)) {
                            return w.getCode();
                        }
                        if (significant.contains("hcm") && (normQ.contains("hcm") || normQ.contains("ho chi minh") || normQ.contains("sai gon"))) {
                            return w.getCode();
                        }
                    }
                }
            }
        }
        return requestWh;
    }

    private String buildPolicyRejectionMessage(String question) {
        String norm = normalizeText(question);
        boolean isSqlAttack = norm.contains("drop ") || norm.contains("delete ") || norm.contains("truncate ")
                || norm.contains("update ") || norm.contains("insert ") || norm.contains("alter ")
                || norm.contains("information_schema") || norm.contains("union select");
        if (isSqlAttack) {
            return "Yêu cầu bị từ chối: Kora AI chỉ hoạt động ở chế độ **chỉ đọc (Read-Only)** trên dữ liệu tồn kho, không cho phép chạy lệnh chỉnh sửa dữ liệu hoặc truy xuất cấu trúc hệ thống.";
        }
        if (norm.contains("mat khau") || norm.contains("password") || norm.contains("bang users")
                || norm.contains("tai khoan") || norm.contains("nguoi dung")) {
            return "Kora AI chỉ phụ trách dữ liệu vận hành kho (tồn kho, lô cận hạn, đơn xuất/nhập), không được cấp quyền đọc thông tin tài khoản hay mật khẩu để đảm bảo an toàn bảo mật.\n\nBạn có thể xem trực tiếp danh sách tài khoản và phân quyền tại mục **Tài Khoản & Phân Quyền (`/users`)**.";
        }
        return "Thông tin tài chính (doanh thu, lợi nhuận, bảng lương) hoặc hồ sơ nhà cung cấp nằm ngoài phạm vi dữ liệu kho của Kora AI. Bạn vui lòng kiểm tra tại mục **Báo Cáo & Thống Kê (`/reports`)** hoặc **Hàng Hóa & Danh Mục (`/products`)**.";
    }

    private boolean isSecuritySensitiveOrOutOfScopeQuery(String question) {
        if (question == null) return false;
        String norm = normalizeText(question);
        return norm.contains("drop ") || norm.contains("delete ") || norm.contains("truncate ")
                || norm.contains("update ") || norm.contains("insert ") || norm.contains("alter ")
                || norm.contains("information_schema") || norm.contains("union select")
                || norm.contains("mat khau") || norm.contains("password") || norm.contains("bang users")
                || norm.contains("nha cung cap") || norm.contains("tai khoan") || norm.contains("nguoi dung")
                || norm.contains("doanh thu") || norm.contains("loi nhuan")
                || norm.contains("tien luong") || norm.contains("bang luong");
    }

    private String buildConversationalSystemPrompt(Warehouse allowedWh) {
        ZonedDateTime now = ZonedDateTime.now(VN_ZONE);
        String weekday = toVietnameseDayOfWeek(now.getDayOfWeek());
        return CONVERSATIONAL_SYSTEM
                + "\n[Thời gian thực tế]: " + weekday + ", ngày " + now.format(VN_DATE_FMT) + " (giờ Việt Nam)"
                + "\n[Kho đang làm việc]: " + allowedWh.getName() + " (" + allowedWh.getCode() + ")";
    }

    private String toVietnameseDayOfWeek(DayOfWeek dow) {
        return switch (dow) {
            case MONDAY -> "Thứ Hai";
            case TUESDAY -> "Thứ Ba";
            case WEDNESDAY -> "Thứ Tư";
            case THURSDAY -> "Thứ Năm";
            case FRIDAY -> "Thứ Sáu";
            case SATURDAY -> "Thứ Bảy";
            case SUNDAY -> "Chủ Nhật";
        };
    }

    private boolean isDiagnosticIntent(String question) {
        if (question == null || question.isBlank()) return true;
        String norm = normalizeText(question);
        boolean hasCodeOrEntity = norm.contains("so-") || norm.contains("rtv-")
                || norm.contains("po-") || norm.contains("sku-") || norm.contains("wh0");
        boolean isConceptualQuestion = (norm.contains(" la gi") || norm.contains("nghia la gi")
                || norm.contains("khac gi") || norm.contains("so sanh ") || norm.contains("nguyen tac ")
                || norm.contains("tai sao can") || norm.contains("tai sao phai") || norm.contains("tai sao nen")
                || norm.contains("vi sao can") || norm.contains("vi sao phai")
                || norm.contains("loi ich ") || norm.contains("vai tro ") || norm.contains("muc dich "))
                && !hasCodeOrEntity;
        if (isConceptualQuestion) {
            return false;
        }
        boolean isTabularQuery = norm.contains("liet ke") || norm.contains("top ")
                || norm.contains("danh sach") || norm.contains("ty le lap day")
                || norm.contains("xem cac lo") || norm.contains("tim cac mat hang");
        boolean hasWmsSubject = hasCodeOrEntity || norm.contains("don ") || norm.contains("ton kho")
                || norm.contains("vat ly") || norm.contains("kha dung") || norm.contains("xuat kho")
                || norm.contains("nhap kho") || norm.contains("o ke") || norm.contains("lo hang")
                || norm.contains("het han") || norm.contains("can han") || norm.contains("phan bo")
                || norm.contains("san pham") || norm.contains("mat hang") || norm.contains("diem nghen");
        boolean hasWhyWithWmsSubject = (norm.contains("tai sao") || norm.contains("vi sao") || norm.contains("nguyen nhan"))
                && hasWmsSubject;
        boolean hasExplicitException = norm.contains("so-") || norm.contains("rtv-") || norm.contains("sku-")
                || hasWhyWithWmsSubject
                || norm.contains("thieu ton") || norm.contains("khong xuat") || norm.contains("khong du")
                || norm.contains("rui ro") || norm.contains("ngoai le") || norm.contains("qua tai")
                || norm.contains("su co") || norm.contains("putaway") || norm.contains("cho cat")
                || norm.contains("chan doan") || norm.contains("giu cho") || norm.contains("qc hold")
                || norm.contains("cach ly") || norm.contains("tong hop su co") || norm.contains("po dang ve");
        if (isTabularQuery && !hasExplicitException) {
            return false;
        }
        return hasExplicitException || norm.contains("on-hand") || norm.contains("reserved");
    }

    private String normalizeText(String input) {
        if (input == null) return "";
        String nfd = Normalizer.normalize(input, Normalizer.Form.NFD);
        return nfd.replaceAll("\\p{M}+", "")
                .replace('đ', 'd')
                .replace('Đ', 'D')
                .toLowerCase(Locale.ROOT)
                .trim();
    }

    private String stripCodeFence(String value) {
        return value.replace("```json", "").replace("```", "").trim();
    }
}
