package com.wms.module.reporting.service;

import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.xssf.streaming.SXSSFSheet;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileOutputStream;
import java.util.UUID;

@Slf4j
@Service
public class ExcelStreamingWorker {

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
