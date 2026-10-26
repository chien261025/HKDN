package com.wms.module.masterdata.service.impl;

import com.wms.common.exception.BusinessException;
import com.wms.common.exception.ErrorCode;
import com.wms.module.inventory.repository.InventoryRepository;
import com.wms.module.inventory.repository.ProductBatchRepository;
import com.wms.module.masterdata.dto.LocationOccupancyDto;
import com.wms.module.masterdata.entity.Location;
import com.wms.module.masterdata.entity.Product;
import com.wms.module.masterdata.repository.LocationRepository;
import com.wms.module.masterdata.repository.ProductRepository;
import com.wms.module.masterdata.service.LocationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LocationServiceImpl implements LocationService {

    private final LocationRepository locationRepository;
    private final InventoryRepository inventoryRepository;
    private final ProductRepository productRepository;
    private final ProductBatchRepository productBatchRepository;

    @Override
    public List<Location> getAllLocations() {
        return locationRepository.findAll();
    }

    @Override
    public List<Location> getLocationsByZone(String zoneCode) {
        return locationRepository.findByZoneCode(zoneCode);
    }

    @Override
    public Location getLocationByBarcode(String binBarcode) {
        return locationRepository.findByBinBarcode(binBarcode)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy ô kệ có mã vạch: " + binBarcode));
    }

    @Override
    public List<LocationOccupancyDto> getLocationOccupancy() {
        List<Location> locations = locationRepository.findAll();
        List<com.wms.module.inventory.entity.Inventory> inventories = inventoryRepository.findAll();

        Map<Long, com.wms.module.inventory.entity.Inventory> invByLoc = inventories.stream()
                .filter(i -> i.getOnHandQty() != null && i.getOnHandQty() > 0)
                .collect(Collectors.toMap(com.wms.module.inventory.entity.Inventory::getLocationId, i -> i, (a, b) -> a));

        Map<Long, Product> prodMap = productRepository.findAll().stream()
                .collect(Collectors.toMap(Product::getId, p -> p, (a, b) -> a));

        Map<Long, com.wms.module.inventory.entity.ProductBatch> batchMap = productBatchRepository.findAll().stream()
                .collect(Collectors.toMap(com.wms.module.inventory.entity.ProductBatch::getId, b -> b, (a, b) -> a));

        LocalDate thresholdDate = LocalDate.now().plusDays(30);

        return locations.stream().map(loc -> {
            boolean isZoneB = loc.getZoneCode() != null && loc.getZoneCode().contains("B");
            com.wms.module.inventory.entity.Inventory inv = invByLoc.get(loc.getId());

            String status = "EMPTY";
            BigDecimal currentWeight = BigDecimal.ZERO;
            Long productId = null;
            String productName = null;
            String sku = null;
            Integer qty = null;
            String batch = null;
            LocalDate expiry = null;

            if (inv != null && inv.getOnHandQty() > 0) {
                productId = inv.getProductId();
                qty = inv.getOnHandQty();
                Product p = prodMap.get(productId);
                if (p != null) {
                    productName = p.getName();
                    sku = p.getSku();
                }

                com.wms.module.inventory.entity.ProductBatch b = batchMap.get(inv.getBatchId());
                if (b != null) {
                    batch = b.getBatchNumber();
                    expiry = b.getExpiryDate();
                }

                if (inv.getAvailableQty() <= 0 && inv.getReservedQty() > 0) {
                    status = "RESERVED";
                } else if (expiry != null && (expiry.isBefore(thresholdDate) || expiry.isEqual(thresholdDate))) {
                    status = "EXPIRING";
                } else {
                    status = "OCCUPIED";
                }

                currentWeight = (loc.getShelf() != null && loc.getShelf().equals("S01"))
                        ? BigDecimal.valueOf(Math.min(150.0, loc.getMaxWeightKg().doubleValue()))
                        : BigDecimal.valueOf(Math.min(30.0, loc.getMaxWeightKg().doubleValue()));
            }

            return LocationOccupancyDto.builder()
                    .id(loc.getId())
                    .zone(isZoneB ? "ZONE_B" : "ZONE_A")
                    .zoneName(isZoneB ? "Kho Lạnh & Sữa (Cold Storage 2-8°C)" : "Kho Khô & Điện Tử (Ambient)")
                    .aisle(loc.getAisle())
                    .rack(loc.getRack())
                    .shelf(loc.getShelf())
                    .binNumber(loc.getBinBarcode() != null && loc.getBinBarcode().length() >= 3
                            ? loc.getBinBarcode().substring(loc.getBinBarcode().length() - 3) : "B01")
                    .barcode(loc.getBinBarcode())
                    .maxWeight(loc.getMaxWeightKg())
                    .currentWeight(currentWeight)
                    .status(status)
                    .productId(productId)
                    .productName(productName)
                    .sku(sku)
                    .qty(qty)
                    .batch(batch)
                    .expiry(expiry)
                    .temperature(isZoneB ? "4.0°C" : "24.0°C")
                    .build();
        }).toList();
    }
}
