package com.wms.module.masterdata.controller;

import com.wms.common.exception.BusinessException;
import com.wms.common.exception.ErrorCode;
import com.wms.common.response.ApiResponse;
import com.wms.module.masterdata.entity.Supplier;
import com.wms.module.masterdata.repository.SupplierRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/masterdata/suppliers")
@RequiredArgsConstructor
@Tag(name = "3. Master Data - Nhà Cung Cấp (Suppliers)", description = "APIs quản lý thông tin đối tác cung cấp hàng hóa cho kho")
public class SupplierController {

    private final SupplierRepository supplierRepository;

    @GetMapping
    @Operation(summary = "Lấy danh sách nhà cung cấp", description = "Trả về danh sách tất cả các đối tác nhà cung ứng")
    public ApiResponse<List<Supplier>> getAllSuppliers() {
        List<Supplier> suppliers = supplierRepository.findAll();
        return ApiResponse.success("Lấy danh sách nhà cung cấp thành công!", suppliers);
    }

    @PostMapping
    @Operation(summary = "Tạo mới nhà cung cấp", description = "Đăng ký thông tin nhà cung ứng mới vào hệ thống")
    public ApiResponse<Supplier> createSupplier(@RequestBody Supplier supplier) {
        if (supplier.getName() == null || supplier.getName().isBlank()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Tên nhà cung cấp không được để trống!");
        }
        if (supplier.getCode() == null || supplier.getCode().isBlank()) {
            supplier.setCode("SUP-" + System.currentTimeMillis() % 100000);
        }
        supplier.setCreatedAt(Instant.now());
        supplier.setUpdatedAt(Instant.now());
        Supplier saved = supplierRepository.save(supplier);
        return ApiResponse.success("Tạo nhà cung cấp thành công!", saved);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật thông tin nhà cung cấp", description = "Cập nhật tên, mã, số điện thoại liên hệ của đối tác")
    public ApiResponse<Supplier> updateSupplier(@PathVariable Long id, @RequestBody Supplier supplierUpdate) {
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
        Supplier saved = supplierRepository.save(existing);
        return ApiResponse.success("Cập nhật nhà cung cấp thành công!", saved);
    }
}
