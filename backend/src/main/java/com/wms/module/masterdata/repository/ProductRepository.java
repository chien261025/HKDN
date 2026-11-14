package com.wms.module.masterdata.repository;

import com.wms.module.masterdata.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    Optional<Product> findBySkuAndDeletedAtIsNull(String sku);
    Optional<Product> findByBarcodeAndDeletedAtIsNull(String barcode);
    List<Product> findAllByDeletedAtIsNullOrderByCreatedAtDesc();
    List<Product> findAllByOrderByCreatedAtDesc();
}
