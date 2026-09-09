package com.wms.module.reporting.mq;

import com.wms.module.reporting.dto.message.ReportTaskMessage;
import com.wms.module.reporting.service.ExcelStreamingWorker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.io.File;

@Slf4j
@Component
@RequiredArgsConstructor
public class ReportTaskConsumer {

    private final ExcelStreamingWorker excelStreamingWorker;

    /**
     * Lắng nghe và tiêu thụ các task xuất file nặng từ RabbitMQ Queue
     */
    @RabbitListener(queues = "wms.report.task.queue")
    public void consumeReportTask(ReportTaskMessage task) {
        log.info("Consumer nhan task tu RabbitMQ: JobId={}", task.getJobId());

        try {
            // 1. Chạy worker sinh file Excel lớn bằng Streaming
            File generatedFile = excelStreamingWorker.generateLargeInventoryReport(task.getJobId());

            // 2. Upload file lên MinIO S3 (Giả lập)
            log.info("Da day file len MinIO bucket 'wms-reports' cho Job: {}", task.getJobId());

            // 3. Xóa file tạm
            if (generatedFile.exists()) {
                generatedFile.delete();
            }

            log.info("Hoan tat toan bo quy trinh Job: {}", task.getJobId());

        } catch (Exception e) {
            log.error("Loi khi xu ly task xuat bao cao: {}", e.getMessage(), e);
        }
    }
}
