package com.wms.module.masterdata.service.impl;

import com.wms.common.exception.BusinessException;
import com.wms.common.exception.ErrorCode;
import com.wms.module.masterdata.entity.Category;
import com.wms.module.masterdata.entity.Supplier;
import com.wms.module.masterdata.repository.CategoryRepository;
import com.wms.module.masterdata.repository.ProductRepository;
import com.wms.module.masterdata.repository.SupplierRepository;
import com.wms.module.masterdata.service.SupplierService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class SupplierServiceImpl implements SupplierService {

    private final SupplierRepository supplierRepository;
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    @Override
    @Transactional(readOnly = true)
    public List<Supplier> getAllSuppliers() {
        List<Supplier> suppliers = supplierRepository.findAll();
        for (Supplier s : suppliers) {
            s.setActiveProductsCount((int) productRepository.countBySupplierIdAndDeletedAtIsNull(s.getId()));
        }
        return suppliers;
    }

    @Override
    public Supplier createSupplier(Supplier supplier) {
        if (supplier.getName() == null || supplier.getName().isBlank()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Tên nhà cung cấp không được để trống!");
        }
        if (supplier.getCode() == null || supplier.getCode().isBlank()) {
            supplier.setCode("SUP-" + (System.currentTimeMillis() % 100000));
        } else {
            supplier.setCode(supplier.getCode().trim().toUpperCase());
            if (supplierRepository.findByCode(supplier.getCode()).isPresent()) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, "Mã nhà cung cấp đã tồn tại: " + supplier.getCode());
            }
        }

        if (supplier.getCategories() != null && !supplier.getCategories().isEmpty()) {
            Set<Category> resolved = new HashSet<>();
            for (Category c : supplier.getCategories()) {
                if (c.getId() != null) {
                    categoryRepository.findById(c.getId()).ifPresent(resolved::add);
                } else if (c.getCode() != null) {
                    categoryRepository.findByCode(c.getCode()).ifPresent(resolved::add);
                }
            }
            supplier.setCategories(resolved);
        }

        supplier.setCreatedAt(Instant.now());
        supplier.setUpdatedAt(Instant.now());
        supplier.setIsActive(true);
        Supplier saved = supplierRepository.save(supplier);
        saved.setActiveProductsCount(0);
        return saved;
    }

    @Override
    public Supplier updateSupplier(Long id, Supplier supplierUpdate) {
        Supplier existing = supplierRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy nhà cung cấp với ID: " + id));

        // Enterprise Rule (Issue 3): Mã nhà cung cấp (Code) là mã định danh nghiệp vụ cố định,
        // tuyệt đối KHÔNG cho phép thay đổi để bảo toàn lịch sử PO, phiếu nhập kho Inbound và chứng từ kế toán.
        if (supplierUpdate.getCode() != null && !supplierUpdate.getCode().isBlank()
                && !supplierUpdate.getCode().trim().equalsIgnoreCase(existing.getCode())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST,
                    "Mã nhà cung cấp (Code: " + existing.getCode() + ") là mã định danh nghiệp vụ cố định, không được phép thay đổi!");
        }

        if (supplierUpdate.getName() != null && !supplierUpdate.getName().isBlank()) {
            existing.setName(supplierUpdate.getName().trim());
        }
        if (supplierUpdate.getContactPerson() != null) {
            existing.setContactPerson(supplierUpdate.getContactPerson().trim());
        }
        if (supplierUpdate.getContactPhone() != null) {
            existing.setContactPhone(supplierUpdate.getContactPhone().trim());
        }
        if (supplierUpdate.getEmail() != null) {
            existing.setEmail(supplierUpdate.getEmail().trim());
        }
        if (supplierUpdate.getAddress() != null) {
            existing.setAddress(supplierUpdate.getAddress().trim());
        }
        if (supplierUpdate.getIsActive() != null) {
            existing.setIsActive(supplierUpdate.getIsActive());
        }

        if (supplierUpdate.getCategories() != null) {
            Set<Category> resolved = new HashSet<>();
            for (Category c : supplierUpdate.getCategories()) {
                if (c.getId() != null) {
                    categoryRepository.findById(c.getId()).ifPresent(resolved::add);
                } else if (c.getCode() != null) {
                    categoryRepository.findByCode(c.getCode()).ifPresent(resolved::add);
                }
            }
            existing.setCategories(resolved);
        }

        existing.setUpdatedAt(Instant.now());
        Supplier saved = supplierRepository.save(existing);
        saved.setActiveProductsCount((int) productRepository.countBySupplierIdAndDeletedAtIsNull(saved.getId()));
        return saved;
    }

    @Override
    public Supplier updateStatus(Long id, Boolean active) {
        Supplier existing = supplierRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy nhà cung cấp với ID: " + id));
        existing.setIsActive(Boolean.TRUE.equals(active));
        existing.setUpdatedAt(Instant.now());
        Supplier saved = supplierRepository.save(existing);
        saved.setActiveProductsCount((int) productRepository.countBySupplierIdAndDeletedAtIsNull(saved.getId()));
        return saved;
    }
}
