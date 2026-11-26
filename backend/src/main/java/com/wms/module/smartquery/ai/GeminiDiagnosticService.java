package com.wms.module.smartquery.ai;

import com.wms.common.exception.BusinessException;
import com.wms.common.exception.ErrorCode;
import com.wms.module.masterdata.entity.Product;
import com.wms.module.masterdata.entity.Warehouse;
import com.wms.module.masterdata.repository.ProductRepository;
import com.wms.module.masterdata.repository.WarehouseRepository;
import com.wms.module.smartquery.ai.WmsDiagnosticTools.ToolBundleResult;
import com.wms.module.smartquery.ai.dto.AiDiagnoseRequest;
import com.wms.module.smartquery.ai.dto.AiDiagnosisResponse;
import com.wms.module.smartquery.ai.dto.AiDiagnosisResponse.ActionLink;
import com.wms.module.smartquery.ai.dto.AiDiagnosisResponse.DiagnosisBreakdown;
import com.wms.module.smartquery.ai.dto.AiDiagnosisResponse.DiagnosisEvidence;
import com.wms.module.smartquery.ai.dto.AiDiagnosisResponse.ToolCallLog;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Bộ điều phối trung tâm của Trợ Lý Gemini AI SMART WMS (Pure Gemini Function Calling).
 * Mọi câu trả lời đều bắt buộc gọi các Read-Only Java Tools và đi qua WmsWarehouseAccessGuard theo JWT.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GeminiDiagnosticService {

    private static final Pattern SO_PATTERN = Pattern.compile("\\b((?:SO|RTV)-[A-Z0-9-]+)\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern SKU_PATTERN = Pattern.compile("\\b(SKU-[A-Z0-9-]+)\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern WH_CODE_PATTERN = Pattern.compile("\\b(WH0\\d)\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern QTY_PATTERN = Pattern.compile("\\b(\\d{1,6})\\s*(?:thung|hop|chai|lon|cai|tuyp|tui|don vi)?\\b", Pattern.CASE_INSENSITIVE);

    private static final Set<String> SKU_STOPWORDS = Set.of(
            "sua", "nuoc", "tuoi", "chai", "thung", "loai", "hang", "dong", "chiec",
            "khong", "duoc", "kiem", "phai", "nhieu", "trong", "ngoai", "chua", "thieu",
            "xuat", "nhap", "chinh", "cong", "dung", "luong", "cung", "dieu", "khach",
            "thoi", "gian", "phan", "ngay", "thang", "tinh", "trang", "tiet", "trung"
    );

    private static final String GEMINI_SYSTEM_PROMPT = """
            Bạn là Kora AI — Trợ lý Kho Vận Thông Minh của SMART WMS.
            NGUYÊN TẮC BẮT BUỘC:
            1. Luôn gọi các công cụ Read-Only được cung cấp để đọc dữ liệu thật từ MySQL trước khi trả lời. Tuyệt đối KHÔNG tự bịa số liệu, mã lô hay mã đơn (không tự nghĩ ra mã như SO-2024-001 hay SO-2026-001 nếu câu hỏi không nêu).
            2. Nếu Tool trả lỗi NOT_FOUND (VD mã đơn hoặc SKU không tồn tại), phải thông báo THẲNG THẮN là không tìm thấy mã đó trong hệ thống; tuyệt đối KHÔNG tự suy diễn số liệu giả hay đánh tráo sang đơn khác.
            3. Nếu Tool trả về đơn hàng có nhiều dòng (`orderLineItems`), phải liệt kê ĐẦY ĐỦ từng dòng sản phẩm (SKU, số lượng yêu cầu/phân bổ của từng dòng) thay vì chỉ nêu dòng đầu tiên.
            4. Nếu Tool báo lỗi quyền truy cập kho (FORBIDDEN), phải giải thích rõ ràng người dùng không được cấp quyền ở kho đó.
            5. Khi giải thích thiếu tồn kho hoặc đơn SO chưa xuất được, phải tách rạch ròi 4 thành phần:
               Tồn vật lý (On-hand) = Đang giữ cho đơn khác (Reserved) + Hết hạn/Cách ly/Kệ khóa (Blocked) + Khả dụng (Available).
            6. Trả lời bằng tiếng Việt súc tích, chuyên nghiệp, nêu đích danh mã chứng từ thật từ Tool (SO-*, BATCH-*, PO-*, Bin-*). KHÔNG dùng cú pháp LaTeX như $\\rightarrow$; dùng dấu mũi tên Unicode `→`.
            """;

    private final GeminiClient geminiClient;
    private final WmsDiagnosticTools diagnosticTools;
    private final WmsWarehouseAccessGuard accessGuard;
    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;

    public AiDiagnosisResponse diagnose(AiDiagnoseRequest request) {
        long started = System.currentTimeMillis();
        if (!geminiClient.isAvailable()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST,
                    "Trợ lý Gemini AI chưa được kích hoạt hoặc thiếu GEMINI_API_KEY trong cấu hình backend.");
        }

        List<ToolCallLog> toolLogs = new ArrayList<>();
        List<ToolBundleResult> calledBundles = new ArrayList<>();

        String resolvedWhHint = extractWarehouseHint(request);
        // Ép kiểm tra quyền kho JWT ngay đầu luồng trước khi gọi Gemini API
        Warehouse authorizedWh = accessGuard.resolveAndRequireAccess(resolvedWhHint);

        String resolvedOrderCode = firstNonBlank(request.orderCode(), extractRegex(SO_PATTERN, request.question()));
        String resolvedSku = firstNonBlank(request.sku(), detectSkuFromQuestion(request.question()));
        Integer resolvedQty = request.requestedQty() != null
                ? request.requestedQty()
                : extractRequestedQty(request.question(), resolvedOrderCode, resolvedSku);

        String effectivePrompt = buildEffectivePrompt(request, resolvedWhHint, resolvedOrderCode, resolvedSku, resolvedQty);

        try {
            String llmAnswer = geminiClient.runFunctionCallingLoop(
                    GEMINI_SYSTEM_PROMPT,
                    effectivePrompt,
                    buildFunctionDeclarations(),
                    (toolName, args) -> executeAndRecordTool(toolName, args, resolvedWhHint, resolvedQty, toolLogs, calledBundles)
            );

            if (toolLogs.isEmpty()) {
                throw new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR,
                        "Gemini AI chưa truy xuất được dữ liệu thật từ hệ thống để kết luận. Vui lòng thử diễn đạt cụ thể hơn mã kho hoặc mã SKU/SO.");
            }

            if (calledBundles.isEmpty()) {
                return new AiDiagnosisResponse(
                        llmAnswer,
                        "GEMINI_FUNCTION_CALLING",
                        authorizedWh.getCode(),
                        authorizedWh.getName(),
                        null,
                        List.of(),
                        List.of("Kiểm tra lại chính xác mã đơn SO/RTV hoặc mã SKU trong danh mục kho " + authorizedWh.getCode() + "."),
                        toolLogs,
                        List.of(
                                new ActionLink("Mở Đơn Xuất Kho (/outbound)", "/outbound", "primary"),
                                new ActionLink("Mở Tồn Kho Chi Tiết (/inventory)", "/inventory", "secondary")
                        ),
                        System.currentTimeMillis() - started
                );
            }

            ToolBundleResult merged = mergeToolBundles(calledBundles, resolvedWhHint);
            return new AiDiagnosisResponse(
                    llmAnswer,
                    "GEMINI_FUNCTION_CALLING",
                    merged.warehouse().getCode(),
                    merged.warehouse().getName(),
                    merged.breakdown(),
                    merged.evidences(),
                    merged.recommendations(),
                    toolLogs,
                    merged.actions(),
                    System.currentTimeMillis() - started
            );
        } catch (BusinessException be) {
            throw be;
        } catch (Exception ex) {
            log.warn("Lỗi kết nối Gemini Function Calling: {}", ex.getMessage());
            throw new BusinessException(ErrorCode.INTERNAL_SERVER_ERROR,
                    "Hệ thống Gemini AI hiện đang tạm quá tải hoặc mất kết nối. Vui lòng thử lại sau giây lát.");
        }
    }

    private ToolBundleResult mergeToolBundles(List<ToolBundleResult> bundles, String fallbackWhHint) {
        Warehouse primaryWh = bundles.get(0).warehouse() != null
                ? bundles.get(0).warehouse()
                : accessGuard.resolveAndRequireAccess(fallbackWhHint);

        DiagnosisBreakdown primaryBreakdown = null;
        for (ToolBundleResult b : bundles) {
            if (b.breakdown() != null) {
                if (b.breakdown().orderCode() != null) {
                    primaryBreakdown = b.breakdown();
                    break;
                }
                if (primaryBreakdown == null) {
                    primaryBreakdown = b.breakdown();
                }
            }
        }

        Map<String, DiagnosisEvidence> evMap = new LinkedHashMap<>();
        LinkedHashSet<String> recs = new LinkedHashSet<>();
        Map<String, ActionLink> actionMap = new LinkedHashMap<>();
        Map<String, Object> mergedRaw = new LinkedHashMap<>();

        for (ToolBundleResult b : bundles) {
            if (b.evidences() != null) {
                for (DiagnosisEvidence ev : b.evidences()) {
                    evMap.putIfAbsent(ev.type() + "|" + ev.code() + "|" + ev.detail(), ev);
                }
            }
            if (b.recommendations() != null) {
                recs.addAll(b.recommendations());
            }
            if (b.actions() != null) {
                for (ActionLink a : b.actions()) {
                    actionMap.putIfAbsent(a.targetUrl(), a);
                }
            }
            if (b.rawPayload() != null) {
                mergedRaw.putAll(b.rawPayload());
            }
        }

        return new ToolBundleResult(
                primaryWh,
                primaryBreakdown,
                new ArrayList<>(evMap.values()),
                new ArrayList<>(recs),
                new ArrayList<>(actionMap.values()),
                mergedRaw
        );
    }

    private Map<String, Object> executeAndRecordTool(
            String toolName,
            Map<String, Object> args,
            String fallbackWhHint,
            Integer fallbackQty,
            List<ToolCallLog> toolLogs,
            List<ToolBundleResult> calledBundles
    ) {
        long t0 = System.currentTimeMillis();
        String argsSummary = String.valueOf(args);
        try {
            ToolBundleResult res;
            switch (toolName) {
                case "getOutboundOrderDiagnosis" -> {
                    String oc = String.valueOf(args.getOrDefault("orderCode", ""));
                    res = diagnosticTools.getOutboundOrderDiagnosis(oc);
                }
                case "getSkuStockBreakdown" -> {
                    String wh = args.get("warehouseCode") != null ? String.valueOf(args.get("warehouseCode")) : fallbackWhHint;
                    String sku = String.valueOf(args.getOrDefault("sku", ""));
                    Integer reqQty = args.get("requestedQty") instanceof Number n ? n.intValue() : fallbackQty;
                    res = diagnosticTools.getSkuStockBreakdown(wh, sku, reqQty);
                }
                case "getIncomingPipeline" -> {
                    String wh = args.get("warehouseCode") != null ? String.valueOf(args.get("warehouseCode")) : fallbackWhHint;
                    String sku = String.valueOf(args.getOrDefault("sku", ""));
                    res = diagnosticTools.getIncomingPipeline(wh, sku);
                }
                case "getWarehouseExceptions" -> {
                    String wh = args.get("warehouseCode") != null ? String.valueOf(args.get("warehouseCode")) : fallbackWhHint;
                    res = diagnosticTools.getWarehouseExceptions(wh);
                }
                default -> throw new IllegalArgumentException("Tool không được hỗ trợ: " + toolName);
            }
            calledBundles.add(res);
            toolLogs.add(new ToolCallLog(toolName, argsSummary, "SUCCESS", System.currentTimeMillis() - t0));
            return res.rawPayload();
        } catch (BusinessException be) {
            if (be.getErrorCode() == ErrorCode.FORBIDDEN) {
                toolLogs.add(new ToolCallLog(toolName, argsSummary, "BLOCKED: " + be.getMessage(), System.currentTimeMillis() - t0));
                throw be;
            }
            toolLogs.add(new ToolCallLog(toolName, argsSummary, "NOT_FOUND: " + be.getMessage(), System.currentTimeMillis() - t0));
            return Map.of(
                    "error", be.getMessage(),
                    "recoverableHint", "Không tìm thấy chứng từ/sản phẩm tương ứng. Không tự bịa mã giả; nếu đang hỏi tổng quan kho hãy gọi getWarehouseExceptions(warehouseCode)."
            );
        }
    }

    private List<Map<String, Object>> buildFunctionDeclarations() {
        return List.of(
                Map.of(
                        "name", "getOutboundOrderDiagnosis",
                        "description", "Chỉ gọi khi câu hỏi nêu đích danh mã đơn xuất kho SO/RTV cụ thể để chẩn đoán phân bổ FEFO.",
                        "parameters", Map.of(
                                "type", "OBJECT",
                                "properties", Map.of(
                                        "orderCode", Map.of("type", "STRING", "description", "Mã đơn xuất kho thật trích nguyên văn từ câu hỏi của người dùng")
                                ),
                                "required", List.of("orderCode")
                        )
                ),
                Map.of(
                        "name", "getSkuStockBreakdown",
                        "description", "Bóc tách tồn kho On-hand, Reserved (kèm mã SO đang giữ), Expired/Quarantine/LockedBin và Available của 1 SKU tại kho cụ thể.",
                        "parameters", Map.of(
                                "type", "OBJECT",
                                "properties", Map.of(
                                        "warehouseCode", Map.of("type", "STRING", "description", "Mã kho (VD: WH01, WH02, WH04)"),
                                        "sku", Map.of("type", "STRING", "description", "Mã SKU hoặc tên sản phẩm"),
                                        "requestedQty", Map.of("type", "INTEGER", "description", "Số lượng dự kiến cần xuất (nếu có)")
                                ),
                                "required", List.of("sku")
                        )
                ),
                Map.of(
                        "name", "getIncomingPipeline",
                        "description", "Kiểm tra đơn nhập kho PO đang chờ hàng về hoặc đang nằm tại cửa Staging chờ Putaway cho SKU.",
                        "parameters", Map.of(
                                "type", "OBJECT",
                                "properties", Map.of(
                                        "warehouseCode", Map.of("type", "STRING", "description", "Mã kho (VD: WH01, WH02, WH04)"),
                                        "sku", Map.of("type", "STRING", "description", "Mã SKU hoặc tên sản phẩm")
                                ),
                                "required", List.of("sku")
                        )
                ),
                Map.of(
                        "name", "getWarehouseExceptions",
                        "description", "Quét nhanh các rủi ro/ngoại lệ vận hành tại kho: ô kệ quá tải, kệ khóa bảo trì, lô hết hạn/cận hạn và đơn SO PENDING.",
                        "parameters", Map.of(
                                "type", "OBJECT",
                                "properties", Map.of(
                                        "warehouseCode", Map.of("type", "STRING", "description", "Mã kho cần kiểm tra (nếu bỏ trống sẽ dùng kho mặc định của user)")
                                )
                        )
                )
        );
    }

    private String extractWarehouseHint(AiDiagnoseRequest req) {
        if (req.warehouseCode() != null && !req.warehouseCode().isBlank() && !"ALL".equalsIgnoreCase(req.warehouseCode())) {
            return req.warehouseCode().trim();
        }
        String byRegex = extractRegex(WH_CODE_PATTERN, req.question());
        if (byRegex != null) return byRegex.toUpperCase(Locale.ROOT);

        if (req.question() != null && !req.question().isBlank()) {
            String normQ = normalize(req.question());
            for (Warehouse w : warehouseRepository.findAll()) {
                if (w.getCode() != null && normQ.contains(w.getCode().toLowerCase(Locale.ROOT))) {
                    return w.getCode();
                }
                if (normQ.contains("bac ninh") || normQ.contains("vsip")) {
                    if ("WH02".equalsIgnoreCase(w.getCode())) return "WH02";
                }
                if (normQ.contains("da nang") || normQ.contains("mien trung")) {
                    if ("WH03".equalsIgnoreCase(w.getCode())) return "WH03";
                }
                if (normQ.contains("song than") || normQ.contains("binh duong")) {
                    if ("WH04".equalsIgnoreCase(w.getCode())) return "WH04";
                }
                if (normQ.contains("tan binh")) {
                    if ("WH01".equalsIgnoreCase(w.getCode())) return "WH01";
                }
                if (normQ.contains("quy nhon")) {
                    if ("WH05".equalsIgnoreCase(w.getCode())) return "WH05";
                }
                if (normQ.contains("can tho")) {
                    if ("WH06".equalsIgnoreCase(w.getCode())) return "WH06";
                }
                if (normQ.contains("da lat")) {
                    if ("WH07".equalsIgnoreCase(w.getCode())) return "WH07";
                }
            }
        }
        return req.warehouseCode();
    }

    private String detectSkuFromQuestion(String question) {
        if (question == null || question.isBlank()) return null;
        String byRegex = extractRegex(SKU_PATTERN, question);
        if (byRegex != null) return byRegex.toUpperCase(Locale.ROOT);

        String normQ = normalize(question);
        List<Product> activeProducts = productRepository.findAllByDeletedAtIsNullOrderByCreatedAtDesc();
        for (Product p : activeProducts) {
            if (p.getSku() != null && !p.getSku().isBlank() && normQ.contains(normalize(p.getSku()))) {
                return p.getSku();
            }
            if (p.getName() != null && !p.getName().isBlank() && normQ.contains(normalize(p.getName()))) {
                return p.getSku();
            }
        }
        String bestSku = null;
        int bestScore = 0;
        Set<String> qTokens = new HashSet<>(Arrays.asList(normQ.split("\\s+")));
        for (Product p : activeProducts) {
            if (p.getName() == null) continue;
            List<String> meaningfulTokens = Arrays.stream(normalize(p.getName()).split("\\s+"))
                    .filter(t -> t.length() >= 3 && !SKU_STOPWORDS.contains(t))
                    .distinct()
                    .toList();
            int matches = 0;
            boolean hasStrongBrandHit = false;
            for (String token : meaningfulTokens) {
                if (qTokens.contains(token)) {
                    matches++;
                    if (token.length() >= 6) hasStrongBrandHit = true;
                }
            }
            int score = matches * 10 + (hasStrongBrandHit ? 5 : 0);
            if ((matches >= 2 || hasStrongBrandHit) && score > bestScore) {
                bestScore = score;
                bestSku = p.getSku();
            }
        }
        return bestSku;
    }

    private Integer extractRequestedQty(String question, String orderCode, String sku) {
        if (question == null || question.isBlank()) return null;
        String cleaned = question;
        if (orderCode != null) cleaned = cleaned.replace(orderCode, " ");
        if (sku != null) cleaned = cleaned.replace(sku, " ");
        cleaned = cleaned.replaceAll("(?i)wh0\\d", " ");
        Matcher m = QTY_PATTERN.matcher(cleaned);
        if (m.find()) {
            try {
                int val = Integer.parseInt(m.group(1));
                if (val > 0 && val < 100000) return val;
            } catch (NumberFormatException ignored) {}
        }
        return null;
    }

    private String extractRegex(Pattern pattern, String input) {
        if (input == null || input.isBlank()) return null;
        Matcher m = pattern.matcher(input);
        return m.find() ? m.group(1) : null;
    }

    private String firstNonBlank(String a, String b) {
        return (a != null && !a.isBlank()) ? a.trim() : b;
    }

    private String buildEffectivePrompt(AiDiagnoseRequest req, String whHint, String orderCode, String sku, Integer reqQty) {
        StringBuilder sb = new StringBuilder();
        if (req.question() != null && !req.question().isBlank()) {
            sb.append(req.question().trim());
        } else {
            sb.append("Hãy phân tích nguyên nhân sự cố kho vận dựa trên ngữ cảnh sau.");
        }
        sb.append("\n[Ngữ cảnh hệ thống]");
        if (whHint != null && !whHint.isBlank()) sb.append(" warehouseCode=").append(whHint);
        if (orderCode != null && !orderCode.isBlank()) sb.append(" orderCode=").append(orderCode);
        if (sku != null && !sku.isBlank()) sb.append(" sku=").append(sku);
        if (reqQty != null && reqQty > 0) sb.append(" requestedQty=").append(reqQty);
        return sb.toString();
    }

    private String normalize(String text) {
        if (text == null) return "";
        String nfd = Normalizer.normalize(text, Normalizer.Form.NFD);
        return nfd.replaceAll("\\p{M}+", "")
                .replace('đ', 'd')
                .replace('Đ', 'D')
                .toLowerCase(Locale.ROOT)
                .trim();
    }
}

