package com.wms.module.identity.repository;

import com.wms.module.identity.entity.UserWarehouseAccess;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface UserWarehouseAccessRepository extends JpaRepository<UserWarehouseAccess, Long> {
    List<UserWarehouseAccess> findByUserId(Long userId);
    List<UserWarehouseAccess> findByUserIdIn(Collection<Long> userIds);
    void deleteByUserId(Long userId);
}

