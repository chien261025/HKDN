package com.wms.module.masterdata.service;

import com.wms.module.masterdata.entity.Supplier;

import java.util.List;

public interface SupplierService {
    List<Supplier> getAllSuppliers();
    Supplier createSupplier(Supplier supplier);
    Supplier updateSupplier(Long id, Supplier supplierUpdate);
}
