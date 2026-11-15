package com.wms.module.reporting.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "wms_report_job")
@Getter
@Setter
@NoArgsConstructor
public class ReportJob {
    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "report_name", nullable = false, length = 100)
    private String reportName;

    @Column(nullable = false, length = 30)
    private String status = "PENDING";

    @Column(name = "download_url")
    private String downloadUrl;

    @Column(name = "error_message")
    private String errorMessage;

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();

    @Column(name = "completed_at")
    private Instant completedAt;
}
