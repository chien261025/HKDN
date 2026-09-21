import React, { useState, useEffect } from 'react';
import { BinLocation, ZoneType } from '../types';
import { LayoutHeader } from '../components/layout/LayoutHeader';
import { RackElevationGrid } from '../components/layout/RackElevationGrid';
import { BinDetailPanel } from '../components/layout/BinDetailPanel';
import { locationService } from '../services/locationService';

export const LocationLayoutPage: React.FC = () => {
  const [selectedZone, setSelectedZone] = useState<ZoneType>('ZONE_A');
  const [selectedBinId, setSelectedBinId] = useState<number | null>(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [locations, setLocations] = useState<BinLocation[]>([]);

  useEffect(() => {
    locationService.getLocations().then(setLocations);
  }, []);

  // Lọc theo Phân Khu và từ khóa tìm kiếm
  const zoneLocations = locations.filter((l) => l.zone === selectedZone);
  const filteredLocations = zoneLocations.filter(
    (l) =>
      l.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.productName && l.productName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (l.sku && l.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const selectedBin = locations.find((l) => l.id === selectedBinId) || null;
  const occupiedCount = zoneLocations.filter((l) => l.status !== 'EMPTY').length;

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto pb-10">
      {/* 1. Header & Bộ Chọn Khu / Tìm Kiếm */}
      <LayoutHeader
        selectedZone={selectedZone}
        onSelectZone={(zone) => {
          setSelectedZone(zone);
          // Tự động chọn ô đầu tiên của khu mới
          const firstInZone = locations.find((l) => l.zone === zone);
          if (firstInZone) setSelectedBinId(firstInZone.id);
        }}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      {/* 2. Bố Cục 2 Cột: Sơ Đồ Dãy Kệ (70%) & Chi Tiết Ô Kệ (30%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* CỘT TRÁI (8 COLS): SƠ ĐỒ KHUNG KỆ NÂNG CAO */}
        <div className="lg:col-span-8">
          <RackElevationGrid
            locations={filteredLocations}
            selectedBinId={selectedBinId}
            onSelectBin={(bin) => setSelectedBinId(bin.id)}
          />
        </div>

        {/* CỘT PHẢI (4 COLS): BẢNG GIÁM SÁT TẢI TRỌNG & THÔNG TIN Ô KỆ */}
        <div className="lg:col-span-4">
          <BinDetailPanel
            selectedBin={selectedBin}
            totalLocationsCount={zoneLocations.length}
            occupiedCount={occupiedCount}
          />
        </div>
      </div>
    </div>
  );
};
