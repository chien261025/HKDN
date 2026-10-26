package com.wms.module.masterdata.service;

import com.wms.module.masterdata.dto.LocationOccupancyDto;
import com.wms.module.masterdata.entity.Location;

import java.util.List;

public interface LocationService {
    List<Location> getAllLocations();
    List<Location> getLocationsByZone(String zoneCode);
    Location getLocationByBarcode(String binBarcode);
    List<LocationOccupancyDto> getLocationOccupancy();
}
