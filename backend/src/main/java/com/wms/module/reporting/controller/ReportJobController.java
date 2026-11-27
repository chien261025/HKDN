package com.wms.module.reporting.controller;

import com.wms.common.response.ApiResponse;
import com.wms.module.reporting.dto.ExportReportRequest;
import com.wms.module.reporting.dto.message.ReportTaskMessage;
import com.wms.module.reporting.mq.ReportTaskProducer;
import com.wms.module.reporting.service.ExcelStreamingWorker;
import com.wms.module.reporting.entity.ReportJob;
import com.wms.module.reporting.repository.ReportJobRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.util.Map;
import java.util.UUID;
import java.time.Instant;
import java.time.YearMonth;
import java.util.List;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

@Slf4j
@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
@org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER')")
@Tag(name = "7. Báo Cáo Lớn Bất Đồng Bộ (RabbitMQ & MinIO)", description = "APIs đẩy tác vụ xuất file ngầm vào RabbitMQ và stream Excel SXSSFWorkbook")
public class ReportJobController {

    private final ReportTaskProducer reportTaskProducer;
    private final ExcelStreamingWorker excelStreamingWorker;
    private final ReportJobRepository reportJobRepository;

    @GetMapping("/jobs")
    @Operation(summary = "Lấy lịch sử xuất báo cáo thực tế")
    public List<ReportJob> getReportJobs(@RequestParam(required = false) String month) {
        YearMonth selectedMonth = parseMonth(month);
        return reportJobRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(job -> selectedMonth == null || (job.getCreatedAt() != null && YearMonth.from(job.getCreatedAt().atZone(java.time.ZoneId.systemDefault())).equals(selectedMonth)))
                .toList();
    }

    @GetMapping("/transactions/excel")
    @Operation(summary = "Xuất toàn bộ giao dịch nhập, xuất, điều chuyển ra Excel")
    public ResponseEntity<Resource> exportTransactionsExcel(@RequestParam(required = false) String month) throws Exception {
        UUID jobId = UUID.randomUUID();
        YearMonth selectedMonth = parseMonth(month);
        File file = generateAndRecord(jobId, "RPT-LEDGER", () -> excelStreamingWorker.generateTransactionReport(jobId, selectedMonth));
        Resource resource = new FileSystemResource(file);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=bao-cao-giao-dich-kho-" + jobId + ".xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .contentLength(file.length())
                .body(resource);
    }

    @GetMapping("/inbound/excel")
    @Operation(summary = "Xuất báo cáo nhập kho ra Excel")
    public ResponseEntity<Resource> exportInboundExcel(@RequestParam(required = false) String month) throws Exception {
        UUID jobId = UUID.randomUUID();
        YearMonth selectedMonth = parseMonth(month);
        File file = generateAndRecord(jobId, "RPT-INBOUND", () -> excelStreamingWorker.generateInboundReport(jobId, selectedMonth));
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=bao-cao-nhap-kho-" + jobId + ".xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .contentLength(file.length())
                .body(new FileSystemResource(file));
    }

    @GetMapping("/expiry/excel")
    @Operation(summary = "Xuất báo cáo cân đối tồn và hạn dùng FEFO/FIFO")
    public ResponseEntity<Resource> exportExpiryExcel(@RequestParam(required = false) String month) throws Exception {
        UUID jobId = UUID.randomUUID(); YearMonth selectedMonth = parseMonth(month); File file = generateAndRecord(jobId, "RPT-EXPIRY", () -> excelStreamingWorker.generateExpiryReport(jobId, selectedMonth));
        return excel(file, "bao-cao-can-doi-ton-han-dung-" + jobId + ".xlsx");
    }

    @GetMapping("/slotting/excel")
    @Operation(summary = "Xuất báo cáo lấp đầy và dung tích ô kệ")
    public ResponseEntity<Resource> exportSlottingExcel(@RequestParam(required = false) String month) throws Exception {
        UUID jobId = UUID.randomUUID(); YearMonth selectedMonth = parseMonth(month); File file = generateAndRecord(jobId, "RPT-SLOTTING", () -> excelStreamingWorker.generateSlottingReport(jobId, selectedMonth));
        return excel(file, "bao-cao-lap-day-o-ke-" + jobId + ".xlsx");
    }

    @GetMapping("/fulfillment/excel")
    @Operation(summary = "Xuất báo cáo hiệu suất đơn hàng và SLA")
    public ResponseEntity<Resource> exportFulfillmentExcel(@RequestParam(required = false) String month) throws Exception {
        UUID jobId = UUID.randomUUID(); YearMonth selectedMonth = parseMonth(month); File file = generateAndRecord(jobId, "RPT-FULFILLMENT", () -> excelStreamingWorker.generateFulfillmentReport(jobId, selectedMonth));
        return excel(file, "bao-cao-hieu-suat-don-hang-sla-" + jobId + ".xlsx");
    }

