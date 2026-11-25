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
        List<Supplier> suppliers = supplierRepository.findAllByOrderByCreatedAtDesc();
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
        supplier.setName(supplier.getName().trim());
        if (supplier.getCode() == null || supplier.getCode().isBlank()) {
            supplier.setCode("SUP-" + (System.currentTimeMillis() % 100000));
        } else {
            String normalizedCode = supplier.getCode().trim().toUpperCase();
            if (supplierRepository.findByCodeIgnoreCase(normalizedCode).isPresent()) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, "Mã nhà cung cấp đã tồn tại: " + normalizedCode);
            }
            supplier.setCode(normalizedCode);
        }

        if (supplier.getCategories() != null && !supplier.getCategories().isEmpty()) {
            Set<Category> resolved = new HashSet<>();
            for (Category c : supplier.getCategories()) {
                Category found = resolveCategory(c);
                if (found != null) {
                    if (found.getDeletedAt() != null || !Boolean.TRUE.equals(found.getIsActive())) {
                        throw new BusinessException(ErrorCode.BAD_REQUEST,
                                "Không thể liên kết danh mục '" + found.getName() + "' đang ngưng hoạt động hoặc đã xóa!");
                    }
                    resolved.add(found);
                }
            }
            supplier.setCategories(resolved);
        }

        supplier.setCreatedAt(Instant.now());
        supplier.setUpdatedAt(Instant.now());
        supplier.setIsActive(supplier.getIsActive() == null ? Boolean.TRUE : supplier.getIsActive());
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
                    "Mã nhà cung cấp (" + existing.getCode() + ") là mã cố định, không được phép thay đổi!");
        }

        if (supplierUpdate.getName() != null) {
            if (supplierUpdate.getName().isBlank()) {
                throw new BusinessException(ErrorCode.BAD_REQUEST, "Tên nhà cung cấp không được để trống!");
            }
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
            Set<Long> existingCategoryIds = existing.getCategories() == null
                    ? Set.of()
                    : existing.getCategories().stream().map(Category::getId).collect(java.util.stream.Collectors.toSet());
            Set<Category> resolved = new HashSet<>();
            for (Category c : supplierUpdate.getCategories()) {
                Category found = resolveCategory(c);
                if (found != null) {
                    boolean wasAlreadyLinked = existingCategoryIds.contains(found.getId());
                    if (!wasAlreadyLinked && (found.getDeletedAt() != null || !Boolean.TRUE.equals(found.getIsActive()))) {
                        throw new BusinessException(ErrorCode.BAD_REQUEST,
                                "Không thể gán thêm danh mục '" + found.getName() + "' đang ngưng hoạt động hoặc đã xóa!");
                    }
                    resolved.add(found);
                }
            }
            existing.setCategories(resolved);
        }

        existing.setUpdatedAt(Instant.now());
        Supplier saved = supplierRepository.save(existing);
        saved.setActiveProductsCount((int) productRepository.countBySupplierIdAndDeletedAtIsNull(saved.getId()));
        return saved;
    }

    private Category resolveCategory(Category c) {
        if (c == null) return null;
        if (c.getId() != null) {
            return categoryRepository.findById(c.getId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.BAD_REQUEST, "Danh mục không tồn tại với ID: " + c.getId()));
        }
        if (c.getCode() != null && !c.getCode().isBlank()) {
            return categoryRepository.findByCodeIgnoreCase(c.getCode().trim())
                    .orElseThrow(() -> new BusinessException(ErrorCode.BAD_REQUEST, "Danh mục không tồn tại với mã: " + c.getCode()));
        }
        return null;
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
