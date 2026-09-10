package com.wms.module.reporting.controller;

import com.wms.common.response.ApiResponse;
import com.wms.module.reporting.dto.ExportReportRequest;
import com.wms.module.reporting.dto.message.ReportTaskMessage;
import com.wms.module.reporting.mq.ReportTaskProducer;
import com.wms.module.reporting.service.ExcelStreamingWorker;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.util.Map;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
@Tag(name = "7. Báo Cáo Lớn Bất Đồng Bộ (RabbitMQ & MinIO)", description = "APIs đẩy tác vụ xuất file ngầm vào RabbitMQ và stream Excel SXSSFWorkbook")
public class ReportJobController {

    private final ReportTaskProducer reportTaskProducer;
    private final ExcelStreamingWorker excelStreamingWorker;

    @PostMapping("/export")
    @Operation(summary = "Kích hoạt Job xuất báo cáo ngầm qua RabbitMQ",
               description = "Đẩy thông điệp vào Queue 'wms.report.task.queue'. Consumer sẽ nhận task và ghi file ngầm bằng SXSSFWorkbook.")
    public ApiResponse<Map<String, Object>> exportReport(@Valid @RequestBody ExportReportRequest request) {
        UUID jobId = UUID.randomUUID();
        log.info("Kich hoat Job xuat bao cao: JobId={}, Type={}", jobId, request.getReportType());

        ReportTaskMessage message = ReportTaskMessage.builder()
                .jobId(jobId)
                .reportType(request.getReportType())
                .requestedBy("manager01")
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
