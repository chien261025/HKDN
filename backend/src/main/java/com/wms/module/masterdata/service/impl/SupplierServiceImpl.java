package com.wms.module.masterdata.service.impl;

import com.wms.common.exception.BusinessException;
import com.wms.common.exception.ErrorCode;
import com.wms.module.masterdata.entity.Supplier;
import com.wms.module.masterdata.entity.PartnerRole;
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
        return supplierRepository.findAll().stream()
                .filter(partner -> partner.getPartnerRole() == PartnerRole.SUPPLIER).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Supplier> getAllPartners() {
        return supplierRepository.findAll();
    }

    @Override
    public Supplier createSupplier(Supplier supplier) {
        if (supplier.getPartnerRole() == null) supplier.setPartnerRole(PartnerRole.SUPPLIER);
        if (supplier.getName() == null || supplier.getName().isBlank()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Tên nhà cung cấp không được để trống!");
        }
        if (supplier.getCode() == null || supplier.getCode().isBlank()) {
            supplier.setCode((supplier.getPartnerRole() == PartnerRole.RECEIVER ? "REC-" : "SUP-") + System.currentTimeMillis());
        }
        supplier.setCreatedAt(Instant.now());
        supplier.setUpdatedAt(Instant.now());
        supplier.setIsActive(true);
        return supplierRepository.save(supplier);
    }

    @Override
    public Supplier updateSupplier(Long id, Supplier supplierUpdate) {
        Supplier existing = supplierRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy nhà cung cấp với ID: " + id));

        // A partner's business role is chosen at creation and cannot reclassify existing orders/products.
        existing.setContactPerson(supplierUpdate.getContactPerson() != null ? supplierUpdate.getContactPerson() : existing.getContactPerson());
        existing.setEmail(supplierUpdate.getEmail() != null ? supplierUpdate.getEmail() : existing.getEmail());
        existing.setAddress(supplierUpdate.getAddress() != null ? supplierUpdate.getAddress() : existing.getAddress());
        existing.setSuppliedCategories(supplierUpdate.getSuppliedCategories() != null ? supplierUpdate.getSuppliedCategories() : existing.getSuppliedCategories());

        if (supplierUpdate.getName() != null && !supplierUpdate.getName().isBlank()) {
            existing.setName(supplierUpdate.getName());
        }
        if (supplierUpdate.getContactPhone() != null && !supplierUpdate.getContactPhone().isBlank()) {
            existing.setContactPhone(supplierUpdate.getContactPhone());
        }
        if (supplierUpdate.getCode() != null && !supplierUpdate.getCode().isBlank()) {
            existing.setCode(supplierUpdate.getCode());
        }
        if (supplierUpdate.getIsActive() != null) {
            existing.setIsActive(supplierUpdate.getIsActive());
        }
        existing.setUpdatedAt(Instant.now());
        return supplierRepository.save(existing);
    }

    @Override
    public Supplier updateStatus(Long id, Boolean active) {
        Supplier existing = supplierRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy nhà cung cấp với ID: " + id));
        existing.setIsActive(Boolean.TRUE.equals(active));
        existing.setUpdatedAt(Instant.now());
        return supplierRepository.save(existing);
    }
}
