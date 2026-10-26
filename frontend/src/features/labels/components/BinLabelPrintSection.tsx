import React, { useState } from 'react';
import { Layers, Printer, CheckSquare, Square } from 'lucide-react';
import { BinLabelCard, BinLabelData } from './BinLabelCard';

export const SAMPLE_BIN_LABELS: BinLabelData[] = [
  {
    binBarcode: 'WH01-ZA-A01-R01-S01-B01',
    zoneCode: 'ZONE_A',
    aisle: 'A01',
    rack: 'R01',
    shelf: 'S01',
    bin: 'B01',
    maxWeightKg: 500,
  },
  {
    binBarcode: 'WH01-ZA-A01-R01-S02-B02',
    zoneCode: 'ZONE_A',
    aisle: 'A01',
    rack: 'R01',
    shelf: 'S02',
    bin: 'B02',
    maxWeightKg: 500,
  },
  {
    binBarcode: 'WH01-ZA-A01-R02-S01-B03',
    zoneCode: 'ZONE_A',
    aisle: 'A01',
    rack: 'R02',
    shelf: 'S01',
    bin: 'B03',
    maxWeightKg: 500,
  },
  {
    binBarcode: 'WH01-ZA-A02-R01-S01-B04',
    zoneCode: 'ZONE_A',
    aisle: 'A02',
    rack: 'R01',
    shelf: 'S01',
    bin: 'B04',
    maxWeightKg: 500,
  },
  {
    binBarcode: 'WH01-ZB-B01-R01-S01-B05',
    zoneCode: 'ZONE_B',
    aisle: 'B01',
    rack: 'R01',
    shelf: 'S01',
    bin: 'B05',
    maxWeightKg: 300,
  },
  {
    binBarcode: 'WH01-ZB-B01-R01-S02-B06',
    zoneCode: 'ZONE_B',
    aisle: 'B01',
    rack: 'R01',
    shelf: 'S02',
    bin: 'B06',
    maxWeightKg: 300,
  },
];

export const BinLabelPrintSection: React.FC = () => {
  const [selectedZone, setSelectedZone] = useState<string>('ALL');
  const [selectedBins, setSelectedBins] = useState<string[]>(
    SAMPLE_BIN_LABELS.map((b) => b.binBarcode)
  );

  const filteredLabels = SAMPLE_BIN_LABELS.filter(
    (b) => selectedZone === 'ALL' || b.zoneCode === selectedZone
  );

  const toggleSelectBin = (barcode: string) => {
    setSelectedBins((prev) =>
      prev.includes(barcode) ? prev.filter((b) => b !== barcode) : [...prev, barcode]
    );
  };

  const selectAll = () => {
    setSelectedBins(filteredLabels.map((b) => b.binBarcode));
  };

  const deselectAll = () => {
    setSelectedBins([]);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Control Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase">Cấu hình in nhãn ô kệ</h3>
            <p className="text-xs text-slate-500 font-medium">Lựa chọn phân khu và các ô kệ cần in tem dán</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Zone filter */}
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-600"
          >
            <option value="ALL">Tất cả phân khu (Khu A & B)</option>
            <option value="ZONE_A">Khu A (Khô & Thiết bị)</option>
            <option value="ZONE_B">Khu B (Kho mát 2-8°C)</option>
          </select>

          {/* Quick select buttons */}
          <button
            type="button"
            onClick={selectAll}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Chọn tất cả ({filteredLabels.length})
          </button>
          <button
            type="button"
            onClick={deselectAll}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl text-xs font-medium transition-colors cursor-pointer"
          >
            Bỏ chọn
          </button>

          {/* Print button */}
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>In {selectedBins.length} Tem Nhãn</span>
          </button>
        </div>
      </div>

      {/* Grid of Printable Labels */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 print-label-sheet">
        {filteredLabels.map((label) => {
          const isSelected = selectedBins.includes(label.binBarcode);
          return (
            <div
              key={label.binBarcode}
              className={`relative transition-all ${
                isSelected ? 'opacity-100 ring-2 ring-indigo-500 rounded-xl' : 'opacity-40 no-print'
              }`}
            >
              {/* Checkbox badge (Hidden on print) */}
              <button
                type="button"
                onClick={() => toggleSelectBin(label.binBarcode)}
                className="absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-white/90 border border-slate-200 text-indigo-600 hover:bg-white transition-all no-print cursor-pointer"
                title={isSelected ? 'Bỏ chọn tem này' : 'Chọn tem này để in'}
              >
                {isSelected ? <CheckSquare className="w-4 h-4 text-indigo-600" /> : <Square className="w-4 h-4 text-slate-400" />}
              </button>

              <BinLabelCard data={label} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
