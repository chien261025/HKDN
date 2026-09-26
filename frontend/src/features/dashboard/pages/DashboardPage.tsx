import React, { useState } from 'react';
import { BinCell } from '../types';
import { DashboardHeroHeader } from '../components/DashboardHeroHeader';
import { DashboardKpiCards } from '../components/DashboardKpiCards';
import { ThroughputChartWidget } from '../components/ThroughputChartWidget';
import { ZoneCapacityChartWidget } from '../components/ZoneCapacityChartWidget';
import { FulfillmentPipelineWidget } from '../components/FulfillmentPipelineWidget';
import { WarehouseGridWidget } from '../components/WarehouseGridWidget';
import { LiveActivityStreamWidget } from '../components/LiveActivityStreamWidget';
import { ConcurrencyTestWidget } from '../components/ConcurrencyTestWidget';
import { PutawayOptimizerWidget } from '../components/PutawayOptimizerWidget';
import { Sliders, X } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [selectedBin, setSelectedBin] = useState<BinCell | null>(null);
  const [showSimulation, setShowSimulation] = useState(false);

  // Digital Twin Warehouse Grid Data
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
    <div className="space-y-5 max-w-[1600px] mx-auto pb-12">
      {/* 1. Executive Operations Header */}
      <DashboardHeroHeader
        onToggleSimulation={() => setShowSimulation(!showSimulation)}
        showSimulation={showSimulation}
      />

      {/* 2. Core Operational KPI Cards */}
      <DashboardKpiCards />

      {/* 3. Visual Charts Row (Throughput Area Chart + Zone Capacity Donut) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-7">
          <ThroughputChartWidget />
        </div>
        <div className="lg:col-span-5">
          <ZoneCapacityChartWidget />
        </div>
      </div>

      {/* 4. Full-width Order Fulfillment Pipeline */}
      <FulfillmentPipelineWidget />

      {/* 5. Live Operations Row (Digital Twin Grid + Live Activity Feed) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-7">
          <WarehouseGridWidget
            grid={warehouseGrid}
            selectedBin={selectedBin}
            onSelectBin={setSelectedBin}
          />
        </div>
        <div className="lg:col-span-5">
          <LiveActivityStreamWidget />
        </div>
      </div>

      {/* 6. Optional Simulation & Stress Testing Section (Expandable) */}
      {showSimulation && (
        <div className="p-6 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-4 animate-in fade-in duration-200 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="text-base font-bold text-white">
                  Khu Vực Kiểm Thử Thuật Toán & Giả Lập Tải
                </h3>
                <p className="text-xs text-slate-400">
                  Thử nghiệm cơ chế khóa đồng thời chống âm kho và mô hình tính toán cất hàng thông minh
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowSimulation(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ConcurrencyTestWidget />
            <PutawayOptimizerWidget />
          </div>
        </div>
      )}
    </div>
  );
};
