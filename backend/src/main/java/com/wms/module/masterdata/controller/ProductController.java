package com.wms.module.masterdata.controller;

import com.wms.common.exception.BusinessException;
import com.wms.common.exception.ErrorCode;
import com.wms.common.response.ApiResponse;
import com.wms.module.masterdata.entity.Product;
import com.wms.module.masterdata.repository.ProductRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/masterdata/products")
@RequiredArgsConstructor
@Tag(name = "3. Master Data - Sản phẩm & Hàng hóa (Products)", description = "APIs quản lý SKU, mã vạch Barcode, đơn vị tính, mức tồn an toàn")
public class ProductController {

    private final ProductRepository productRepository;

    @GetMapping
    @Operation(summary = "Lấy toàn bộ danh sách sản phẩm", description = "Trả về danh sách SKU, Barcode, Tên hàng hóa, Ngưỡng an toàn")
    public ApiResponse<List<Product>> getAllProducts() {
        List<Product> products = productRepository.findAll();
        return ApiResponse.success("Lấy danh sách sản phẩm thành công!", products);
    }

    @GetMapping("/barcode/{barcode}")
    @Operation(summary = "Quét mã vạch Barcode tìm sản phẩm", description = "Dùng cho nhân viên cầm máy quét hoặc camera quét mã trên bao bì")
    public ApiResponse<Product> getProductByBarcode(
            @Parameter(description = "Mã vạch trên bao bì (VD: 8934673123456)", example = "8934673123456")
            @PathVariable String barcode) {
        Product product = productRepository.findByBarcode(barcode)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy sản phẩm với Barcode: " + barcode));
        return ApiResponse.success(product);
    }

    @GetMapping("/sku/{sku}")
    @Operation(summary = "Tìm sản phẩm theo mã SKU", description = "VD: SKU-MILK-100, SKU-SAMS-S24")
    public ApiResponse<Product> getProductBySku(
            @Parameter(description = "Mã SKU sản phẩm", example = "SKU-MILK-100")
            @PathVariable String sku) {
        Product product = productRepository.findBySku(sku)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy sản phẩm với SKU: " + sku));
        return ApiResponse.success(product);
    }

    @PostMapping
    @Operation(summary = "Tạo mới sản phẩm SKU", description = "Đăng ký sản phẩm mới vào danh mục Master Data")
    public ApiResponse<Product> createProduct(@RequestBody Product product) {
        if (product.getSku() == null || product.getSku().isBlank()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Mã SKU không được để trống!");
        }
        if (productRepository.findBySku(product.getSku()).isPresent()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Mã SKU đã tồn tại: " + product.getSku());
        }
        if (product.getBarcode() == null || product.getBarcode().isBlank()) {
            product.setBarcode("893" + System.currentTimeMillis());
        }
        product.setCreatedAt(java.time.Instant.now());
        product.setUpdatedAt(java.time.Instant.now());
        Product saved = productRepository.save(product);
        return ApiResponse.success("Tạo mới sản phẩm thành công!", saved);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật thông tin sản phẩm", description = "Cập nhật tên, mã vạch, đơn vị, định mức an toàn, điểm đặt hàng")
    public ApiResponse<Product> updateProduct(@PathVariable Long id, @RequestBody Product productUpdate) {
        Product existing = productRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy sản phẩm với ID: " + id));
        if (productUpdate.getName() != null && !productUpdate.getName().isBlank()) {
            existing.setName(productUpdate.getName());
        }
        if (productUpdate.getBarcode() != null && !productUpdate.getBarcode().isBlank()) {
            existing.setBarcode(productUpdate.getBarcode());
        }
        if (productUpdate.getUnit() != null && !productUpdate.getUnit().isBlank()) {
            existing.setUnit(productUpdate.getUnit());
        }
        if (productUpdate.getSafetyStock() != null) {
            existing.setSafetyStock(productUpdate.getSafetyStock());
        }
        if (productUpdate.getReorderPoint() != null) {
            existing.setReorderPoint(productUpdate.getReorderPoint());
        }
        if (productUpdate.getCategoryId() != null) {
            existing.setCategoryId(productUpdate.getCategoryId());
        }
        existing.setUpdatedAt(java.time.Instant.now());
        Product saved = productRepository.save(existing);
        return ApiResponse.success("Cập nhật thông tin sản phẩm thành công!", saved);
    }
}
