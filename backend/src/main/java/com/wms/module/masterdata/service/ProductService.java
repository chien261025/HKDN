package com.wms.module.masterdata.service;

import com.wms.module.masterdata.entity.Product;

import java.util.List;

public interface ProductService {
    List<Product> getAllProducts();
    Product getProductByBarcode(String barcode);
    Product getProductBySku(String sku);
    Product createProduct(Product product);
    Product updateProduct(Long id, Product productUpdate);
}
