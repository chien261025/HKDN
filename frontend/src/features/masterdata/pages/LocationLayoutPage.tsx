import React, { useState } from 'react';
import { BinLocation, ZoneType } from '../types';
import { LayoutHeader } from '../components/layout/LayoutHeader';
import { RackElevationGrid } from '../components/layout/RackElevationGrid';
import { BinDetailPanel } from '../components/layout/BinDetailPanel';

export const LocationLayoutPage: React.FC = () => {
  const [selectedZone, setSelectedZone] = useState<ZoneType>('ZONE_A');
  const [selectedBinId, setSelectedBinId] = useState<number | null>(1);
  const [searchTerm, setSearchTerm] = useState('');

  // Dữ liệu mẫu vị trí kho theo chuẩn Dãy - Kệ - Tầng - Ô
  const mockLocations: BinLocation[] = [
    // KHU A: Hàng Khô & Điện Tử
    {
      id: 1,
      zone: 'ZONE_A',
      zoneName: 'Khu A: Hàng Khô & Điện Tử',
      aisle: 'A01',
      rack: 'R01',
      shelf: 'S01',
      binNumber: 'B01',
      barcode: 'ZA-A01-R01-S01-B01',
      maxWeight: 500,
      currentWeight: 125,
      status: 'OCCUPIED',
      productName: 'Samsung Galaxy S24 Ultra 256GB',
      sku: 'SKU-SAMS-S24',
      qty: 25,
      batch: 'BATCH-S24-01',
      expiry: '2028-01-10',
    },
    {
      id: 2,
      zone: 'ZONE_A',
      zoneName: 'Khu A: Hàng Khô & Điện Tử',
      aisle: 'A01',
      rack: 'R01',
      shelf: 'S02',
      binNumber: 'B02',
      barcode: 'ZA-A01-R01-S02-B02',
      maxWeight: 300,
      currentWeight: 0,
      status: 'EMPTY',
    },
    {
      id: 3,
      zone: 'ZONE_A',
      zoneName: 'Khu A: Hàng Khô & Điện Tử',
      aisle: 'A01',
      rack: 'R02',
      shelf: 'S01',
      binNumber: 'B03',
      barcode: 'ZA-A01-R02-S01-B03',
      maxWeight: 500,
      currentWeight: 216,
      status: 'OCCUPIED',
      productName: 'Nước giặt OMO Matic Cửa Trên 3.6kg',
      sku: 'SKU-OMO-MATIC',
      qty: 60,
      batch: 'BATCH-OMO-01',
      expiry: '2027-03-01',
    },
    {
      id: 4,
      zone: 'ZONE_A',
      zoneName: 'Khu A: Hàng Khô & Điện Tử',
      aisle: 'A02',
      rack: 'R01',
      shelf: 'S01',
      binNumber: 'B04',
      barcode: 'ZA-A02-R01-S01-B04',
      maxWeight: 500,
      currentWeight: 54,
      status: 'RESERVED',
      productName: 'Nước giặt OMO Matic (Đang Giữ Đơn)',
      sku: 'SKU-OMO-MATIC',
      qty: 15,
      batch: 'BATCH-OMO-01',
      expiry: '2027-03-01',
    },
    {
      id: 5,
      zone: 'ZONE_A',
      zoneName: 'Khu A: Hàng Khô & Điện Tử',
      aisle: 'A02',
      rack: 'R01',
      shelf: 'S02',
      binNumber: 'B05',
      barcode: 'ZA-A02-R01-S02-B05',
      maxWeight: 300,
      currentWeight: 0,
      status: 'EMPTY',
    },

    // KHU B: Kho Mát (2-8°C) - Thực Phẩm & Sữa
    {
      id: 6,
      zone: 'ZONE_B',
      zoneName: 'Khu B: Kho Mát (2-8°C)',
      aisle: 'B01',
      rack: 'R01',
      shelf: 'S01',
      binNumber: 'B05',
      barcode: 'ZB-B01-R01-S01-B05',
      maxWeight: 200,
      currentWeight: 80,
      status: 'EXPIRING',
      productName: 'Sữa tươi tiệt trùng Vinamilk 100% 1L',
      sku: 'SKU-MILK-100',
      qty: 80,
      batch: 'BATCH-MILK-26A',
      expiry: '2026-09-25',
      temperature: '4°C',
    },
    {
      id: 7,
      zone: 'ZONE_B',
      zoneName: 'Khu B: Kho Mát (2-8°C)',
      aisle: 'B01',
      rack: 'R01',
      shelf: 'S02',
      binNumber: 'B06',
      barcode: 'ZB-B01-R01-S02-B06',
      maxWeight: 200,
      currentWeight: 200,
      status: 'OCCUPIED',
      productName: 'Sữa tươi tiệt trùng Vinamilk 100% 1L',
      sku: 'SKU-MILK-100',
      qty: 200,
      batch: 'BATCH-MILK-26B',
      expiry: '2026-11-30',
      temperature: '4°C',
    },
    {
      id: 8,
      zone: 'ZONE_B',
      zoneName: 'Khu B: Kho Mát (2-8°C)',
      aisle: 'B02',
      rack: 'R01',
      shelf: 'S01',
      binNumber: 'B07',
      barcode: 'ZB-B02-R01-S01-B07',
      maxWeight: 200,
      currentWeight: 0,
      status: 'EMPTY',
      temperature: '4°C',
    },
    {
      id: 9,
      zone: 'ZONE_B',
      zoneName: 'Khu B: Kho Mát (2-8°C)',
      aisle: 'B02',
      rack: 'R01',
      shelf: 'S02',
      binNumber: 'B08',
      barcode: 'ZB-B02-R01-S02-B08',
      maxWeight: 200,
      currentWeight: 0,
      status: 'EMPTY',
      temperature: '4°C',
    },
  ];

  // Lọc theo Phân Khu và từ khóa tìm kiếm
  const zoneLocations = mockLocations.filter((l) => l.zone === selectedZone);
  const filteredLocations = zoneLocations.filter(
    (l) =>
      l.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.productName && l.productName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (l.sku && l.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const selectedBin = mockLocations.find((l) => l.id === selectedBinId) || null;
  const occupiedCount = zoneLocations.filter((l) => l.status !== 'EMPTY').length;

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto pb-10">
      {/* 1. Header & Bộ Chọn Khu / Tìm Kiếm */}
      <LayoutHeader
        selectedZone={selectedZone}
        onSelectZone={(zone) => {
          setSelectedZone(zone);
          // Tự động chọn ô đầu tiên của khu mới
          const firstInZone = mockLocations.find((l) => l.zone === zone);
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
