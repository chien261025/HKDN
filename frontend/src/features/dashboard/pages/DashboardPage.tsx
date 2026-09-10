import React, { useState } from 'react';
import { BinCell } from '../types';
import { DashboardHeroHeader } from '../components/DashboardHeroHeader';
import { DashboardKpiCards } from '../components/DashboardKpiCards';
import { WarehouseGridWidget } from '../components/WarehouseGridWidget';
import { ConcurrencyTestWidget } from '../components/ConcurrencyTestWidget';
import { PutawayOptimizerWidget } from '../components/PutawayOptimizerWidget';

export const DashboardPage: React.FC = () => {
  const [selectedBin, setSelectedBin] = useState<BinCell | null>(null);

  // Digital Twin Warehouse Grid Mock
  const warehouseGrid: BinCell[] = [
    {
      id: '1',
      barcode: 'ZA-A01-R01-S01-B01',
      aisle: 'A01',
      rack: 'R01',
      shelf: 'S01',
      status: 'OCCUPIED',
      productName: 'Samsung Galaxy S24 Ultra',
      sku: 'SKU-SAMS-S24',
      qty: 25,
      batch: 'BATCH-S24-01',
      expiry: '2028-01-10',
    },
    {
      id: '2',
      barcode: 'ZA-A01-R01-S02-B02',
      aisle: 'A01',
      rack: 'R01',
      shelf: 'S02',
      status: 'EMPTY',
    },
    {
      id: '3',
      barcode: 'ZA-A01-R02-S01-B03',
      aisle: 'A01',
      rack: 'R02',
      shelf: 'S01',
      status: 'OCCUPIED',
      productName: 'Nước giặt OMO Matic 3.6kg',
      sku: 'SKU-OMO-MATIC',
      qty: 60,
      batch: 'BATCH-OMO-01',
      expiry: '2027-03-01',
    },
    {
      id: '4',
      barcode: 'ZA-A02-R01-S01-B04',
      aisle: 'A02',
      rack: 'R01',
      shelf: 'S01',
      status: 'RESERVED',
      productName: 'Nước giặt OMO Matic 3.6kg (Đang Giữ)',
      sku: 'SKU-OMO-MATIC',
      qty: 15,
      batch: 'BATCH-OMO-01',
      expiry: '2027-03-01',
    },
    {
      id: '5',
      barcode: 'ZB-B01-R01-S01-B05',
      aisle: 'B01',
      rack: 'R01',
      shelf: 'S01',
      status: 'EXPIRING',
      productName: 'Sữa tươi Vinamilk 100% 1L',
      sku: 'SKU-MILK-100',
      qty: 80,
      batch: 'BATCH-MILK-26A',
      expiry: '2026-09-25',
    },
    {
      id: '6',
      barcode: 'ZB-B01-R01-S02-B06',
      aisle: 'B01',
      rack: 'R01',
      shelf: 'S02',
      status: 'OCCUPIED',
      productName: 'Sữa tươi Vinamilk 100% 1L',
      sku: 'SKU-MILK-100',
      qty: 200,
      batch: 'BATCH-MILK-26B',
      expiry: '2026-11-30',
    },
    {
      id: '7',
      barcode: 'ZB-B02-R01-S01-B07',
      aisle: 'B02',
      rack: 'R01',
      shelf: 'S01',
      status: 'EMPTY',
    },
    {
      id: '8',
      barcode: 'ZB-B02-R01-S02-B08',
      aisle: 'B02',
      rack: 'R01',
      shelf: 'S02',
      status: 'EMPTY',
    },
  ];

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto pb-10">
      {/* 1. Header Banner */}
      <DashboardHeroHeader />

      {/* 2. 4 Thẻ KPI */}
      <DashboardKpiCards />

      {/* 3. Bố Cục 2 Cột Chính */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* CỘT TRÁI (7 COLS): Lưới Ô Kệ Digital Twin */}
        <div className="lg:col-span-7">
          <WarehouseGridWidget
            grid={warehouseGrid}
            selectedBin={selectedBin}
            onSelectBin={setSelectedBin}
          />
        </div>

        {/* CỘT PHẢI (5 COLS): 2 Widget Test Nghiệp Vụ */}
        <div className="lg:col-span-5 space-y-4">
          <ConcurrencyTestWidget />
          <PutawayOptimizerWidget />
        </div>
      </div>
    </div>
  );
};
