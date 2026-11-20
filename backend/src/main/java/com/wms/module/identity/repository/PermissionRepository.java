package com.wms.module.identity.repository;

import com.wms.module.identity.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PermissionRepository extends JpaRepository<Permission, Integer> {
    Optional<Permission> findByCode(String code);
    List<Permission> findByOrderByModuleAscIdAsc();
}

