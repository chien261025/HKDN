package com.wms.unit;

import com.wms.common.exception.BusinessException;
import com.wms.common.exception.ErrorCode;
import com.wms.module.masterdata.entity.Location;
import com.wms.module.masterdata.repository.LocationRepository;
import com.wms.module.order.service.InboundService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class InboundServiceUnitTest {

    @Mock
    private LocationRepository locationRepository;

    @InjectMocks
    private InboundService inboundService;

    @Test
    @DisplayName("Hang nang (>100kg) bat buoc phai goi y vao tang tret S01 de an toan ket cau")
    void testSuggestLocation_HeavyItemPrefersS01() {
        Location locShelf2 = Location.builder()
                .id(1L)
                .zoneCode("ZONE_A")
                .aisle("A01")
                .rack("R01")
                .shelf("S02") // Tang 2
                .binBarcode("ZA-A01-R01-S02-B02")
                .maxWeightKg(BigDecimal.valueOf(500.0))
                .isActive(true)
                .build();

        Location locShelf1 = Location.builder()
                .id(2L)
                .zoneCode("ZONE_A")
                .aisle("A01")
                .rack("R01")
                .shelf("S01") // Tang tret
                .binBarcode("ZA-A01-R01-S01-B01")
                .maxWeightKg(BigDecimal.valueOf(500.0))
                .isActive(true)
                .build();

        when(locationRepository.findByZoneCode("ZONE_A")).thenReturn(List.of(locShelf2, locShelf1));

        // Hang nang 150kg (> 100kg)
        Location result = inboundService.suggestOptimalPutAwayLocation("ZONE_A", BigDecimal.valueOf(150.0));

        assertNotNull(result);
        assertEquals("S01", result.getShelf(), "Hang nang phai duoc uu tien dat tai tang tret S01");
        assertEquals("ZA-A01-R01-S01-B01", result.getBinBarcode());
    }

    @Test
    @DisplayName("Loc bo cac o ke co tai trong toi da nho hon trong luong kien hang")
    void testSuggestLocation_RespectsWeightCapacity() {
        Location locLight = Location.builder()
                .id(1L)
                .zoneCode("ZONE_A")
                .aisle("A01")
                .rack("R01")
                .shelf("S01")
                .binBarcode("ZA-A01-R01-S01-LIGHT")
                .maxWeightKg(BigDecimal.valueOf(50.0)) // Chi chiu duoc 50kg
                .isActive(true)
                .build();

        Location locHeavy = Location.builder()
                .id(2L)
                .zoneCode("ZONE_A")
                .aisle("A01")
                .rack("R01")
                .shelf("S02")
                .binBarcode("ZA-A01-R01-S02-HEAVY")
                .maxWeightKg(BigDecimal.valueOf(300.0)) // Chiu duoc 300kg
                .isActive(true)
                .build();

        when(locationRepository.findByZoneCode("ZONE_A")).thenReturn(List.of(locLight, locHeavy));

        // Kien hang 80kg (<= 100kg nen khong bat buoc S01, nhung can du tai)
        Location result = inboundService.suggestOptimalPutAwayLocation("ZONE_A", BigDecimal.valueOf(80.0));

        assertNotNull(result);
        assertEquals(2L, result.getId());
        assertEquals("ZA-A01-R01-S02-HEAVY", result.getBinBarcode());
    }

    @Test
    @DisplayName("Nem loi NOT_FOUND khi phan khu khong co o ke nao")
    void testSuggestLocation_ZoneNotFound() {
        when(locationRepository.findByZoneCode("ZONE_Z")).thenReturn(Collections.emptyList());

        BusinessException ex = assertThrows(BusinessException.class, () ->
                inboundService.suggestOptimalPutAwayLocation("ZONE_Z", BigDecimal.valueOf(20.0)));

        assertEquals(ErrorCode.NOT_FOUND, ex.getErrorCode());
    }

    @Test
    @DisplayName("Nem loi LOCATION_FULL khi tat ca cac o ke deu vuot qua tai trong")
    void testSuggestLocation_LocationFull() {
        Location loc = Location.builder()
                .id(1L)
                .zoneCode("ZONE_A")
                .aisle("A01")
                .rack("R01")
                .shelf("S01")
                .maxWeightKg(BigDecimal.valueOf(100.0))
                .isActive(true)
                .build();

        when(locationRepository.findByZoneCode("ZONE_A")).thenReturn(List.of(loc));

        // Kien hang 500kg vuot qua tai trong 100kg
        BusinessException ex = assertThrows(BusinessException.class, () ->
                inboundService.suggestOptimalPutAwayLocation("ZONE_A", BigDecimal.valueOf(500.0)));

        assertEquals(ErrorCode.LOCATION_FULL, ex.getErrorCode());
    }
}
