package com.wms.module.masterdata.service.impl;

import com.wms.common.exception.BusinessException;
import com.wms.common.exception.ErrorCode;
import com.wms.module.masterdata.entity.Supplier;
import com.wms.module.masterdata.repository.SupplierRepository;
import com.wms.module.masterdata.service.SupplierService;
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
public class SupplierServiceImpl implements SupplierService {

    private final SupplierRepository supplierRepository;

    @Override
    @Transactional(readOnly = true)
    public List<Supplier> getAllSuppliers() {
        return supplierRepository.findAll();
    }

    @Override
    public Supplier createSupplier(Supplier supplier) {
        if (supplier.getName() == null || supplier.getName().isBlank()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Tên nhà cung cấp không được để trống!");
        }
        if (supplier.getCode() == null || supplier.getCode().isBlank()) {
            supplier.setCode("SUP-" + System.currentTimeMillis() % 100000);
        }
        supplier.setCreatedAt(Instant.now());
        supplier.setUpdatedAt(Instant.now());
        return supplierRepository.save(supplier);
    }

    @Override
    public Supplier updateSupplier(Long id, Supplier supplierUpdate) {
        Supplier existing = supplierRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy nhà cung cấp với ID: " + id));

        if (supplierUpdate.getName() != null && !supplierUpdate.getName().isBlank()) {
            existing.setName(supplierUpdate.getName());
        }
        if (supplierUpdate.getContactPhone() != null && !supplierUpdate.getContactPhone().isBlank()) {
            existing.setContactPhone(supplierUpdate.getContactPhone());
        }
        if (supplierUpdate.getCode() != null && !supplierUpdate.getCode().isBlank()) {
            existing.setCode(supplierUpdate.getCode());
        }
        existing.setUpdatedAt(Instant.now());
        return supplierRepository.save(existing);
    }
}
