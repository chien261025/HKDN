package com.wms.module.masterdata.service.impl;

import com.wms.common.exception.BusinessException;
import com.wms.common.exception.ErrorCode;
import com.wms.module.masterdata.entity.Product;
import com.wms.module.masterdata.repository.ProductRepository;
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

    @Override
    @Transactional(readOnly = true)
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public Product getProductByBarcode(String barcode) {
        return productRepository.findByBarcode(barcode)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy sản phẩm với Barcode: " + barcode));
    }

    @Override
    @Transactional(readOnly = true)
    public Product getProductBySku(String sku) {
        return productRepository.findBySku(sku)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy sản phẩm với SKU: " + sku));
    }

    @Override
    public Product createProduct(Product product) {
        if (product.getSku() == null || product.getSku().isBlank()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Mã SKU không được để trống!");
        }
        if (productRepository.findBySku(product.getSku()).isPresent()) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "Mã SKU đã tồn tại: " + product.getSku());
        }
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
        existing.setUpdatedAt(Instant.now());
        return productRepository.save(existing);
    }
}
