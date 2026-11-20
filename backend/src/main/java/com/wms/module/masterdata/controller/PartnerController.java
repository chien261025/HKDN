package com.wms.module.masterdata.controller;

import com.wms.common.response.ApiResponse;
import com.wms.module.masterdata.entity.Supplier;
import com.wms.module.masterdata.service.SupplierService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/masterdata/partners")
@RequiredArgsConstructor
public class PartnerController {
    private final SupplierService supplierService;

    @GetMapping
    public ApiResponse<List<Supplier>> getPartners() {
        return ApiResponse.success(supplierService.getAllPartners());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER')")
    public ApiResponse<Supplier> createPartner(@RequestBody Supplier partner) {
        return ApiResponse.success(supplierService.createSupplier(partner));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER')")
    public ApiResponse<Supplier> updatePartner(@PathVariable Long id, @RequestBody Supplier partner) {
        return ApiResponse.success(supplierService.updateSupplier(id, partner));
    }
}
