import React, { useState } from 'react';
import { Layers, Box, Info, ShieldCheck, MapPin, Search, Filter, Cpu, CheckCircle2 } from 'lucide-react';

interface BinLocation {
  id: number;
  zone: string;
  aisle: string;
  rack: string;
  shelf: string;
  barcode: string;
  maxWeight: number;
  status: 'EMPTY' | 'OCCUPIED' | 'RESERVED';
  productName?: string;
  sku?: string;
  qty?: number;
  batch?: string;
  expiry?: string;
}

export const LocationLayoutPage: React.FC = () => {
  const [selectedZone, setSelectedZone] = useState<'ZONE_A' | 'ZONE_B'>('ZONE_A');
  const [selectedBin, setSelectedBin] = useState<BinLocation | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const mockLocations: BinLocation[] = [
    { id: 1, zone: 'ZONE_A', aisle: 'A01', rack: 'R01', shelf: 'S01', barcode: 'ZA-A01-R01-S01-B01', maxWeight: 500, status: 'OCCUPIED', productName: 'Samsung Galaxy S24 Ultra', sku: 'SKU-SAMS-S24', qty: 25, batch: 'BATCH-S24-01', expiry: '2028-01-10' },
    { id: 2, zone: 'ZONE_A', aisle: 'A01', rack: 'R01', shelf: 'S02', barcode: 'ZA-A01-R01-S02-B02', maxWeight: 300, status: 'EMPTY' },
    { id: 3, zone: 'ZONE_A', aisle: 'A01', rack: 'R02', shelf: 'S01', barcode: 'ZA-A01-R02-S01-B03', maxWeight: 500, status: 'OCCUPIED', productName: 'Nước giặt OMO Matic 3.6kg', sku: 'SKU-OMO-MATIC', qty: 60, batch: 'BATCH-OMO-01', expiry: '2027-03-01' },
    { id: 4, zone: 'ZONE_A', aisle: 'A02', rack: 'R01', shelf: 'S01', barcode: 'ZA-A02-R01-S01-B04', maxWeight: 500, status: 'RESERVED', productName: 'Nước giặt OMO (Đang Giữ Đơn)', sku: 'SKU-OMO-MATIC', qty: 15, batch: 'BATCH-OMO-01', expiry: '2027-03-01' },
    { id: 5, zone: 'ZONE_B', aisle: 'B01', rack: 'R01', shelf: 'S01', barcode: 'ZB-B01-R01-S01-B05', maxWeight: 200, status: 'OCCUPIED', productName: 'Sữa tươi Vinamilk 1L (Cận Date)', sku: 'SKU-MILK-100', qty: 80, batch: 'BATCH-MILK-26A', expiry: '2026-09-25' },
    { id: 6, zone: 'ZONE_B', aisle: 'B01', rack: 'R01', shelf: 'S02', barcode: 'ZB-B01-R01-S02-B06', maxWeight: 200, status: 'OCCUPIED', productName: 'Sữa tươi Vinamilk 1L (Hạn Dài)', sku: 'SKU-MILK-100', qty: 200, batch: 'BATCH-MILK-26B', expiry: '2026-11-30' },
    { id: 7, zone: 'ZONE_B', aisle: 'B02', rack: 'R01', shelf: 'S01', barcode: 'ZB-B02-R01-S01-B07', maxWeight: 200, status: 'EMPTY' },
    { id: 8, zone: 'ZONE_B', aisle: 'B02', rack: 'R02', shelf: 'S01', barcode: 'ZB-B02-R02-S01-B08', maxWeight: 200, status: 'EMPTY' },
  ];

  const filteredLocations = mockLocations
    .filter((l) => l.zone === selectedZone)
    .filter((l) => l.barcode.toLowerCase().includes(searchTerm.toLowerCase()) || (l.productName && l.productName.toLowerCase().includes(searchTerm.toLowerCase())));

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      {/* Control Header */}
      <div className="glass-panel rounded-2xl p-6 border border-slate-800/80 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Layers className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Sơ Đồ Không Gian Ô Kệ (Warehouse Topology)</h1>
              <p className="text-xs text-slate-400">Trực quan hóa Dãy (Aisle) • Kệ (Rack) • Tầng (Shelf) • Ô chứa (Bin) theo chuẩn công nghiệp</p>
            </div>
          </div>
        </div>

        {/* Zone Selector & Search */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Lọc ô kệ hoặc SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700/60 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setSelectedZone('ZONE_A')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedZone === 'ZONE_A'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Khu A: Hàng Khô & Điện Tử
            </button>
            <button
              onClick={() => setSelectedZone('ZONE_B')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedZone === 'ZONE_B'
                  ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Khu B: Kho Mát (2-8°C)
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Racks */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredLocations.map((loc) => {
          const isOccupied = loc.status === 'OCCUPIED';
          const isReserved = loc.status === 'RESERVED';

          let statusClass = 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-400';
          let statusLabel = 'Ô TRỐNG';
          let labelColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';

          if (isOccupied) {
            statusClass = 'border-indigo-500/30 bg-indigo-500/10 hover:border-indigo-400';
            statusLabel = 'ĐANG LƯU TRỮ';
            labelColor = 'text-indigo-300 bg-indigo-500/20 border-indigo-500/30';
          } else if (isReserved) {
            statusClass = 'border-amber-500/40 bg-amber-500/10 hover:border-amber-400';
            statusLabel = 'KHÓA GIỮ ĐƠN';
            labelColor = 'text-amber-300 bg-amber-500/20 border-amber-500/30';
          }

          return (
            <div
              key={loc.id}
              onClick={() => setSelectedBin(loc)}
              className={`cursor-pointer rounded-2xl p-4 border transition-all hover:scale-[1.02] shadow-lg flex flex-col justify-between ${statusClass}`}
            >
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-mono font-bold bg-slate-900 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                    {loc.barcode}
                  </span>
                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${labelColor}`}>
                    {statusLabel}
                  </span>
                </div>

                <div className="mt-3">
                  <h3 className="text-sm font-extrabold text-white">
                    Dãy {loc.aisle} • Kệ {loc.rack} • Tầng {loc.shelf}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">Tải trọng tối đa: {loc.maxWeight} kg</p>
                </div>

                {loc.productName ? (
                  <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-200 text-xs font-semibold">
                      <Box className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                      <span className="truncate">{loc.productName}</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-mono text-slate-400 pt-1">
                      <span>{loc.sku}</span>
                      <span className="text-emerald-400 font-bold">{loc.qty} cái</span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 pt-3 border-t border-slate-800/60 text-[11px] text-slate-400 italic">
                    Sẵn sàng tiếp nhận hàng nhập Put-away
                  </div>
                )}
              </div>

              <div className="mt-3 pt-2 text-right">
                <span className="text-[10px] text-indigo-400 font-semibold hover:underline">Chi tiết ô kệ →</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Chi Tiết Ô Kệ */}
      {selectedBin && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#0f172a] rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-700 space-y-4 text-slate-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-400" />
                Ô Kệ: {selectedBin.barcode}
              </h3>
              <button onClick={() => setSelectedBin(null)} className="text-slate-400 hover:text-white font-bold text-sm">
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="flex justify-between p-2 rounded bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400">Phân khu:</span>
                <span className="font-bold text-white">{selectedBin.zone}</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400">Tọa độ vật lý:</span>
                <span className="font-bold text-white">Dãy {selectedBin.aisle} • Kệ {selectedBin.rack} • Tầng {selectedBin.shelf}</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-slate-900/80 border border-slate-800">
                <span className="text-slate-400">Sức chịu tải an toàn:</span>
                <span className="font-bold text-emerald-400">{selectedBin.maxWeight} kg</span>
              </div>
              {selectedBin.productName && (
                <>
                  <div className="flex justify-between p-2 rounded bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-400">Mặt hàng:</span>
                    <span className="font-bold text-cyan-400">{selectedBin.productName}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-400">Lô & Hạn dùng:</span>
                    <span className="font-bold text-rose-400">{selectedBin.batch} ({selectedBin.expiry})</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-slate-900/80 border border-slate-800">
                    <span className="text-slate-400">Số lượng khả dụng:</span>
                    <span className="font-bold text-emerald-400 text-sm">{selectedBin.qty} cái</span>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setSelectedBin(null)}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-indigo-600/30"
            >
              Đóng Cửa Sổ
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
