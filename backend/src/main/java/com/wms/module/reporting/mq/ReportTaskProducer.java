package com.wms.module.reporting.mq;

import com.wms.module.reporting.dto.message.ReportTaskMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ReportTaskProducer {

    private final RabbitTemplate rabbitTemplate;

    public static final String EXCHANGE = "wms.report.exchange";
    public static final String ROUTING_KEY = "report.generate";

    /**
     * Đẩy tác vụ xuất báo cáo nặng vào RabbitMQ
     */
    public void pushReportTask(ReportTaskMessage task) {
        log.info("Day task xuat bao cao vao RabbitMQ: JobId={}, Type={}", task.getJobId(), task.getReportType());
        rabbitTemplate.convertAndSend(EXCHANGE, ROUTING_KEY, task);
    }
}
