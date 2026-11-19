package com.wms.module.masterdata.service;

import com.wms.module.masterdata.entity.Warehouse;

import java.util.List;

public interface WarehouseService {
    List<Warehouse> getAllWarehouses();
    Warehouse getWarehouseById(Long id);
    Warehouse createWarehouse(Warehouse warehouse);
    Warehouse updateWarehouse(Long id, Warehouse warehouseUpdate);
    Warehouse updateStatus(Long id, Boolean active);
}

