package com.wms.module.masterdata.controller;

import com.wms.common.response.ApiResponse;
import com.wms.module.masterdata.entity.Product;
import com.wms.module.masterdata.service.ProductService;
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

    private final ProductService productService;

    @GetMapping
    @Operation(summary = "Lấy toàn bộ danh sách sản phẩm", description = "Trả về danh sách SKU, Barcode, Tên hàng hóa, Ngưỡng an toàn")
    public ApiResponse<List<Product>> getAllProducts() {
        return ApiResponse.success("Lấy danh sách sản phẩm thành công!", productService.getAllProducts());
    }

    @GetMapping("/barcode/{barcode}")
    @Operation(summary = "Quét mã vạch Barcode tìm sản phẩm", description = "Dùng cho nhân viên cầm máy quét hoặc camera quét mã trên bao bì")
    public ApiResponse<Product> getProductByBarcode(
            @Parameter(description = "Mã vạch trên bao bì (VD: 8934673123456)", example = "8934673123456")
            @PathVariable String barcode) {
        return ApiResponse.success(productService.getProductByBarcode(barcode));
    }

    @GetMapping("/sku/{sku}")
    @Operation(summary = "Tìm sản phẩm theo mã SKU", description = "VD: SKU-MILK-100, SKU-SAMS-S24")
    public ApiResponse<Product> getProductBySku(
            @Parameter(description = "Mã SKU sản phẩm", example = "SKU-MILK-100")
            @PathVariable String sku) {
        return ApiResponse.success(productService.getProductBySku(sku));
    }

    @PostMapping
    @Operation(summary = "Tạo mới sản phẩm SKU", description = "Đăng ký sản phẩm mới vào danh mục Master Data")
    public ApiResponse<Product> createProduct(@RequestBody Product product) {
        return ApiResponse.success("Tạo mới sản phẩm thành công!", productService.createProduct(product));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật thông tin sản phẩm", description = "Cập nhật tên, mã vạch, đơn vị, định mức an toàn, điểm đặt hàng")
    public ApiResponse<Product> updateProduct(@PathVariable Long id, @RequestBody Product productUpdate) {
        return ApiResponse.success("Cập nhật thông tin sản phẩm thành công!", productService.updateProduct(id, productUpdate));
    }
}
