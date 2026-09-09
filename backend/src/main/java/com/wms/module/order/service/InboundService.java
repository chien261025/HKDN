package com.wms.module.order.service;

import com.wms.common.exception.BusinessException;
import com.wms.common.exception.ErrorCode;
import com.wms.module.masterdata.entity.Location;
import com.wms.module.masterdata.repository.LocationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class InboundService {

    private final LocationRepository locationRepository;

    /**
     * THUẬT TOÁN GỢI Ý VỊ TRÍ CẤT HÀNG (PUT-AWAY ALGORITHM):
     * 1. Ưu tiên đúng Zone nhiệt độ/chủng loại của sản phẩm (Zone A: Khô, Zone B: Mát)
     * 2. Ưu tiên các ô kệ còn đủ tải trọng chứa hàng
     * 3. Đối với hàng nặng (> 100kg), ưu tiên tầng thấp nhất (Shelf S01) để đảm bảo an toàn kết cấu
     */
    public Location suggestOptimalPutAwayLocation(String preferredZone, BigDecimal itemTotalWeightKg) {
        log.info("Chay thuat toan Put-away: Zone={}, Weight={}", preferredZone, itemTotalWeightKg);

        List<Location> availableLocations = locationRepository.findByZoneCode(preferredZone);
        if (availableLocations.isEmpty()) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy ô kệ nào trong phân khu: " + preferredZone);
        }

        // Nếu hàng nặng, ưu tiên tầng thấp nhất S01
        boolean isHeavyItem = itemTotalWeightKg.compareTo(BigDecimal.valueOf(100.0)) > 0;

        return availableLocations.stream()
                .filter(Location::getIsActive)
                .filter(loc -> loc.getMaxWeightKg().compareTo(itemTotalWeightKg) >= 0)
                .sorted((l1, l2) -> {
                    if (isHeavyItem) {
                        // Ưu tiên S01 lên đầu
                        boolean l1IsBottom = "S01".equalsIgnoreCase(l1.getShelf());
                        boolean l2IsBottom = "S01".equalsIgnoreCase(l2.getShelf());
                        if (l1IsBottom && !l2IsBottom) return -1;
                        if (!l1IsBottom && l2IsBottom) return 1;
                    }
                    // Sắp xếp thứ tự Aisle -> Rack -> Shelf
                    int aisleCompare = l1.getAisle().compareTo(l2.getAisle());
                    if (aisleCompare != 0) return aisleCompare;
                    return l1.getShelf().compareTo(l2.getShelf());
                })
                .findFirst()
                .orElseThrow(() -> new BusinessException(ErrorCode.LOCATION_FULL, 
                        "Khu vực " + preferredZone + " không còn ô kệ nào đủ tải trọng " + itemTotalWeightKg + "kg"));
    }
}
