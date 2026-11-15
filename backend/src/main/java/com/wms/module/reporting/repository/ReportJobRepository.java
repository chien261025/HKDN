package com.wms.module.reporting.repository;

import com.wms.module.reporting.entity.ReportJob;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReportJobRepository extends JpaRepository<ReportJob, String> {
    List<ReportJob> findAllByOrderByCreatedAtDesc();
}
