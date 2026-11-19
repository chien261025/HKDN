package com.wms.module.masterdata.service.impl;

import com.wms.module.masterdata.entity.Product;
import com.wms.module.masterdata.entity.Supplier;
import com.wms.module.masterdata.repository.ProductRepository;
import com.wms.module.masterdata.repository.SupplierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

/** Assign suppliers only to known demo SKUs created before supplier_id existed. */
@Component
@RequiredArgsConstructor
public class LegacyProductSupplierBackfill implements ApplicationRunner {
    private static final Map<String, String> SUPPLIER_BY_SKU = Map.ofEntries(
            Map.entry("SKU-MILK-100", "SUP-VINAMILK"),
            Map.entry("SKU-YOGURT-04", "SUP-VINAMILK"),
            Map.entry("SKU-SAMS-S24", "SUP-SAMSUNG"),
            Map.entry("SKU-OMO-MATIC", "SUP-UNILEVER"),
            Map.entry("SKU-COMFORT-3", "SUP-UNILEVER"),
            Map.entry("SKU-SUNSILK-6", "SUP-UNILEVER"),
            Map.entry("SKU-CHINSU-500", "SUP-MASAN"),
            Map.entry("SKU-MAGGI-700", "SUP-MASAN"),
            Map.entry("SKU-BEER-330", "SUP-HEINEKEN"),
            Map.entry("SKU-WATER-500", "SUP-NESTLE"),
            Map.entry("SKU-COF-G7", "SUP-TRUNGNGUYEN"),
            Map.entry("SKU-COCA-330", "SUP-COCACOLA"),
            Map.entry("SKU-TEA-TH", "SUP-TH"),
            Map.entry("SKU-APPL-IP16", "SUP-APPLE"),
            Map.entry("SKU-APPL-AIRP", "SUP-APPLE")
    );

    private final ProductRepository productRepository;
    private final SupplierRepository supplierRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        for (Product product : productRepository.findAll()) {
            if (product.getSupplierId() != null) continue;
            String supplierCode = SUPPLIER_BY_SKU.get(product.getSku());
            if (supplierCode == null) continue;
            Supplier supplier = supplierRepository.findByCode(supplierCode).orElseGet(() ->
                    supplierRepository.save(Supplier.builder()
                            .code(supplierCode)
                            .name(switch (supplierCode) {
                                case "SUP-COCACOLA" -> "Coca-Cola Việt Nam";
                                case "SUP-TH" -> "TH True Milk";
                                case "SUP-APPLE" -> "Apple Việt Nam";
                                default -> supplierCode;
                            })
                            .build()));
            product.setSupplierId(supplier.getId());
            productRepository.save(product);
        }
    }
}
