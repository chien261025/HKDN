package com.wms.module.masterdata.controller;

import com.wms.common.response.ApiResponse;
import com.wms.module.masterdata.entity.Category;
import com.wms.module.masterdata.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/masterdata/categories")
@RequiredArgsConstructor
public class CategoryController {
    private final CategoryService categoryService;

    @GetMapping public ApiResponse<List<Category>> getAll() {
        return ApiResponse.success("Lấy danh sách danh mục thành công!", categoryService.getAllCategories());
    }
    @PostMapping @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER')")
    public ApiResponse<Category> create(@RequestBody Category category) { return ApiResponse.success(categoryService.createCategory(category)); }
    @PutMapping("/{id}") @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER')")
    public ApiResponse<Category> update(@PathVariable Long id, @RequestBody Category category) { return ApiResponse.success(categoryService.updateCategory(id, category)); }
    @PatchMapping("/{id}/status") @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER')")
    public ApiResponse<Category> status(@PathVariable Long id, @RequestBody Map<String, Boolean> body) { return ApiResponse.success(categoryService.updateStatus(id, body.getOrDefault("isActive", true))); }
    @DeleteMapping("/{id}") @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER')")
    public ApiResponse<Category> delete(@PathVariable Long id) { return ApiResponse.success(categoryService.softDelete(id)); }
    @PostMapping("/{id}/restore") @PreAuthorize("hasAnyRole('ADMIN', 'WAREHOUSE_MANAGER')")
    public ApiResponse<Category> restore(@PathVariable Long id) { return ApiResponse.success(categoryService.restore(id)); }
}
