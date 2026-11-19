package com.wms.module.masterdata.service.impl;

import com.wms.common.exception.BusinessException;
import com.wms.common.exception.ErrorCode;
import com.wms.module.masterdata.entity.Warehouse;
import com.wms.module.masterdata.repository.WarehouseRepository;
import com.wms.module.masterdata.service.WarehouseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class WarehouseServiceImpl implements WarehouseService {

    private final WarehouseRepository warehouseRepository;

    @Override
    @Transactional(readOnly = true)
    public List<Warehouse> getAllWarehouses() {
        return warehouseRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public Warehouse getWarehouseById(Long id) {
        return warehouseRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy kho hàng với ID: " + id));
    }

    @Override
    public Warehouse createWarehouse(Warehouse warehouse) {
        if (warehouse.getName() == null || warehouse.getName().isBlank()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Tên kho hàng không được để trống!");
        }
        if (warehouse.getCode() == null || warehouse.getCode().isBlank()) {
            warehouse.setCode("WH" + String.format("%02d", warehouseRepository.count() + 1));
        } else {
            if (warehouseRepository.findByCode(warehouse.getCode()).isPresent()) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, "Mã kho hàng đã tồn tại: " + warehouse.getCode());
            }
        }
        warehouse.setCreatedAt(Instant.now());
        warehouse.setUpdatedAt(Instant.now());
        if (warehouse.getIsActive() == null) {
            warehouse.setIsActive(true);
        }
        return warehouseRepository.save(warehouse);
    }

    @Override
    public Warehouse updateWarehouse(Long id, Warehouse warehouseUpdate) {
        Warehouse existing = getWarehouseById(id);
        if (warehouseUpdate.getName() != null && !warehouseUpdate.getName().isBlank()) {
            existing.setName(warehouseUpdate.getName());
        }
        if (warehouseUpdate.getAddress() != null) {
            existing.setAddress(warehouseUpdate.getAddress());
        }
        if (warehouseUpdate.getContactPhone() != null) {
            existing.setContactPhone(warehouseUpdate.getContactPhone());
        }
        if (warehouseUpdate.getTrustedIps() != null) {
            existing.setTrustedIps(warehouseUpdate.getTrustedIps());
        }
        if (warehouseUpdate.getIsActive() != null) {
            existing.setIsActive(warehouseUpdate.getIsActive());
        }
        existing.setUpdatedAt(Instant.now());
        return warehouseRepository.save(existing);
    }

    @Override
    public Warehouse updateStatus(Long id, Boolean active) {
        Warehouse existing = getWarehouseById(id);
        existing.setIsActive(active);
        existing.setUpdatedAt(Instant.now());
        return warehouseRepository.save(existing);
    }
}

