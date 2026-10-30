package com.wms.module.masterdata.controller;

import com.wms.common.response.ApiResponse;
import com.wms.module.masterdata.entity.Supplier;
import com.wms.module.masterdata.service.SupplierService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/masterdata/suppliers")
@RequiredArgsConstructor
@Tag(name = "3. Master Data - Nhà Cung Cấp (Suppliers)", description = "APIs quản lý thông tin đối tác cung cấp hàng hóa cho kho")
public class SupplierController {

    private final SupplierService supplierService;

    @GetMapping
    @Operation(summary = "Lấy danh sách nhà cung cấp", description = "Trả về danh sách tất cả các đối tác nhà cung ứng")
    public ApiResponse<List<Supplier>> getAllSuppliers() {
        return ApiResponse.success("Lấy danh sách nhà cung cấp thành công!", supplierService.getAllSuppliers());
    }

    @PostMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER')")
    @Operation(summary = "Tạo mới nhà cung cấp", description = "Đăng ký thông tin nhà cung ứng mới vào hệ thống")
    public ApiResponse<Supplier> createSupplier(@RequestBody Supplier supplier) {
        return ApiResponse.success("Tạo nhà cung cấp thành công!", supplierService.createSupplier(supplier));
    }

    @PutMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER')")
    @Operation(summary = "Cập nhật thông tin nhà cung cấp", description = "Cập nhật tên, mã, số điện thoại liên hệ của đối tác")
    public ApiResponse<Supplier> updateSupplier(@PathVariable Long id, @RequestBody Supplier supplierUpdate) {
        return ApiResponse.success("Cập nhật nhà cung cấp thành công!", supplierService.updateSupplier(id, supplierUpdate));
    }
}
