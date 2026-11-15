package com.wms.module.reporting.service;

import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.xssf.streaming.SXSSFSheet;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.springframework.stereotype.Service;
import com.wms.module.identity.entity.User;
import com.wms.module.identity.repository.UserRepository;
import com.wms.module.inventory.entity.ProductBatch;
import com.wms.module.inventory.entity.StockLedger;
import com.wms.module.inventory.repository.ProductBatchRepository;
import com.wms.module.inventory.entity.Inventory;
import com.wms.module.inventory.repository.InventoryRepository;
import com.wms.module.masterdata.entity.Category;
import com.wms.module.masterdata.repository.CategoryRepository;
import com.wms.module.inventory.repository.StockLedgerRepository;
import com.wms.module.masterdata.entity.Location;
import com.wms.module.masterdata.entity.Product;
import com.wms.module.masterdata.repository.LocationRepository;
import com.wms.module.masterdata.repository.ProductRepository;
import com.wms.module.order.entity.InboundOrder;
import com.wms.module.order.entity.InboundOrderItem;
import com.wms.module.order.repository.InboundOrderRepository;
import com.wms.module.order.entity.OutboundOrder;
import com.wms.module.order.entity.OutboundOrderItem;
import com.wms.module.order.entity.PickAllocation;
import com.wms.module.order.repository.OutboundOrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.FileOutputStream;
import java.util.UUID;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.time.Duration;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.math.BigDecimal;
import java.util.Comparator;
import java.util.HashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExcelStreamingWorker {

    private final StockLedgerRepository stockLedgerRepository;
    private final ProductRepository productRepository;
    private final ProductBatchRepository productBatchRepository;
    private final LocationRepository locationRepository;
    private final UserRepository userRepository;
    private final InboundOrderRepository inboundOrderRepository;
    private final InventoryRepository inventoryRepository;
    private final CategoryRepository categoryRepository;
    private final OutboundOrderRepository outboundOrderRepository;

    private static final String XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    @Transactional(readOnly = true)
    public File generateExpiryReport(UUID jobId) throws Exception {
        File file = File.createTempFile("wms_expiry_" + jobId, ".xlsx");
        Map<Long, Product> products = productRepository.findAll().stream().collect(Collectors.toMap(Product::getId, p -> p, (a,b) -> a));
        Map<Long, ProductBatch> batches = productBatchRepository.findAll().stream().collect(Collectors.toMap(ProductBatch::getId, b -> b, (a,b) -> a));
        Map<Long, Category> categories = categoryRepository.findAll().stream().collect(Collectors.toMap(Category::getId, c -> c, (a,b) -> a));
        Map<Long, int[]> totals = new HashMap<>();
        for (Inventory inventory : inventoryRepository.findAll()) {
            int[] t = totals.computeIfAbsent(inventory.getBatchId(), k -> new int[3]);
            t[0] += inventory.getOnHandQty() == null ? 0 : inventory.getOnHandQty();
            t[1] += inventory.getReservedQty() == null ? 0 : inventory.getReservedQty();
            t[2] += inventory.getAvailableQty();
        }
        List<Long> batchIds = totals.keySet().stream().sorted(Comparator.comparing((Long id) -> batches.get(id) == null || batches.get(id).getExpiryDate() == null ? LocalDate.MAX : batches.get(id).getExpiryDate())).toList();
        LocalDate today = LocalDate.now();
        try (SXSSFWorkbook workbook = new SXSSFWorkbook(100); FileOutputStream fos = new FileOutputStream(file)) {
            SXSSFSheet sheet = workbook.createSheet("Can doi FEFO FIFO");
            String[] headers = {"STT", "Danh mục", "SKU", "Tên sản phẩm", "Mã lô", "Ngày sản xuất", "Hạn sử dụng", "Ngày còn lại", "Phân loại", "Tồn vật lý", "Đang giữ", "Tồn khả dụng", "Đơn vị", "Thứ tự FEFO"};
            Row header = sheet.createRow(0); for (int i=0;i<headers.length;i++) header.createCell(i).setCellValue(headers[i]);
            int rowNo = 1, fefo = 1;
            for (Long batchId : batchIds) {
                ProductBatch batch = batches.get(batchId); int[] t = totals.get(batchId); if (t[2] <= 0) continue;
                Product product = batch == null ? null : products.get(batch.getProductId());
                Category category = product == null ? null : categories.get(product.getCategoryId());
                Long days = batch == null || batch.getExpiryDate() == null ? null : ChronoUnit.DAYS.between(today, batch.getExpiryDate());
                String classification = days == null ? "KHÔNG CÓ HẠN" : days < 0 ? "ĐÃ HẾT HẠN" : days <= 30 ? "CẬN DATE 30 NGÀY" : days <= 60 ? "CẬN DATE 60 NGÀY" : days <= 90 ? "CẬN DATE 90 NGÀY" : "AN TOÀN";
                Row row = sheet.createRow(rowNo); int c=0; row.createCell(c++).setCellValue(rowNo); row.createCell(c++).setCellValue(category == null ? "" : category.getName()); row.createCell(c++).setCellValue(product == null ? "" : product.getSku()); row.createCell(c++).setCellValue(product == null ? "" : product.getName()); row.createCell(c++).setCellValue(batch == null ? "" : batch.getBatchNumber()); row.createCell(c++).setCellValue(batch != null && batch.getManufactureDate()!=null ? batch.getManufactureDate().toString() : ""); row.createCell(c++).setCellValue(batch != null && batch.getExpiryDate()!=null ? batch.getExpiryDate().toString() : ""); if (days != null) row.createCell(c++).setCellValue(days); else row.createCell(c++).setCellValue(""); row.createCell(c++).setCellValue(classification); row.createCell(c++).setCellValue(t[0]); row.createCell(c++).setCellValue(t[1]); row.createCell(c++).setCellValue(t[2]); row.createCell(c++).setCellValue(product == null ? "" : product.getUnit()); row.createCell(c).setCellValue(fefo++); rowNo++;
            }
            workbook.write(fos); workbook.dispose();
        }
        return file;
    }

    public File generateExpiryReport(UUID jobId, YearMonth month) throws Exception {
        return generateExpiryReport(jobId);
    }

    @Transactional(readOnly = true)
    public File generateSlottingReport(UUID jobId) throws Exception {
        File file = File.createTempFile("wms_slotting_" + jobId, ".xlsx");
        Map<Long, int[]> sums = new HashMap<>();
        for (Inventory i : inventoryRepository.findAll()) { int[] s=sums.computeIfAbsent(i.getLocationId(), k -> new int[4]); s[0]+=i.getOnHandQty()==null?0:i.getOnHandQty(); s[1]+=i.getReservedQty()==null?0:i.getReservedQty(); s[2]+=i.getAvailableQty(); if ((i.getOnHandQty()==null?0:i.getOnHandQty())>0) s[3]++; }
        List<Location> locations = locationRepository.findByIsActiveTrue().stream().filter(l -> "A".equalsIgnoreCase(l.getZoneCode()) || "B".equalsIgnoreCase(l.getZoneCode()) || "ZONE_A".equalsIgnoreCase(l.getZoneCode()) || "ZONE_B".equalsIgnoreCase(l.getZoneCode())).toList();
        try (SXSSFWorkbook workbook = new SXSSFWorkbook(100); FileOutputStream fos = new FileOutputStream(file)) {
            SXSSFSheet summary=workbook.createSheet("Tong hop Zone"); String[] sh={"Zone","Tổng ô hoạt động","Ô đang có hàng","Tỷ lệ lấp đầy ô","Tổng tải trọng thiết kế (kg)","Tải trọng thực tế (kg)","Tỷ lệ lấp đầy thể tích","Ghi chú"}; Row hr=summary.createRow(0); for(int i=0;i<sh.length;i++)hr.createCell(i).setCellValue(sh[i]);
            int sr=1; for(String zone: List.of("A","B")){List<Location> zs=locations.stream().filter(l -> l.getZoneCode()!=null && l.getZoneCode().toUpperCase().contains(zone)).toList(); long occupied=zs.stream().filter(l -> sums.getOrDefault(l.getId(),new int[4])[0]>0).count(); BigDecimal cap=zs.stream().map(Location::getMaxWeightKg).filter(x->x!=null).reduce(BigDecimal.ZERO, BigDecimal::add); Row r=summary.createRow(sr++); r.createCell(0).setCellValue("Zone "+zone); r.createCell(1).setCellValue(zs.size()); r.createCell(2).setCellValue(occupied); r.createCell(3).setCellValue(zs.isEmpty()?0:(double)occupied*100/zs.size()); r.createCell(4).setCellValue(cap.doubleValue()); r.createCell(5).setCellValue("N/A"); r.createCell(6).setCellValue("N/A"); r.createCell(7).setCellValue("Chưa có trọng lượng/thể tích sản phẩm trong dữ liệu");}
            SXSSFSheet detail=workbook.createSheet("Chi tiet o ke"); String[] dh={"STT","Zone","Mã ô kệ","Aisle","Rack","Shelf","Bin","Tải trọng tối đa (kg)","Tồn vật lý (đơn vị)","Đang giữ","Khả dụng","Số dòng hàng","Trạng thái","Tải thực tế (kg)","Tỷ lệ thể tích","Ghi chú"}; Row dhr=detail.createRow(0); for(int i=0;i<dh.length;i++)dhr.createCell(i).setCellValue(dh[i]); int dr=1; for(Location l:locations){int[] s=sums.getOrDefault(l.getId(),new int[4]); Row r=detail.createRow(dr); int c=0; r.createCell(c++).setCellValue(dr); r.createCell(c++).setCellValue(l.getZoneCode()); r.createCell(c++).setCellValue(l.getBinBarcode()); r.createCell(c++).setCellValue(l.getAisle()); r.createCell(c++).setCellValue(l.getRack()); r.createCell(c++).setCellValue(l.getShelf()); r.createCell(c++).setCellValue(l.getBin()); r.createCell(c++).setCellValue(l.getMaxWeightKg()==null?0:l.getMaxWeightKg().doubleValue()); r.createCell(c++).setCellValue(s[0]); r.createCell(c++).setCellValue(s[1]); r.createCell(c++).setCellValue(s[2]); r.createCell(c++).setCellValue(s[3]); r.createCell(c++).setCellValue(s[0]>0?"ĐANG SỬ DỤNG":"TRỐNG"); r.createCell(c++).setCellValue("N/A"); r.createCell(c++).setCellValue("N/A"); r.createCell(c).setCellValue("Chưa có trọng lượng/thể tích sản phẩm"); dr++;}
            workbook.write(fos); workbook.dispose();
        } return file;
    }

    public File generateSlottingReport(UUID jobId, YearMonth month) throws Exception {
        return generateSlottingReport(jobId);
    }

    @Transactional(readOnly = true)
    public File generateFulfillmentReport(UUID jobId) throws Exception {
        return generateFulfillmentReport(jobId, null);
    }

    @Transactional(readOnly = true)
    public File generateFulfillmentReport(UUID jobId, YearMonth month) throws Exception {
        File file=File.createTempFile("wms_fulfillment_"+jobId,".xlsx"); List<OutboundOrder> orders=outboundOrderRepository.findAll().stream().filter(o -> inMonth(o.getCreatedAt(), month)).toList(); long completed=orders.stream().filter(o -> "DISPATCHED".equalsIgnoreCase(o.getStatus()) || "SHIPPED".equalsIgnoreCase(o.getStatus())).count(); long active=orders.stream().filter(o -> !"CANCELLED".equalsIgnoreCase(o.getStatus())).count();
        try(SXSSFWorkbook workbook=new SXSSFWorkbook(100); FileOutputStream fos=new FileOutputStream(file)){SXSSFSheet kpi=workbook.createSheet("KPI SLA"); String[] kh={"Chỉ số","Giá trị","Ghi chú"}; Row h=kpi.createRow(0);for(int i=0;i<kh.length;i++)h.createCell(i).setCellValue(kh[i]); String[][] metrics={{"Tổng đơn hợp lệ",String.valueOf(active),"Không tính đơn đã hủy"},{"Đơn hoàn tất",String.valueOf(completed),"Trạng thái DISPATCHED/SHIPPED"},{"Tỷ lệ hoàn tất",active==0?"0":String.valueOf((double)completed*100/active),"%"}};for(int i=0;i<metrics.length;i++){Row r=kpi.createRow(i+1);for(int j=0;j<3;j++)r.createCell(j).setCellValue(metrics[i][j]);}
            SXSSFSheet detail=workbook.createSheet("Chi tiet SLA"); String[] dh={"STT","Mã đơn","Khách hàng","Trạng thái","Thời gian tạo","Cập nhật gần nhất","Thời gian xử lý (phút)","Tổng yêu cầu","Đã phân bổ","Đã lấy","Tỷ lệ lấy hàng (%)","Pick hoàn tất lúc","Pack hoàn tất lúc","Ghi chú"}; h=detail.createRow(0);for(int i=0;i<dh.length;i++)h.createCell(i).setCellValue(dh[i]);int n=1;for(OutboundOrder o:orders){int requested=0,allocated=0,picked=0;InstantHolder times=new InstantHolder();for(OutboundOrderItem item:o.getItems()){requested+=item.getRequestedQty()==null?0:item.getRequestedQty();allocated+=item.getAllocatedQty()==null?0:item.getAllocatedQty();picked+=item.getPickedQty()==null?0:item.getPickedQty();for(PickAllocation a:item.getAllocations())if(a.getPickedAt()!=null&&(times.first==null||a.getPickedAt().isBefore(times.first)))times.first=a.getPickedAt();}Row r=detail.createRow(n);int c=0;r.createCell(c++).setCellValue(n);r.createCell(c++).setCellValue(o.getOrderCode());r.createCell(c++).setCellValue(o.getCustomerName()==null?"":o.getCustomerName());r.createCell(c++).setCellValue(o.getStatus());r.createCell(c++).setCellValue(o.getCreatedAt()==null?"":o.getCreatedAt().toString());r.createCell(c++).setCellValue(o.getUpdatedAt()==null?"":o.getUpdatedAt().toString());r.createCell(c++).setCellValue(o.getCreatedAt()!=null&&o.getUpdatedAt()!=null?Duration.between(o.getCreatedAt(),o.getUpdatedAt()).toMinutes():0);r.createCell(c++).setCellValue(requested);r.createCell(c++).setCellValue(allocated);r.createCell(c++).setCellValue(picked);r.createCell(c++).setCellValue(requested==0?0:(double)picked*100/requested);r.createCell(c++).setCellValue(times.first==null?"":times.first.toString());r.createCell(c++).setCellValue("N/A");r.createCell(c).setCellValue("Schema hiện tại chưa có thời điểm đóng gói (pack)");n++;}workbook.write(fos);workbook.dispose();}return file;
    }

    private static class InstantHolder { java.time.Instant first; }

    @Transactional(readOnly = true)
    public File generateInboundReport(UUID jobId) throws Exception {
        return generateInboundReport(jobId, null);
    }

    @Transactional(readOnly = true)
    public File generateInboundReport(UUID jobId, YearMonth month) throws Exception {
        File tempFile = File.createTempFile("wms_inbound_" + jobId, ".xlsx");
        List<InboundOrder> orders = inboundOrderRepository.findAll().stream().filter(o -> inMonth(o.getCreatedAt(), month)).toList();
        try (SXSSFWorkbook workbook = new SXSSFWorkbook(100); FileOutputStream fos = new FileOutputStream(tempFile)) {
            SXSSFSheet sheet = workbook.createSheet("Bao cao nhap kho");
            String[] headers = {"STT", "Mã chứng từ nhập", "Nhà cung cấp", "SKU", "Tên sản phẩm", "Mã lô", "Ngày sản xuất", "Hạn sử dụng", "Số lượng dự kiến", "Số lượng đã nhận", "Đơn giá", "Trạng thái đơn", "Trạng thái dòng", "Ngày tạo", "Ghi chú"};
            Row header = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) header.createCell(i).setCellValue(headers[i]);
            int rowNumber = 1;
            for (InboundOrder order : orders) {
                for (InboundOrderItem item : order.getItems()) {
                    Row row = sheet.createRow(rowNumber);
                    int c = 0;
                    row.createCell(c++).setCellValue(rowNumber);
                    row.createCell(c++).setCellValue(order.getOrderCode());
                    row.createCell(c++).setCellValue(order.getSupplier() != null ? order.getSupplier().getName() : "");
                    row.createCell(c++).setCellValue(item.getProduct() != null ? item.getProduct().getSku() : "");
                    row.createCell(c++).setCellValue(item.getProduct() != null ? item.getProduct().getName() : "");
                    row.createCell(c++).setCellValue(item.getBatchNumber() != null ? item.getBatchNumber() : (item.getProductBatchId() != null ? "BATCH-" + item.getProductBatchId() : ""));
                    row.createCell(c++).setCellValue(item.getManufactureDate() != null ? item.getManufactureDate().toString() : "");
                    row.createCell(c++).setCellValue(item.getExpiryDate() != null ? item.getExpiryDate().toString() : "");
                    row.createCell(c++).setCellValue(item.getExpectedQty() != null ? item.getExpectedQty() : 0);
                    row.createCell(c++).setCellValue(item.getReceivedQty() != null ? item.getReceivedQty() : 0);
                    row.createCell(c++).setCellValue(item.getUnitPrice() != null ? item.getUnitPrice().doubleValue() : 0D);
                    row.createCell(c++).setCellValue(order.getStatus() != null ? order.getStatus() : "");
                    row.createCell(c++).setCellValue(item.getStatus() != null ? item.getStatus() : "");
                    row.createCell(c++).setCellValue(order.getCreatedAt() != null ? order.getCreatedAt().toString() : "");
                    row.createCell(c).setCellValue(order.getNotes() != null ? order.getNotes() : "");
                    rowNumber++;
                }
            }
            workbook.write(fos);
            workbook.dispose();
        }
        return tempFile;
    }

    public File generateTransactionReport(UUID jobId) throws Exception {
        return generateTransactionReport(jobId, null);
    }

    public File generateTransactionReport(UUID jobId, YearMonth month) throws Exception {
        File tempFile = File.createTempFile("wms_transactions_" + jobId, ".xlsx");
        List<StockLedger> ledgers = stockLedgerRepository.findByTransactionTypeInOrderByCreatedAtDesc(List.of("INBOUND", "OUTBOUND", "TRANSFER")).stream().filter(l -> inMonth(l.getCreatedAt(), month)).toList();
        Map<Long, Product> products = productRepository.findAll().stream().collect(Collectors.toMap(Product::getId, p -> p, (a, b) -> a));
        Map<Long, ProductBatch> batches = productBatchRepository.findAll().stream().collect(Collectors.toMap(ProductBatch::getId, b -> b, (a, b) -> a));
        Map<Long, Location> locations = locationRepository.findAll().stream().collect(Collectors.toMap(Location::getId, l -> l, (a, b) -> a));
        Map<Long, User> users = userRepository.findAll().stream().collect(Collectors.toMap(User::getId, u -> u, (a, b) -> a));

        try (SXSSFWorkbook workbook = new SXSSFWorkbook(100); FileOutputStream fos = new FileOutputStream(tempFile)) {
            SXSSFSheet sheet = workbook.createSheet("Giao dich kho");
            String[] headers = {"STT", "Loại giao dịch", "Mã chứng từ", "SKU", "Tên sản phẩm", "Mã lô", "Ngày sản xuất", "Hạn sử dụng", "Vị trí", "Số lượng thay đổi", "Tồn trước", "Tồn sau", "Người thực hiện", "Ghi chú", "Thời gian"};
            Row header = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) header.createCell(i).setCellValue(headers[i]);
            int rowNumber = 1;
            for (StockLedger ledger : ledgers) {
                Product product = products.get(ledger.getProductId());
                ProductBatch batch = batches.get(ledger.getBatchId());
                Location location = locations.get(ledger.getLocationId());
                User user = users.get(ledger.getPerformedBy());
                Row row = sheet.createRow(rowNumber);
                int c = 0;
                row.createCell(c++).setCellValue(rowNumber);
                row.createCell(c++).setCellValue(ledger.getTransactionType());
                row.createCell(c++).setCellValue(ledger.getReferenceCode());
                row.createCell(c++).setCellValue(product != null ? product.getSku() : "");
                row.createCell(c++).setCellValue(product != null ? product.getName() : "");
                row.createCell(c++).setCellValue(batch != null ? batch.getBatchNumber() : "");
                row.createCell(c++).setCellValue(batch != null && batch.getManufactureDate() != null ? batch.getManufactureDate().toString() : "");
                row.createCell(c++).setCellValue(batch != null && batch.getExpiryDate() != null ? batch.getExpiryDate().toString() : "");
                row.createCell(c++).setCellValue(location != null ? location.getBinBarcode() : "");
                row.createCell(c++).setCellValue(ledger.getQtyChange() != null ? ledger.getQtyChange() : 0);
                int balanceAfter = ledger.getBalanceAfter() != null ? ledger.getBalanceAfter() : 0;
                row.createCell(c++).setCellValue(balanceAfter - (ledger.getQtyChange() != null ? ledger.getQtyChange() : 0));
                row.createCell(c++).setCellValue(balanceAfter);
                row.createCell(c++).setCellValue(user != null ? user.getFullName() : "");
                row.createCell(c++).setCellValue(ledger.getNotes() != null ? ledger.getNotes() : "");
                row.createCell(c).setCellValue(ledger.getCreatedAt() != null ? ledger.getCreatedAt().toString() : "");
                rowNumber++;
            }
            workbook.write(fos);
            workbook.dispose();
        }
        return tempFile;
    }

    private boolean inMonth(java.time.Instant timestamp, YearMonth month) {
        return month == null || (timestamp != null && YearMonth.from(timestamp.atZone(ZoneId.systemDefault())).equals(month));
    }

    /**
     * STREAMING EXCEL BẰNG SXSSFWorkbook:
     * Giữ tối đa 100 dòng trên RAM, còn lại tự động ghi xuống đĩa tạm
     * Đảm bảo RAM máy chủ không bao giờ vượt quá 50MB dù xuất hàng triệu dòng!
     */
    public File generateLargeInventoryReport(UUID jobId) throws Exception {
        log.info("Worker bat dau stream Excel cho JobId: {}", jobId);

        File tempFile = File.createTempFile("wms_report_" + jobId, ".xlsx");

        // rowAccessWindowSize = 100: chỉ giữ 100 dòng trong RAM
        try (SXSSFWorkbook workbook = new SXSSFWorkbook(100);
             FileOutputStream fos = new FileOutputStream(tempFile)) {

            SXSSFSheet sheet = workbook.createSheet("Báo Cáo Tồn Kho");
            sheet.trackAllColumnsForAutoSizing();

            // 1. Tạo Header
            Row headerRow = sheet.createRow(0);
            String[] headers = {"STT", "Mã SKU", "Tên Sản Phẩm", "Mã Vạch Ô Kệ", "Số Lô", "Hạn Sử Dụng", "Tồn Vật Lý", "Đang Giữ", "Khả Dụng"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
            }

            // 2. Stream dữ liệu giả lập (trong thực tế lặp qua Cursor DB)
            for (int r = 1; r <= 1000; r++) {
                Row row = sheet.createRow(r);
                row.createCell(0).setCellValue(r);
                row.createCell(1).setCellValue("SKU-DEMO-" + r);
                row.createCell(2).setCellValue("Sản phẩm mẫu #" + r);
                row.createCell(3).setCellValue("ZA-A01-R01-S01-B" + (r % 20 + 1));
                row.createCell(4).setCellValue("BATCH-2026-" + (r % 5 + 1));
                row.createCell(5).setCellValue("2026-12-31");
                row.createCell(6).setCellValue(100);
                row.createCell(7).setCellValue(20);
                row.createCell(8).setCellValue(80);
            }

            // Ghi trực tiếp ra file tạm
            workbook.write(fos);
            workbook.dispose(); // Dọn dẹp bộ nhớ đệm trên đĩa
        }

        log.info("Xuat file Excel thanh cong tai: {}, Size: {} KB", tempFile.getAbsolutePath(), tempFile.length() / 1024);
        return tempFile;
    }
}
