package com.wms.module.order.repository;

import com.wms.module.order.entity.PickAllocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PickAllocationRepository extends JpaRepository<PickAllocation, Long> {

    List<PickAllocation> findByOutboundOrderItemId(Long outboundOrderItemId);

    List<PickAllocation> findByLocationIdAndBatchId(Long locationId, Long batchId);

    List<PickAllocation> findByStatus(String status);
}
