package com.wms.module.order.service;

import com.wms.common.exception.BusinessException;
import com.wms.common.exception.ErrorCode;
import com.wms.module.masterdata.entity.Location;
import com.wms.module.masterdata.repository.LocationRepository;
import com.wms.module.order.entity.InboundOrder;
import com.wms.module.order.entity.InboundOrderItem;
import com.wms.module.order.repository.InboundOrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class InboundService {

    private final LocationRepository locationRepository;
    private final InboundOrderRepository inboundOrderRepository;

    @Transactional(readOnly = true)
    public List<InboundOrder> getAllInboundOrders() {
        return inboundOrderRepository.findAll();
    }

    @Transactional
    public InboundOrder createInboundOrder(InboundOrder order) {
        if (order.getOrderCode() == null || order.getOrderCode().isBlank()) {
            order.setOrderCode("PO-" + System.currentTimeMillis() % 1000000);
        }
        order.setStatus("PENDING");
        order.setCreatedAt(Instant.now());
        order.setUpdatedAt(Instant.now());
        if (order.getItems() != null) {
            for (InboundOrderItem item : order.getItems()) {
                item.setInboundOrder(order);
                item.setStatus("PENDING");
            }
        }
        return inboundOrderRepository.save(order);
    }

    @Transactional
    public InboundOrder receiveInboundOrder(Long id) {
        InboundOrder order = inboundOrderRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy đơn nhập: " + id));
        order.setStatus("RECEIVED");
        order.setUpdatedAt(Instant.now());
        if (order.getItems() != null) {
            for (InboundOrderItem item : order.getItems()) {
                item.setReceivedQty(item.getExpectedQty());
                item.setStatus("COMPLETED");
            }
        }
        return inboundOrderRepository.save(order);
    }

    /**
     * THUẬT TOÁN GỢI Ý VỊ TRÍ CẤT HÀNG (PUT-AWAY ALGORITHM):
     * 1. Ưu tiên đúng Zone nhiệt độ/chủng loại của sản phẩm (Zone A: Khô, Zone B: Mát)
     * 2. Ưu tiên các ô kệ còn đủ tải trọng chứa hàng
     * 3. Đối với hàng nặng (> 100kg), ưu tiên tầng thấp nhất (Shelf S01) để đảm bảo an toàn kết cấu
     */
    @Transactional(readOnly = true)
    public Location suggestOptimalPutAwayLocation(String preferredZone, BigDecimal itemTotalWeightKg) {
        log.info("Chay thuat toan Put-away: Zone={}, Weight={}", preferredZone, itemTotalWeightKg);

        List<Location> availableLocations = locationRepository.findByZoneCode(preferredZone);
        if (availableLocations.isEmpty()) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy ô kệ nào trong phân khu: " + preferredZone);
        }

        boolean isHeavyItem = itemTotalWeightKg.compareTo(BigDecimal.valueOf(100.0)) > 0;

        return availableLocations.stream()
                .filter(Location::getIsActive)
                .filter(loc -> loc.getMaxWeightKg().compareTo(itemTotalWeightKg) >= 0)
                .sorted((l1, l2) -> {
                    if (isHeavyItem) {
                        boolean l1IsBottom = "S01".equalsIgnoreCase(l1.getShelf());
                        boolean l2IsBottom = "S01".equalsIgnoreCase(l2.getShelf());
                        if (l1IsBottom && !l2IsBottom) return -1;
                        if (!l1IsBottom && l2IsBottom) return 1;
                    }
                    int aisleCompare = l1.getAisle().compareTo(l2.getAisle());
                    if (aisleCompare != 0) return aisleCompare;
                    return l1.getShelf().compareTo(l2.getShelf());
                })
                .findFirst()
                .orElseThrow(() -> new BusinessException(ErrorCode.LOCATION_FULL, 
                        "Khu vực " + preferredZone + " không còn ô kệ nào đủ tải trọng " + itemTotalWeightKg + "kg"));
    }
}
