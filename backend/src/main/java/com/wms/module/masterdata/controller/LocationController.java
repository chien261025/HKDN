package com.wms.module.masterdata.controller;

import com.wms.common.response.ApiResponse;
import com.wms.module.masterdata.dto.LocationOccupancyDto;
import com.wms.module.masterdata.entity.Location;
import com.wms.module.masterdata.service.LocationService;
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

    private final LocationService locationService;

    @GetMapping
    @Operation(summary = "Lấy toàn bộ danh sách ô kệ trong kho", description = "Trả về danh sách tất cả các ô kệ vật lý (Aisle, Rack, Shelf, Bin Barcode)")
    public ApiResponse<List<Location>> getAllLocations() {
        return ApiResponse.success("Lấy danh sách ô kệ thành công!", locationService.getAllLocations());
    }

    @GetMapping("/occupancy")
    @Operation(summary = "Sơ đồ ô kệ kèm dữ liệu tồn kho thực tế (Digital Twin)",
               description = "Trả về trạng thái thực tế của từng ô kệ: EMPTY, OCCUPIED, EXPIRING, RESERVED kèm chi tiết sản phẩm, lô hàng và hạn dùng")
    public ApiResponse<List<LocationOccupancyDto>> getLocationOccupancy() {
        return ApiResponse.success("Lấy sơ đồ ô kệ thời gian thực thành công!", locationService.getLocationOccupancy());
    }

    @GetMapping("/zone/{zoneCode}")
    @Operation(summary = "Lọc ô kệ theo Phân khu (Zone)", description = "VD: ZONE_A (Kho Khô), ZONE_B (Kho Mát)")
    public ApiResponse<List<Location>> getLocationsByZone(
            @Parameter(description = "Mã phân khu (ZONE_A hoặc ZONE_B)", example = "ZONE_A")
            @PathVariable String zoneCode) {
        return ApiResponse.success("Lấy danh sách ô kệ theo Zone " + zoneCode + " thành công!", locationService.getLocationsByZone(zoneCode));
    }

    @GetMapping("/barcode/{binBarcode}")
    @Operation(summary = "Tìm ô kệ theo mã vạch dán trên kệ", description = "VD: ZA-A01-R01-S01-B01")
    public ApiResponse<Location> getLocationByBarcode(
            @Parameter(description = "Mã vạch trên kệ", example = "ZA-A01-R01-S01-B01")
            @PathVariable String binBarcode) {
        return ApiResponse.success(locationService.getLocationByBarcode(binBarcode));
    }
}