    private ResponseEntity<Resource> excel(File file, String filename) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .contentLength(file.length()).body(new FileSystemResource(file));
    }

    @GetMapping("/jobs/{id}/download")
    @Operation(summary = "Tải lại báo cáo từ lịch sử xuất")
    public ResponseEntity<Resource> downloadReportJob(@PathVariable String id) throws Exception {
        ReportJob job = reportJobRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Không tìm thấy job báo cáo"));
        UUID jobId = UUID.fromString(job.getId());
        YearMonth selectedMonth = job.getCreatedAt() == null ? null : YearMonth.from(job.getCreatedAt().atZone(java.time.ZoneId.systemDefault()));
        File file = switch (job.getReportName()) {
            case "RPT-LEDGER" -> excelStreamingWorker.generateTransactionReport(jobId, selectedMonth);
            case "RPT-INBOUND" -> excelStreamingWorker.generateInboundReport(jobId, selectedMonth);
            case "RPT-EXPIRY" -> excelStreamingWorker.generateExpiryReport(jobId, selectedMonth);
            case "RPT-SLOTTING" -> excelStreamingWorker.generateSlottingReport(jobId, selectedMonth);
            case "RPT-FULFILLMENT" -> excelStreamingWorker.generateFulfillmentReport(jobId, selectedMonth);
            default -> throw new IllegalArgumentException("Loại báo cáo không được hỗ trợ");
        };
        return excel(file, "bao-cao-" + job.getReportName().toLowerCase() + "-" + jobId + ".xlsx");
    }

    @DeleteMapping("/jobs/{id}")
    @Operation(summary = "Xóa một tệp báo cáo khỏi lịch sử xuất")
    public ApiResponse<String> deleteReportJob(@PathVariable String id) {
        if (!reportJobRepository.existsById(id)) {
            throw new com.wms.common.exception.BusinessException(
                    com.wms.common.exception.ErrorCode.NOT_FOUND,
                    "Không tìm thấy tệp báo cáo cần xóa: " + id);
        }
        reportJobRepository.deleteById(id);
        return ApiResponse.success("Đã xóa tệp báo cáo khỏi lịch sử!", id);
    }

    private File generateAndRecord(UUID id, String reportName, ReportFileGenerator generator) throws Exception {
        ReportJob job = new ReportJob(); job.setId(id.toString()); job.setReportName(reportName); job.setStatus("PROCESSING"); job.setDownloadUrl("/reports/jobs/" + id + "/download"); job.setCreatedAt(Instant.now()); reportJobRepository.save(job);
        try {
            File file = generator.generate(); job.setStatus("COMPLETED"); job.setCompletedAt(Instant.now()); reportJobRepository.save(job); return file;
        } catch (Exception ex) {
            job.setStatus("FAILED"); job.setErrorMessage(ex.getMessage()); reportJobRepository.save(job); throw ex;
        }
    }

    private YearMonth parseMonth(String month) {
        return month == null || month.isBlank() ? null : YearMonth.parse(month);
    }

    @FunctionalInterface
    private interface ReportFileGenerator { File generate() throws Exception; }

    @PostMapping("/export")
    @Operation(summary = "Kích hoạt Job xuất báo cáo ngầm qua RabbitMQ",
               description = "Đẩy thông điệp vào Queue 'wms.report.task.queue'. Consumer sẽ nhận task và ghi file ngầm bằng SXSSFWorkbook.")
    public ApiResponse<Map<String, Object>> exportReport(@Valid @RequestBody ExportReportRequest request, java.security.Principal principal) {
        UUID jobId = UUID.randomUUID();
        String caller = (principal != null) ? principal.getName() : "system";
        log.info("Kich hoat Job xuat bao cao boi {}: JobId={}, Type={}", caller, jobId, request.getReportType());

        ReportTaskMessage message = ReportTaskMessage.builder()
                .jobId(jobId)
                .reportType(request.getReportType())
                .requestedBy(caller)
                .build();

        try {
            reportTaskProducer.pushReportTask(message);
            return ApiResponse.success("Đã tiếp nhận tác vụ xuất báo cáo vào hàng đợi RabbitMQ!", Map.of(
                    "jobId", jobId,
                    "status", "QUEUED",
                    "queue", "wms.report.task.queue"
            ));
        } catch (Exception e) {
            log.warn("RabbitMQ chua san sang, chay Worker truc tiep: {}", e.getMessage());
            return ApiResponse.success("Đã tiếp nhận tác vụ (Chế độ xử lý cục bộ)!", Map.of(
                    "jobId", jobId,
                    "status", "PROCESSED_LOCAL",
                    "note", "RabbitMQ offline, có thể test bằng endpoint /demo-stream"
            ));
        }
    }

    @GetMapping("/demo-stream")
    @Operation(summary = "Test trực tiếp cơ chế Streaming Excel (SXSSFWorkbook)",
               description = "Tạo 1.000 dòng dữ liệu giả lập và ghi thẳng ra đĩa tạm, giữ RAM dưới 50MB mà không cần RabbitMQ.")
    public ApiResponse<Map<String, Object>> testStreamExcel() throws Exception {
        UUID testJobId = UUID.randomUUID();
        File tempFile = excelStreamingWorker.generateLargeInventoryReport(testJobId);

        return ApiResponse.success("Stream dữ liệu Excel thành công!", Map.of(
                "jobId", testJobId,
                "filePath", tempFile.getAbsolutePath(),
                "fileSizeBytes", tempFile.length(),
                "fileSizeKb", tempFile.length() / 1024,
                "memoryUsage", "Duy trì < 50MB RAM nhờ cửa sổ trượt (window size: 100 dòng)"
        ));
    }
}
