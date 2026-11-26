package com.wms.module.smartquery.ai;

import com.wms.common.exception.BusinessException;
import com.wms.common.exception.ErrorCode;
import com.wms.module.inventory.entity.Inventory;
import com.wms.module.inventory.entity.ProductBatch;
import com.wms.module.inventory.entity.StockReservation;
import com.wms.module.inventory.repository.InventoryRepository;
import com.wms.module.inventory.repository.ProductBatchRepository;
import com.wms.module.inventory.repository.StockReservationRepository;
import com.wms.module.masterdata.entity.Location;
import com.wms.module.masterdata.entity.Product;
import com.wms.module.masterdata.entity.Warehouse;
import com.wms.module.masterdata.repository.LocationRepository;
import com.wms.module.masterdata.repository.ProductRepository;
import com.wms.module.order.entity.InboundOrder;
import com.wms.module.order.entity.InboundOrderItem;
import com.wms.module.order.entity.OutboundOrder;
import com.wms.module.order.entity.OutboundOrderItem;
import com.wms.module.order.entity.PickAllocation;
import com.wms.module.order.repository.InboundOrderRepository;
import com.wms.module.order.repository.OutboundOrderRepository;
import com.wms.module.order.repository.PickAllocationRepository;
import com.wms.module.smartquery.ai.dto.AiDiagnosisResponse.ActionLink;
import com.wms.module.smartquery.ai.dto.AiDiagnosisResponse.DiagnosisBreakdown;
import com.wms.module.smartquery.ai.dto.AiDiagnosisResponse.DiagnosisEvidence;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Bộ công cụ Read-Only chuyên biệt cho Trợ lý Gemini AI truy xuất dữ liệu thật từ Database SMART WMS.
 * Mọi Tool đều đi qua WmsWarehouseAccessGuard để bảo đảm cô lập đa kho theo JWT.
 */
@Component
@RequiredArgsConstructor
public class WmsDiagnosticTools {

    private final WmsWarehouseAccessGuard accessGuard;
    private final OutboundOrderRepository outboundOrderRepository;
    private final InboundOrderRepository inboundOrderRepository;
    private final InventoryRepository inventoryRepository;
    private final ProductBatchRepository productBatchRepository;
    private final LocationRepository locationRepository;
    private final ProductRepository productRepository;
    private final PickAllocationRepository pickAllocationRepository;
    private final StockReservationRepository stockReservationRepository;

    public record ToolBundleResult(
            Warehouse warehouse,
            DiagnosisBreakdown breakdown,
            List<DiagnosisEvidence> evidences,
            List<String> recommendations,
            List<ActionLink> actions,
            Map<String, Object> rawPayload
    ) {}

