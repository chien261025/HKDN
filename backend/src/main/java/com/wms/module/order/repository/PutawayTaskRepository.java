package com.wms.module.order.repository;

import com.wms.module.order.entity.PutawayTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PutawayTaskRepository extends JpaRepository<PutawayTask, Long> {
    Optional<PutawayTask> findByTaskCode(String taskCode);
    List<PutawayTask> findByStatus(String status);
    List<PutawayTask> findByAssignedToAndStatus(Long assignedTo, String status);
}
