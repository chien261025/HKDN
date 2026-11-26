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
import java.util.Comparator;
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
    @Transactional
    public Location updateLocationStatus(Long id, boolean isActive) {
        Location location = locationRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy ô kệ với ID: " + id));
        if (!isActive) {
            int totalReserved = inventoryRepository.findByLocationId(id).stream()
                    .filter(inv -> inv.getReservedQty() != null && inv.getReservedQty() > 0)
                    .mapToInt(com.wms.module.inventory.entity.Inventory::getReservedQty)
                    .sum();
            if (totalReserved > 0) {
                throw new BusinessException(
                        ErrorCode.BAD_REQUEST,
                        String.format("Không thể khóa bảo trì ô kệ %s vì đang có %d sản phẩm được giữ cho đơn xuất kho!",
                                location.getBinBarcode(), totalReserved)
                );
            }
        }
        location.setIsActive(isActive);
        return locationRepository.save(location);
    }

    @Override
    public List<LocationOccupancyDto> getLocationOccupancy() {
        List<Location> locations = locationRepository.findAll();
        List<com.wms.module.inventory.entity.Inventory> inventories = inventoryRepository.findAll();

        Map<Long, com.wms.module.inventory.entity.ProductBatch> batchMap = productBatchRepository.findAll().stream()
                .collect(Collectors.toMap(com.wms.module.inventory.entity.ProductBatch::getId, b -> b, (a, b) -> a));

        // Chuẩn FEFO (First-Expired, First-Out): Ưu tiên hiển thị lô hàng cận hạn / hết hạn sớm nhất để thủ kho xử lý
        Map<Long, com.wms.module.inventory.entity.Inventory> invByLoc = inventories.stream()
                .filter(i -> i.getOnHandQty() != null && i.getOnHandQty() > 0)
                .sorted(Comparator.comparing(i -> {
                    com.wms.module.inventory.entity.ProductBatch b = batchMap.get(i.getBatchId());
                    return (b != null && b.getExpiryDate() != null) ? b.getExpiryDate() : LocalDate.of(2099, 1, 1);
                }))
                .collect(Collectors.toMap(com.wms.module.inventory.entity.Inventory::getLocationId, i -> i, (a, b) -> a));

        Map<Long, Product> prodMap = productRepository.findAll().stream()
                .collect(Collectors.toMap(Product::getId, p -> p, (a, b) -> a));

        Map<Long, BigDecimal> weightByLoc = inventories.stream()
                .filter(i -> i.getOnHandQty() != null && i.getOnHandQty() > 0)
                .collect(Collectors.groupingBy(
                        com.wms.module.inventory.entity.Inventory::getLocationId,
                        Collectors.reducing(BigDecimal.ZERO, i -> {
                            Product p = prodMap.get(i.getProductId());
                            BigDecimal w = (p != null && p.getWeightKg() != null) ? p.getWeightKg() : BigDecimal.ONE;
                            return w.multiply(BigDecimal.valueOf(i.getOnHandQty()));
                        }, BigDecimal::add)
                ));

        LocalDate today = LocalDate.now();
        LocalDate thresholdDate = today.plusDays(30);

        return locations.stream().map(loc -> {
            String zoneCode = loc.getZoneCode() != null ? loc.getZoneCode() : "ZONE_A";
            String zoneName = zoneCode.contains("B")
                    ? "Kho Mát & Thực Phẩm (2°C - 8°C)"
                    : zoneCode.contains("C")
                    ? "Kho Hàng Giá Trị Cao & Điện Tử"
                    : zoneCode.contains("QUA")
                    ? "Khu Vực Cách Ly & Chờ Xử Lý"
                    : "Kho Hàng Khô & Tiêu Dùng Thường";

            com.wms.module.inventory.entity.Inventory inv = invByLoc.get(loc.getId());

            String status = "EMPTY";
            BigDecimal currentWeight = BigDecimal.ZERO;
            Long productId = null;
            Long batchId = null;
            String productName = null;
            String sku = null;
            Integer qty = null;
            Integer onHandQty = 0;
            Integer reservedQty = 0;
            Integer availableQty = 0;
            Boolean isExpired = false;
            String batch = null;
            LocalDate expiry = null;

            if (inv != null && inv.getOnHandQty() > 0) {
                productId = inv.getProductId();
                batchId = inv.getBatchId();
                qty = inv.getOnHandQty();
                onHandQty = inv.getOnHandQty();
                reservedQty = inv.getReservedQty() != null ? inv.getReservedQty() : 0;
                availableQty = Math.max(0, inv.getAvailableQty());
                Product p = prodMap.get(productId);
                if (p != null) {
                    productName = p.getName();
                    sku = p.getSku();
                }

                com.wms.module.inventory.entity.ProductBatch b = batchMap.get(inv.getBatchId());
                if (b != null) {
                    batch = b.getBatchNumber();
                    expiry = b.getExpiryDate();
                    if (expiry != null && (expiry.isBefore(today) || expiry.isEqual(today))) {
                        isExpired = true;
                    }
                }

                if (inv.getAvailableQty() <= 0 && inv.getReservedQty() > 0) {
                    status = "RESERVED";
                } else if (isExpired || (expiry != null && (expiry.isBefore(thresholdDate) || expiry.isEqual(thresholdDate)))) {
                    status = "EXPIRING";
                } else {
                    status = "OCCUPIED";
                }

                // Tải trọng thực tế của toàn bộ hàng hóa đang lưu trữ tại ô kệ
                BigDecimal actualWeight = weightByLoc.getOrDefault(loc.getId(), BigDecimal.ZERO);
                currentWeight = actualWeight.setScale(1, java.math.RoundingMode.HALF_UP);
            }

            Long whId = loc.getWarehouseId() != null ? loc.getWarehouseId() : 1L;
            String whCode = loc.getBinBarcode() != null && loc.getBinBarcode().contains("-")
                    ? loc.getBinBarcode().split("-")[0]
                    : (whId == 2 ? "WH02" : whId == 3 ? "WH03" : whId == 4 ? "WH04" : "WH01");

            return LocationOccupancyDto.builder()
                    .id(loc.getId())
                    .warehouseId(whId)
                    .warehouseCode(whCode)
                    .zone(zoneCode)
                    .zoneName(zoneName)
                    .aisle(loc.getAisle())
                    .rack(loc.getRack())
                    .shelf(loc.getShelf())
                    .binNumber(loc.getBinBarcode() != null && loc.getBinBarcode().length() >= 3
                            ? loc.getBinBarcode().substring(loc.getBinBarcode().length() - 3) : "B01")
                    .barcode(loc.getBinBarcode())
                    .maxWeight(loc.getMaxWeightKg())
                    .currentWeight(currentWeight)
                    .status(status)
                    .isActive(loc.getIsActive() != null ? loc.getIsActive() : Boolean.TRUE)
                    .productId(productId)
                    .batchId(batchId)
                    .productName(productName)
                    .sku(sku)
                    .qty(qty)
                    .onHandQty(onHandQty)
                    .reservedQty(reservedQty)
                    .availableQty(availableQty)
                    .isExpired(isExpired)
                    .batch(batch)
                    .expiry(expiry)
                    .temperature("ZONE_B".equals(zoneCode) ? "4.0°C" : "24.0°C")
                    .build();
        }).toList();
    }
}