    /**
     * Tool 1: Chẩn đoán chi tiết đơn xuất kho SO (tình trạng phân bổ FEFO & nguyên nhân thiếu hàng nếu có).
     */
    @Transactional(readOnly = true)
    public ToolBundleResult getOutboundOrderDiagnosis(String orderCode) {
        if (orderCode == null || orderCode.isBlank()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Vui lòng cung cấp mã đơn xuất kho (VD: SO-2026-001).");
        }
        String cleanCode = orderCode.trim().toUpperCase(Locale.ROOT);
        OutboundOrder order = outboundOrderRepository.findByOrderCode(cleanCode)
                .orElseGet(() -> outboundOrderRepository.findAll().stream()
                        .filter(o -> o.getOrderCode() != null && o.getOrderCode().equalsIgnoreCase(cleanCode))
                        .findFirst()
                        .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND,
                                "Không tìm thấy đơn xuất kho mã '" + cleanCode + "' trong hệ thống.")));

        Warehouse wh = accessGuard.requireWarehouseAccessById(order.getWarehouseId() != null ? order.getWarehouseId() : 1L);

        List<OutboundOrderItem> items = order.getItems() != null ? order.getItems() : List.of();
        if (items.isEmpty()) {
            Map<String, Object> raw = new LinkedHashMap<>();
            raw.put("orderCode", order.getOrderCode());
            raw.put("status", order.getStatus());
            raw.put("warehouseCode", wh.getCode());
            raw.put("note", "Đơn xuất kho chưa có dòng sản phẩm nào.");
            return new ToolBundleResult(wh, null, List.of(), List.of("Kiểm tra lại danh sách mặt hàng trong đơn xuất."),
                    List.of(new ActionLink("Mở Đơn Xuất Kho", "/outbound", "primary")), raw);
        }

        // Phân tích dòng sản phẩm chính (ưu tiên dòng chưa phân bổ đủ, nếu không lấy dòng đầu tiên)
        OutboundOrderItem focusItem = items.stream()
                .filter(it -> (it.getAllocatedQty() != null ? it.getAllocatedQty() : 0) < (it.getRequestedQty() != null ? it.getRequestedQty() : 0))
                .findFirst()
                .orElse(items.get(0));

        Product prod = focusItem.getProduct();
        if (prod == null && focusItem.getProductId() != null) {
            prod = productRepository.findById(focusItem.getProductId()).orElse(null);
        }
        String sku = prod != null ? prod.getSku() : String.valueOf(focusItem.getProductId());
        Integer requested = focusItem.getRequestedQty() != null ? focusItem.getRequestedQty() : 0;

        ToolBundleResult skuDiag = getSkuStockBreakdown(wh.getCode(), sku, requested);

        List<DiagnosisEvidence> evidences = new ArrayList<>();
        int totalReq = items.stream().mapToInt(it -> it.getRequestedQty() != null ? it.getRequestedQty() : 0).sum();
        int totalAlloc = items.stream().mapToInt(it -> it.getAllocatedQty() != null ? it.getAllocatedQty() : 0).sum();
        int totalPicked = items.stream().mapToInt(it -> it.getPickedQty() != null ? it.getPickedQty() : 0).sum();

        evidences.add(new DiagnosisEvidence(
                "OUTBOUND_ORDER",
                order.getOrderCode(),
                totalReq,
                order.getStatus(),
                String.format("Khách hàng: %s • Tổng yêu cầu: %d • Đã phân bổ FEFO: %d • Đã nhặt: %d",
                        order.getCustomerName(), totalReq, totalAlloc, totalPicked),
                "/outbound"
        ));
        evidences.addAll(skuDiag.evidences());

        DiagnosisBreakdown b = skuDiag.breakdown();
        DiagnosisBreakdown withOrder = b == null ? null : new DiagnosisBreakdown(
                order.getOrderCode(),
                b.sku(), b.productName(), b.unit(),
                requested, b.onHandQty(), b.reservedQty(), b.unavailableQty(), b.availableQty(), b.shortageQty(), b.consistent()
        );

        List<String> recs = new ArrayList<>(skuDiag.recommendations());
        boolean isRtv = order.getOrderCode() != null && order.getOrderCode().toUpperCase(Locale.ROOT).startsWith("RTV-");
        if (isRtv) {
            recs.add(0, String.format("Đơn %s là phiếu Xuất Trả Nhà Cung Cấp (RTV) — ưu tiên kiểm tra lô cách ly/hết hạn tại Khu Biệt Trữ (ZONE_QUA) để xuất trả thay vì lấy hàng ACTIVE.", order.getOrderCode()));
        } else if ("PENDING".equalsIgnoreCase(order.getStatus()) && b != null && b.shortageQty() == 0) {
            recs.add(0, String.format("Đơn %s đang ở trạng thái PENDING và kho hiện có đủ %d %s khả dụng — có thể bấm 'Phân Bổ Lô' (FEFO) ngay.",
                    order.getOrderCode(), b.availableQty(), b.unit()));
        } else if ("PICKING".equalsIgnoreCase(order.getStatus())) {
            recs.add(0, String.format("Đơn %s đang ở trạng thái Đang Lấy Hàng (PICKING: %d/%d) — hàng đang bị giữ chỗ (Reserved) chờ thủ kho xác nhận hoàn tất xuất kho.",
                    order.getOrderCode(), totalPicked, totalReq));
        }

        List<Map<String, Object>> lineItems = new ArrayList<>();
        for (OutboundOrderItem it : items) {
            Product pItem = it.getProduct();
            if (pItem == null && it.getProductId() != null) {
                pItem = productRepository.findById(it.getProductId()).orElse(null);
            }
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("sku", pItem != null ? pItem.getSku() : ("SP#" + it.getProductId()));
            row.put("productName", pItem != null ? pItem.getName() : "Sản phẩm");
            row.put("unit", pItem != null && pItem.getUnit() != null ? pItem.getUnit() : "đơn vị");
            row.put("requestedQty", it.getRequestedQty() != null ? it.getRequestedQty() : 0);
            row.put("allocatedQty", it.getAllocatedQty() != null ? it.getAllocatedQty() : 0);
            row.put("pickedQty", it.getPickedQty() != null ? it.getPickedQty() : 0);
            if (pItem != null) {
                row.put("warehouseAvailableQty", computeAvailableInWarehouse(wh.getId(), pItem.getId(), LocalDate.now()));
            }
            lineItems.add(row);
        }

        Map<String, Object> raw = new LinkedHashMap<>(skuDiag.rawPayload());
        raw.put("orderCode", order.getOrderCode());
        raw.put("orderStatus", order.getStatus());
        raw.put("customerName", order.getCustomerName());
        raw.put("orderLineCount", items.size());
        raw.put("orderLineItems", lineItems);
        raw.put("orderTotalRequested", totalReq);
        raw.put("orderTotalAllocated", totalAlloc);
        raw.put("focusBreakdownSku", sku);

        return new ToolBundleResult(wh, withOrder, evidences, recs, skuDiag.actions(), raw);
    }

    /**
     * Tool 2: Bóc tách 4 thành phần tồn kho (On-hand = Reserved + Blocked/Expired + Available) khớp 100% WarehouseStockService.
     */
    @Transactional(readOnly = true)
    public ToolBundleResult getSkuStockBreakdown(String warehouseHint, String skuOrName, Integer requestedQty) {
        Warehouse wh = accessGuard.resolveAndRequireAccess(warehouseHint);
        Product product = resolveProduct(skuOrName);
        String unit = product.getUnit() != null ? product.getUnit() : "đơn vị";

        Map<Long, Location> locationMap = locationRepository.findByWarehouseId(wh.getId()).stream()
                .collect(Collectors.toMap(Location::getId, l -> l));
        Map<Long, ProductBatch> batchMap = productBatchRepository.findByProductId(product.getId()).stream()
                .collect(Collectors.toMap(ProductBatch::getId, b -> b));

        List<Inventory> invList = inventoryRepository.findByProductId(product.getId());
        LocalDate today = LocalDate.now();
        // Đồng bộ chính xác 100% quy tắc lô hợp lệ của WarehouseStockService (ACTIVE và chưa quá hạn)
        Set<Long> eligibleBatchIds = productBatchRepository
                .findActiveBatchesOrderByExpiryAsc(product.getId(), today).stream()
                .map(ProductBatch::getId)
                .collect(Collectors.toSet());

        int onHandQty = 0;
        int reservedQty = 0;
        int unavailableQty = 0;
        int availableQty = 0;
        int expiredQty = 0;
        int quarantineQty = 0;
        int lockedBinQty = 0;
        int stuckReservedOnBlockedQty = 0;

        List<DiagnosisEvidence> evidences = new ArrayList<>();

        for (Inventory inv : invList) {
            Location loc = locationMap.get(inv.getLocationId());
            if (loc == null) continue; // Không thuộc kho đang xét

            int oh = inv.getOnHandQty() != null ? inv.getOnHandQty() : 0;
            int res = inv.getReservedQty() != null ? inv.getReservedQty() : 0;
            if (oh <= 0 && res <= 0) continue;

            ProductBatch batch = inv.getBatchId() != null ? batchMap.get(inv.getBatchId()) : null;
            String batchCode = batch != null ? batch.getBatchNumber() : ("BATCH-#" + inv.getBatchId());
            LocalDate exp = batch != null ? batch.getExpiryDate() : null;
            String batchStatus = batch != null && batch.getStatus() != null ? batch.getStatus() : "UNKNOWN";
            boolean isExpired = exp != null && exp.isBefore(today);
            boolean isBatchActive = inv.getBatchId() != null && eligibleBatchIds.contains(inv.getBatchId());
            boolean isLocActive = Boolean.TRUE.equals(loc.getIsActive());

            onHandQty += oh;

            if (!isLocActive || !isBatchActive) {
                unavailableQty += oh;
                if (res > 0) {
                    stuckReservedOnBlockedQty += res;
                    List<String> stuckHolders = findReservationHolders(inv.getLocationId(), product.getId(), inv.getBatchId());
                    evidences.add(new DiagnosisEvidence(
                            "RESERVATION",
                            stuckHolders.isEmpty() ? loc.getBinBarcode() : stuckHolders.get(0),
                            res,
                            "Giữ Chỗ Kẹt Trên Hàng Khóa",
                            String.format("Cảnh báo Wave/Allocation: %d %s đang giữ chỗ tại %s (Lô %s) nhưng ô/lô hiện bị khóa hoặc hết hạn!%s",
                                    res, unit, loc.getBinBarcode(), batchCode,
                                    stuckHolders.isEmpty() ? "" : " Đơn liên quan: " + String.join(", ", stuckHolders)),
                            "/outbound"
                    ));
                }
                if (!isLocActive) {
                    lockedBinQty += oh;
                    evidences.add(new DiagnosisEvidence(
                            "LOCKED_BIN",
                            loc.getBinBarcode(),
                            oh,
                            "Ô Kệ Khóa Bảo Trì",
                            String.format("%d %s tại %s (Lô %s) không thể xuất do ô kệ đang bị Khóa Bảo Trì.",
                                    oh, unit, loc.getBinBarcode(), batchCode),
                            "/layout?warehouse=" + wh.getCode() + "&search=" + loc.getBinBarcode()
                    ));
                } else if (isExpired || "EXPIRED".equalsIgnoreCase(batchStatus)) {
                    expiredQty += oh;
                    evidences.add(new DiagnosisEvidence(
                            "EXPIRED",
                            batchCode,
                            oh,
                            "Hết Hạn FEFO",
                            String.format("%d %s thuộc lô %s tại %s đã hết hạn (HSD: %s) — FEFO tự động loại trừ.",
                                    oh, unit, batchCode, loc.getBinBarcode(), exp),
                            "/inventory"
                    ));
                } else {
                    quarantineQty += oh;
                    evidences.add(new DiagnosisEvidence(
                            "QUARANTINE",
                            batchCode,
                            oh,
                            "Cách Ly (" + batchStatus + ")",
                            String.format("%d %s thuộc lô %s tại %s đang ở trạng thái %s (%s).",
                                    oh, unit, batchCode, loc.getBinBarcode(), batchStatus, loc.getZoneCode()),
                            "/layout?warehouse=" + wh.getCode() + "&zone=" + loc.getZoneCode()
                    ));
                }
            } else {
                reservedQty += res;
                int binAvail = Math.max(0, oh - res);
                availableQty += binAvail;

                if (res > 0) {
                    // Truy tìm đích danh mã SO đang giữ hàng
                    List<String> holderRefs = findReservationHolders(inv.getLocationId(), product.getId(), inv.getBatchId());
                    String holderText = holderRefs.isEmpty()
                            ? "Các đơn xuất đang giữ chỗ trước (Stock Reservation)"
                            : "Đơn đang giữ chỗ: " + String.join(", ", holderRefs);
                    evidences.add(new DiagnosisEvidence(
                            "RESERVATION",
                            holderRefs.isEmpty() ? loc.getBinBarcode() : holderRefs.get(0),
                            res,
                            "Đang Giữ Cho Đơn",
                            String.format("%d %s tại %s (Lô %s) — %s.",
                                    res, unit, loc.getBinBarcode(), batchCode, holderText),
                            "/outbound"
                    ));
                }
                if (binAvail > 0) {
                    long daysLeft = exp != null ? ChronoUnit.DAYS.between(today, exp) : 9999;
                    String expiryText = exp != null ? ("HSD: " + exp + (daysLeft <= 30 ? " [Cận hạn " + daysLeft + " ngày]" : "")) : "Không giới hạn HSD";
                    evidences.add(new DiagnosisEvidence(
                            "AVAILABLE",
                            loc.getBinBarcode(),
                            binAvail,
                            "Khả Dụng FEFO",
                            String.format("%d %s khả dụng tại %s (Lô %s • %s).",
                                    binAvail, unit, loc.getBinBarcode(), batchCode, expiryText),
                            "/layout?warehouse=" + wh.getCode() + "&search=" + loc.getBinBarcode()
                    ));
                }
            }
        }

        // Kiểm tra nguồn hàng PO sắp nhập / chờ Putaway trong cùng kho
        ToolBundleResult incoming = getIncomingPipeline(wh.getCode(), product.getSku());
        evidences.addAll(incoming.evidences());

        int req = requestedQty != null && requestedQty > 0 ? requestedQty : 0;
        int shortage = req > 0 ? Math.max(0, req - availableQty) : 0;
        boolean consistent = (reservedQty + unavailableQty + availableQty) == onHandQty;

        DiagnosisBreakdown breakdown = new DiagnosisBreakdown(
                null,
                product.getSku(),
                product.getName(),
                unit,
                req > 0 ? req : null,
                onHandQty,
                reservedQty,
                unavailableQty,
                availableQty,
                req > 0 ? shortage : null,
                consistent
        );

        List<String> recs = new ArrayList<>();
        boolean isProductDiscontinued = !Boolean.TRUE.equals(product.getIsActive())
                || product.getDeletedAt() != null
                || "DISCONTINUED".equalsIgnoreCase(product.getBusinessStatus());
        if (isProductDiscontinued) {
            recs.add(String.format("Sản phẩm %s (%s) hiện đang ngừng kinh doanh / vô hiệu hóa (DISCONTINUED) — hệ thống Outbound sẽ chặn tạo đơn mới.",
                    product.getName(), product.getSku()));
        }
        if (stuckReservedOnBlockedQty > 0) {
            recs.add(String.format("Cảnh báo kẹt phân bổ: có %d %s đang được giữ chỗ trên lô hết hạn/cách ly hoặc kệ đã khóa — cần giải phóng phân bổ cũ để tái cấp phát lô hợp lệ.",
                    stuckReservedOnBlockedQty, unit));
        }
        if (shortage > 0) {
            if (!incoming.evidences().isEmpty()) {
                recs.add("Ưu tiên kiểm tra đơn nhập hàng (PO) đang ở cửa Staging/chờ cất kệ để hoàn tất Putaway bổ sung tồn khả dụng ngay.");
            }
            // Kiểm tra tồn khả dụng ở các chi nhánh kho khác mà user được quyền xem
            List<Warehouse> allowed = accessGuard.getAllowedWarehouses();
            for (Warehouse otherWh : allowed) {
                if (otherWh.getId().equals(wh.getId())) continue;
                int otherAvail = computeAvailableInWarehouse(otherWh.getId(), product.getId(), today);
                if (otherAvail > 0) {
                    recs.add(String.format("Điều phối nội bộ hoặc xuất tách đơn từ chi nhánh %s (%s) hiện đang còn %d %s khả dụng.",
                            otherWh.getName(), otherWh.getCode(), otherAvail, unit));
                }
            }
            if (availableQty > 0) {
                recs.add(String.format("Có thể giao trước một phần %d %s khả dụng hiện tại và tạo Backorder cho %d %s còn thiếu.",
                        availableQty, unit, shortage, unit));
            } else {
                recs.add("Lập đơn mua hàng (PO) bổ sung ngay vì tồn khả dụng tại kho đã về 0.");
            }
            if (lockedBinQty > 0) {
                recs.add(String.format("Kiểm tra mở khóa %d %s đang nằm tại ô kệ bị Khóa Bảo Trì nếu vị trí kệ đã an toàn.", lockedBinQty, unit));
            }
            if (expiredQty > 0 || quarantineQty > 0) {
                recs.add("Tuyệt đối không xuất các lô đã hết hạn hoặc đang trong Khu Cách Ly (ZONE_QUA) để đảm bảo tuân thủ FEFO.");
            }
        } else {
            recs.add("Tồn khả dụng hiện đang đủ đáp ứng nhu cầu; có thể tiến hành tạo đơn xuất hoặc cấp phát lô FEFO ngay.");
        }

        List<ActionLink> actions = new ArrayList<>();
        if (!incoming.evidences().isEmpty()) {
            actions.add(new ActionLink("Kiểm tra đơn nhập chờ cất kệ (/inbound)", "/inbound", "primary"));
        }
        actions.add(new ActionLink("Xem vị trí ô kệ kho " + wh.getCode() + " (/layout)", "/layout?warehouse=" + wh.getCode(), "info"));
        actions.add(new ActionLink("Mở bảng Tồn kho chi tiết (/inventory)", "/inventory", "secondary"));

        Map<String, Object> raw = new LinkedHashMap<>();
        raw.put("warehouseCode", wh.getCode());
        raw.put("warehouseName", wh.getName());
        raw.put("sku", product.getSku());
        raw.put("productName", product.getName());
        raw.put("unit", unit);
        raw.put("onHandQty", onHandQty);
        raw.put("reservedQty", reservedQty);
        raw.put("unavailableQty", unavailableQty);
        raw.put("expiredQty", expiredQty);
        raw.put("quarantineQty", quarantineQty);
        raw.put("lockedBinQty", lockedBinQty);
        raw.put("availableQty", availableQty);
        raw.put("requestedQty", req);
        raw.put("shortageQty", shortage);
        raw.put("incomingPipeline", incoming.rawPayload().get("incomingItems"));

        return new ToolBundleResult(wh, breakdown, evidences, recs, actions, raw);
    }

    /**
     * Tool 3: Kiểm tra nguồn hàng từ PO đang chờ nhập hoặc đang nằm ở Staging chờ Putaway.
     */
    @Transactional(readOnly = true)
    public ToolBundleResult getIncomingPipeline(String warehouseHint, String skuOrName) {
        Warehouse wh = accessGuard.resolveAndRequireAccess(warehouseHint);
        Product product = resolveProduct(skuOrName);
        String unit = product.getUnit() != null ? product.getUnit() : "đơn vị";

        List<InboundOrder> orders = inboundOrderRepository.findByWarehouseIdOrderByCreatedAtDesc(wh.getId());
        List<DiagnosisEvidence> evidences = new ArrayList<>();
        List<Map<String, Object>> incomingItems = new ArrayList<>();

        for (InboundOrder po : orders) {
            if ("STOCKED".equalsIgnoreCase(po.getStatus()) || "CANCELLED".equalsIgnoreCase(po.getStatus())) {
                continue;
            }
            if (po.getItems() == null) continue;
            for (InboundOrderItem it : po.getItems()) {
                if (!product.getId().equals(it.getProductId())) continue;
                int expected = it.getExpectedQty() != null ? it.getExpectedQty() : 0;
                int pendingPutaway = Math.max(0, it.getRemainingQty());
                int qtyToReport = "RECEIVED".equalsIgnoreCase(po.getStatus()) ? pendingPutaway : expected;
                if (qtyToReport <= 0 && "RECEIVED".equalsIgnoreCase(po.getStatus())) continue;

                String stageLabel = "RECEIVED".equalsIgnoreCase(po.getStatus())
                        ? "Đã nhận tại Staging — Chờ Putaway lên kệ"
                        : "Đơn PO đang chờ hàng về kho (" + po.getStatus() + ")";
                evidences.add(new DiagnosisEvidence(
                        "INCOMING_PO",
                        po.getOrderCode(),
                        qtyToReport,
                        po.getStatus(),
                        String.format("%s %s (%s): %d %s.", po.getOrderCode(), stageLabel, product.getSku(), qtyToReport, unit),
                        "/inbound"
                ));
                incomingItems.add(Map.of(
                        "poCode", po.getOrderCode(),
                        "status", po.getStatus(),
                        "qty", qtyToReport
                ));
            }
        }

        Map<String, Object> raw = new LinkedHashMap<>();
        raw.put("warehouseCode", wh.getCode());
        raw.put("sku", product.getSku());
        raw.put("incomingItems", incomingItems);

        return new ToolBundleResult(
                wh,
                null,
                evidences,
                incomingItems.isEmpty()
                        ? List.of("Hiện chưa có đơn nhập PO mở nào chứa SKU này tại " + wh.getCode() + ".")
                        : List.of("Hoàn tất bước cất hàng lên kệ (Putaway) cho các PO đang chờ để bổ sung tồn khả dụng."),
                List.of(new ActionLink("Xem Đơn Nhập Kho (/inbound)", "/inbound", "primary")),
                raw
        );
    }

    /**
     * Tool 4: Quét nhanh các điểm nghẽn / rủi ro vận hành của toàn kho (ô quá tải, kệ khóa, lô cận/hết hạn, SO đang chờ).
     */
    @Transactional(readOnly = true)
    public ToolBundleResult getWarehouseExceptions(String warehouseHint) {
        Warehouse wh = accessGuard.resolveAndRequireAccess(warehouseHint);
        LocalDate today = LocalDate.now();
        List<DiagnosisEvidence> evidences = new ArrayList<>();
        List<String> recs = new ArrayList<>();

        List<Location> locations = locationRepository.findByWarehouseId(wh.getId());
        Map<Long, Product> productMap = productRepository.findAll().stream()
                .collect(Collectors.toMap(Product::getId, p -> p));
        Map<Long, ProductBatch> batchMap = productBatchRepository.findAll().stream()
                .collect(Collectors.toMap(ProductBatch::getId, b -> b));

        int overloadCount = 0;
        int lockedCount = 0;
        int expiringOrExpiredCount = 0;

        for (Location loc : locations) {
            List<Inventory> locInvs = inventoryRepository.findByLocationId(loc.getId());
            BigDecimal totalKg = BigDecimal.ZERO;
            int totalQtyInBin = 0;

            for (Inventory inv : locInvs) {
                int oh = inv.getOnHandQty() != null ? inv.getOnHandQty() : 0;
                if (oh <= 0) continue;
                totalQtyInBin += oh;
                Product p = productMap.get(inv.getProductId());
                BigDecimal wKg = (p != null && p.getWeightKg() != null) ? p.getWeightKg() : BigDecimal.ONE;
                totalKg = totalKg.add(wKg.multiply(BigDecimal.valueOf(oh)));

                ProductBatch b = inv.getBatchId() != null ? batchMap.get(inv.getBatchId()) : null;
                if (b != null && b.getExpiryDate() != null) {
                    long days = ChronoUnit.DAYS.between(today, b.getExpiryDate());
                    if (days <= 30) {
                        expiringOrExpiredCount++;
                        evidences.add(new DiagnosisEvidence(
                                days < 0 ? "EXPIRED" : "EXPIRING",
                                b.getBatchNumber(),
                                oh,
                                days < 0 ? "Đã Hết Hạn" : ("Cận Hạn " + days + " ngày"),
                                String.format("%s (%s): %d %s tại %s • HSD: %s.",
                                        p != null ? p.getName() : "SP",
                                        p != null ? p.getSku() : "",
                                        oh,
                                        p != null && p.getUnit() != null ? p.getUnit() : "đơn vị",
                                        loc.getBinBarcode(),
                                        b.getExpiryDate()),
                                "/layout?warehouse=" + wh.getCode() + "&search=" + loc.getBinBarcode()
                        ));
                    }
                }
            }

            if (!Boolean.TRUE.equals(loc.getIsActive())) {
                lockedCount++;
                evidences.add(new DiagnosisEvidence(
                        "LOCKED_BIN",
                        loc.getBinBarcode(),
                        totalQtyInBin,
                        "Ô Kệ Khóa Bảo Trì",
                        String.format("Ô %s đang bị Khóa Bảo Trì (tồn trong ô: %d đơn vị).", loc.getBinBarcode(), totalQtyInBin),
                        "/layout?warehouse=" + wh.getCode() + "&search=" + loc.getBinBarcode()
                ));
            }
            if (loc.getMaxWeightKg() != null && loc.getMaxWeightKg().compareTo(BigDecimal.ZERO) > 0
                    && totalKg.compareTo(loc.getMaxWeightKg()) > 0) {
                overloadCount++;
                int pct = totalKg.multiply(BigDecimal.valueOf(100))
                        .divide(loc.getMaxWeightKg(), 0, java.math.RoundingMode.HALF_UP).intValue();
                evidences.add(new DiagnosisEvidence(
                        "OVERLOAD_BIN",
                        loc.getBinBarcode(),
                        totalQtyInBin,
                        "Quá Tải " + pct + "%",
                        String.format("Ô %s đang chịu tải %.1f / %.0f kg (%d%%) — vượt tải trọng thiết kế.",
                                loc.getBinBarcode(), totalKg.doubleValue(), loc.getMaxWeightKg().doubleValue(), pct),
                        "/layout?warehouse=" + wh.getCode() + "&search=" + loc.getBinBarcode()
                ));
            }
        }

        List<OutboundOrder> pendingOrders = outboundOrderRepository.findAll().stream()
                .filter(o -> wh.getId().equals(o.getWarehouseId()) && "PENDING".equalsIgnoreCase(o.getStatus()))
                .toList();
        for (OutboundOrder so : pendingOrders) {
            int req = so.getItems() != null ? so.getItems().stream().mapToInt(i -> i.getRequestedQty() != null ? i.getRequestedQty() : 0).sum() : 0;
            evidences.add(new DiagnosisEvidence(
                    "OUTBOUND_ORDER",
                    so.getOrderCode(),
                    req,
                    "SO Chờ Phân Bổ FEFO",
                    String.format("Đơn %s (%s) yêu cầu %d sản phẩm đang ở trạng thái PENDING chưa phân bổ FEFO.",
                            so.getOrderCode(), so.getCustomerName(), req),
                    "/outbound"
            ));
        }

        if (overloadCount > 0) {
            recs.add(String.format("Có %d ô kệ đang vượt tải trọng an toàn — mở Sơ Đồ Mặt Bằng để điều chuyển bớt hàng sang ô trống.", overloadCount));
        }
        if (expiringOrExpiredCount > 0) {
            recs.add(String.format("Có %d lô hàng hết hạn/cận hạn <= 30 ngày — ưu tiên xuất theo FEFO hoặc chuyển sang Khu Cách Ly (ZONE_QUA).", expiringOrExpiredCount));
        }
        if (!pendingOrders.isEmpty()) {
            recs.add(String.format("Có %d đơn SO đang chờ phân bổ FEFO — kiểm tra và thực hiện cấp phát lô sớm tránh trễ giao hàng.", pendingOrders.size()));
        }
        if (recs.isEmpty()) {
            recs.add("Kho " + wh.getName() + " hiện đang vận hành ổn định, chưa ghi nhận cảnh báo quá tải hay lô quá hạn.");
        }

        Map<String, Object> raw = new LinkedHashMap<>();
        raw.put("warehouseCode", wh.getCode());
        raw.put("warehouseName", wh.getName());
        raw.put("overloadBins", overloadCount);
        raw.put("lockedBins", lockedCount);
        raw.put("expiringOrExpiredBatches", expiringOrExpiredCount);
        raw.put("pendingOutboundOrders", pendingOrders.size());

        return new ToolBundleResult(
                wh,
                null,
                evidences,
                recs,
                List.of(
                        new ActionLink("Mở Sơ Đồ Mặt Bằng (/layout)", "/layout?warehouse=" + wh.getCode(), "primary"),
                        new ActionLink("Kiểm tra Đơn Xuất Kho (/outbound)", "/outbound", "info")
                ),
                raw
        );
    }

    private Product resolveProduct(String skuOrName) {
        if (skuOrName == null || skuOrName.isBlank()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Vui lòng chỉ rõ mã SKU hoặc tên sản phẩm cần phân tích.");
        }
        String trimmed = skuOrName.trim();
        Optional<Product> exact = productRepository.findBySkuAndDeletedAtIsNull(trimmed.toUpperCase(Locale.ROOT));
        if (exact.isPresent()) return exact.get();

        String normQuery = normalize(trimmed);
        return productRepository.findAllByDeletedAtIsNullOrderByCreatedAtDesc().stream()
                .filter(p -> (p.getSku() != null && normalize(p.getSku()).contains(normQuery))
                        || (p.getName() != null && normalize(p.getName()).contains(normQuery))
                        || (p.getBarcode() != null && p.getBarcode().equalsIgnoreCase(trimmed)))
                .findFirst()
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND,
                        "Không tìm thấy sản phẩm khớp với '" + trimmed + "' trong danh mục hàng hóa."));
    }

    private List<String> findReservationHolders(Long locationId, Long productId, Long batchId) {
        Set<String> codes = new LinkedHashSet<>();
        for (PickAllocation pa : pickAllocationRepository.findByLocationIdAndBatchId(locationId, batchId)) {
            if (pa.getStatus() != null
                    && Set.of("ALLOCATED", "PICKING").contains(pa.getStatus().toUpperCase(Locale.ROOT))
                    && productId.equals(pa.getProductId())
                    && pa.getOutboundOrderItem() != null && pa.getOutboundOrderItem().getOutboundOrder() != null) {
                codes.add(pa.getOutboundOrderItem().getOutboundOrder().getOrderCode() + " (" + pa.getAllocatedQty() + " · " + pa.getStatus() + ")");
            }
        }
        for (StockReservation sr : stockReservationRepository.findByLocationIdAndProductIdAndBatchId(locationId, productId, batchId)) {
            if ("RESERVED".equalsIgnoreCase(sr.getStatus())) {
                outboundOrderRepository.findById(sr.getOutboundOrderId()).ifPresent(o ->
                        codes.add(o.getOrderCode() + " (" + sr.getReservedQty() + ")"));
            }
        }
        return new ArrayList<>(codes);
    }

    private int computeAvailableInWarehouse(Long warehouseId, Long productId, LocalDate today) {
        Map<Long, Location> locs = locationRepository.findByWarehouseId(warehouseId).stream()
                .collect(Collectors.toMap(Location::getId, l -> l));
        Set<Long> activeBatches = productBatchRepository.findActiveBatchesOrderByExpiryAsc(productId, today).stream()
                .map(ProductBatch::getId).collect(Collectors.toSet());
        int avail = 0;
        for (Inventory inv : inventoryRepository.findByProductId(productId)) {
            Location loc = locs.get(inv.getLocationId());
            if (loc != null && Boolean.TRUE.equals(loc.getIsActive()) && activeBatches.contains(inv.getBatchId())) {
                int oh = inv.getOnHandQty() != null ? inv.getOnHandQty() : 0;
                int res = inv.getReservedQty() != null ? inv.getReservedQty() : 0;
                avail += Math.max(0, oh - res);
            }
        }
        return avail;
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

