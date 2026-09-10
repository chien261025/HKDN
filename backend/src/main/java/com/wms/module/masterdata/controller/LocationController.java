package com.wms.module.masterdata.controller;

import com.wms.common.exception.BusinessException;
import com.wms.common.exception.ErrorCode;
import com.wms.common.response.ApiResponse;
import com.wms.module.masterdata.entity.Location;
import com.wms.module.masterdata.repository.LocationRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/masterdata/locations")
@RequiredArgsConstructor
@Tag(name = "2. Master Data - Sơ đồ Vị trí Kho (Locations)", description = "APIs quản lý ô kệ, phân khu Zone, Dãy Aisle, Kệ Rack, Tầng Shelf")
public class LocationController {

    private final LocationRepository locationRepository;

    @GetMapping
    @Operation(summary = "Lấy toàn bộ danh sách ô kệ trong kho", description = "Trả về danh sách tất cả các ô kệ vật lý (Aisle, Rack, Shelf, Bin Barcode)")
    public ApiResponse<List<Location>> getAllLocations() {
        List<Location> locations = locationRepository.findAll();
        return ApiResponse.success("Lấy danh sách ô kệ thành công!", locations);
    }

    @GetMapping("/zone/{zoneCode}")
    @Operation(summary = "Lọc ô kệ theo Phân khu (Zone)", description = "VD: ZONE_A (Kho Khô), ZONE_B (Kho Mát)")
    public ApiResponse<List<Location>> getLocationsByZone(
            @Parameter(description = "Mã phân khu (ZONE_A hoặc ZONE_B)", example = "ZONE_A")
            @PathVariable String zoneCode) {
        List<Location> locations = locationRepository.findByZoneCode(zoneCode);
        return ApiResponse.success("Lấy danh sách ô kệ theo Zone " + zoneCode + " thành công!", locations);
    }

    @GetMapping("/barcode/{binBarcode}")
    @Operation(summary = "Tìm ô kệ theo mã vạch dán trên kệ", description = "VD: ZA-A01-R01-S01-B01")
    public ApiResponse<Location> getLocationByBarcode(
            @Parameter(description = "Mã vạch trên kệ", example = "ZA-A01-R01-S01-B01")
            @PathVariable String binBarcode) {
        Location location = locationRepository.findByBinBarcode(binBarcode)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Không tìm thấy ô kệ có mã vạch: " + binBarcode));
        return ApiResponse.success(location);
    }
}
