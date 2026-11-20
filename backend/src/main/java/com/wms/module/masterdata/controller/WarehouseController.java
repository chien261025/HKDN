package com.wms.module.masterdata.controller;

import com.wms.common.response.ApiResponse;
import com.wms.module.masterdata.entity.Warehouse;
import com.wms.module.masterdata.service.WarehouseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/masterdata/warehouses")
@RequiredArgsConstructor
@Tag(name = "3. Master Data - Chi Nhánh Kho Hàng (Warehouses)", description = "APIs quản lý mạng lưới kho tổng, kho phân phối, kho trung chuyển")
public class WarehouseController {

    private final WarehouseService warehouseService;

    @GetMapping
    @Operation(summary = "Lấy toàn bộ danh sách kho hàng", description = "Trả về danh sách tất cả các chi nhánh kho trong hệ thống")
    public ApiResponse<List<Warehouse>> getAllWarehouses() {
        return ApiResponse.success("Lấy danh sách chi nhánh kho thành công!", warehouseService.getAllWarehouses());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Xem chi tiết một kho hàng theo ID")
    public ApiResponse<Warehouse> getWarehouseById(@PathVariable Long id) {
        return ApiResponse.success("Lấy thông tin kho thành công!", warehouseService.getWarehouseById(id));
    }

    @PostMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER')")
    @Operation(summary = "Khai báo chi nhánh kho mới", description = "Thêm kho mới vào hệ thống chuỗi cung ứng")
    public ApiResponse<Warehouse> createWarehouse(@RequestBody Warehouse warehouse) {
        return ApiResponse.success("Khai báo kho mới thành công!", warehouseService.createWarehouse(warehouse));
    }

    @PutMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER')")
    @Operation(summary = "Cập nhật thông tin chi nhánh kho")
    public ApiResponse<Warehouse> updateWarehouse(@PathVariable Long id, @RequestBody Warehouse warehouseUpdate) {
        return ApiResponse.success("Cập nhật thông tin kho thành công!", warehouseService.updateWarehouse(id, warehouseUpdate));
    }

    @PatchMapping("/{id}/status")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER')")
    public ApiResponse<Warehouse> updateWarehouseStatus(@PathVariable Long id, @RequestBody Map<String, Boolean> body) {
        return ApiResponse.success("Cập nhật trạng thái kho thành công!", warehouseService.updateStatus(id, body.getOrDefault("isActive", true)));
    }
}

