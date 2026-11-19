package com.wms.module.masterdata.service.impl;

import com.wms.common.exception.BusinessException;
import com.wms.common.exception.ErrorCode;
import com.wms.module.masterdata.entity.Product;
import com.wms.module.masterdata.repository.ProductRepository;
import com.wms.module.masterdata.repository.SupplierRepository;
import com.wms.module.masterdata.entity.Supplier;
import com.wms.module.masterdata.service.ProductService;
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
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final SupplierRepository supplierRepository;
    private final com.wms.module.inventory.service.WarehouseStockService warehouseStockService;

    @Override
    @Transactional(readOnly = true)
    public List<Product> getAllProducts() {
        java.util.Map<Long, Integer> closing = warehouseStockService.getClosingBalances(true).stream()
                .filter(stock -> Long.valueOf(1L).equals(stock.getWarehouseId()))
                .collect(java.util.stream.Collectors.toMap(
                        com.wms.module.order.dto.response.OutboundStockResponse::getProductId,
                        com.wms.module.order.dto.response.OutboundStockResponse::getOnHandQty));
        List<Product> products = productRepository.findAllByDeletedAtIsNullOrderByCreatedAtDesc();
        products.forEach(product -> product.setCurrentStock(closing.getOrDefault(product.getId(), 0)));
        return products;
    }

    @Override
    @Transactional(readOnly = true)
    public Product getProductByBarcode(String barcode) {
        return productRepository.findByBarcodeAndDeletedAtIsNull(barcode)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy sản phẩm với Barcode: " + barcode));
    }

    @Override
    @Transactional(readOnly = true)
    public Product getProductBySku(String sku) {
        return productRepository.findBySkuAndDeletedAtIsNull(sku)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy sản phẩm với SKU: " + sku));
    }

    @Override
    public Product createProduct(Product product) {
        if (product.getSku() == null || product.getSku().isBlank()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Mã SKU không được để trống!");
        }
        if (productRepository.findBySkuAndDeletedAtIsNull(product.getSku()).isPresent()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Mã SKU đã tồn tại: " + product.getSku());
        }
        validateSupplierForNewProduct(product.getSupplierId());
        if (product.getBarcode() == null || product.getBarcode().isBlank()) {
            product.setBarcode("893" + System.currentTimeMillis());
        }
        product.setCreatedAt(Instant.now());
        product.setUpdatedAt(Instant.now());
        return productRepository.save(product);
    }

    @Override
    public Product updateProduct(Long id, Product productUpdate) {
        Product existing = productRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy sản phẩm với ID: " + id));

        if (productUpdate.getName() != null && !productUpdate.getName().isBlank()) {
            existing.setName(productUpdate.getName());
        }
        if (productUpdate.getDescription() != null) {
            existing.setDescription(productUpdate.getDescription());
        }
        if (productUpdate.getBarcode() != null && !productUpdate.getBarcode().isBlank()) {
            existing.setBarcode(productUpdate.getBarcode());
        }
        if (productUpdate.getUnit() != null && !productUpdate.getUnit().isBlank()) {
            existing.setUnit(productUpdate.getUnit());
        }
        if (productUpdate.getBrand() != null) {
            existing.setBrand(productUpdate.getBrand());
        }
        if (productUpdate.getOrigin() != null) {
            existing.setOrigin(productUpdate.getOrigin());
        }
        if (productUpdate.getImageUrl() != null) {
            existing.setImageUrl(productUpdate.getImageUrl());
        }
        if (productUpdate.getStorageCondition() != null) {
            existing.setStorageCondition(productUpdate.getStorageCondition());
        }
        if (productUpdate.getWeightKg() != null) {
            existing.setWeightKg(productUpdate.getWeightKg());
        }
        if (productUpdate.getLengthCm() != null) {
            existing.setLengthCm(productUpdate.getLengthCm());
        }
        if (productUpdate.getWidthCm() != null) {
            existing.setWidthCm(productUpdate.getWidthCm());
        }
        if (productUpdate.getHeightCm() != null) {
            existing.setHeightCm(productUpdate.getHeightCm());
        }
        if (productUpdate.getSafetyStock() != null) {
            existing.setSafetyStock(productUpdate.getSafetyStock());
        }
        if (productUpdate.getReorderPoint() != null) {
            existing.setReorderPoint(productUpdate.getReorderPoint());
        }
        if (productUpdate.getMaxStock() != null) {
            existing.setMaxStock(productUpdate.getMaxStock());
        }
        if (productUpdate.getPurchasePrice() != null) {
            existing.setPurchasePrice(productUpdate.getPurchasePrice());
        }
        if (productUpdate.getSellingPrice() != null) {
            existing.setSellingPrice(productUpdate.getSellingPrice());
        }
        if (productUpdate.getBusinessStatus() != null) {
            existing.setBusinessStatus(productUpdate.getBusinessStatus());
        }
        if (productUpdate.getCategoryId() != null) {
            existing.setCategoryId(productUpdate.getCategoryId());
        }
        if (productUpdate.getSupplierId() != null && !productUpdate.getSupplierId().equals(existing.getSupplierId())) {
            validateSupplierForNewProduct(productUpdate.getSupplierId());
            existing.setSupplierId(productUpdate.getSupplierId());
        }
        if (productUpdate.getIsActive() != null) {
            existing.setIsActive(productUpdate.getIsActive());
        }
        existing.setUpdatedAt(Instant.now());
        return productRepository.save(existing);
    }

    @Override
    public Product updateStatus(Long id, Boolean active) {
        Product product = findProduct(id);
        product.setIsActive(Boolean.TRUE.equals(active));
        product.setUpdatedAt(Instant.now());
        return productRepository.save(product);
    }

    @Override
    public Product softDelete(Long id) {
        Product product = findProduct(id);
        product.setDeletedAt(Instant.now());
        product.setUpdatedAt(Instant.now());
        return productRepository.save(product);
    }

    @Override
    public Product restore(Long id) {
        Product product = findProduct(id);
        product.setDeletedAt(null);
        product.setIsActive(true);
        product.setUpdatedAt(Instant.now());
        return productRepository.save(product);
    }

    private Product findProduct(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy sản phẩm với ID: " + id));
    }

    private void validateSupplierForNewProduct(Long supplierId) {
        if (supplierId == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Sản phẩm phải thuộc một nhà cung cấp");
        }
        Supplier supplier = supplierRepository.findById(supplierId)
                .orElseThrow(() -> new BusinessException(ErrorCode.BAD_REQUEST, "Nhà cung cấp không tồn tại!"));
        if (!Boolean.TRUE.equals(supplier.getIsActive())) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Không thể thêm sản phẩm từ nhà cung cấp đang ngưng hợp tác!");
        }
    }
}
