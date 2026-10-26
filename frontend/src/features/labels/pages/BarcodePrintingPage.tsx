import React, { useState, useEffect } from 'react';
import { Printer, MapPin, Tag, ScanLine, Info, Truck } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { BinLabelPrintSection } from '../components/BinLabelPrintSection';
import { BatchLabelPrintSection } from '../components/BatchLabelPrintSection';
import { CustomLabelPrintSection } from '../components/CustomLabelPrintSection';

interface BarcodePrintingPageProps {
  onOpenScanner?: () => void;
}

export const BarcodePrintingPage: React.FC<BarcodePrintingPageProps> = ({ onOpenScanner }) => {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState<'BINS' | 'BATCHES' | 'PALLETS'>(
    tabParam === 'BATCHES' ? 'BATCHES' : tabParam === 'PALLETS' ? 'PALLETS' : 'BINS'
  );

  useEffect(() => {
    if (tabParam === 'BATCHES' || tabParam === 'PALLETS' || tabParam === 'BINS') {
      setActiveTab(tabParam);
    } else if (searchParams.get('sku')) {
      setActiveTab('BATCHES');
    } else if (searchParams.get('bin')) {
      setActiveTab('BINS');
    }
  }, [tabParam, searchParams]);

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      {/* Page Header (Hidden on print) */}
      <div className="group relative bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-4 no-print overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500" />
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-600/20 ring-4 ring-indigo-50 flex-shrink-0">
            <Printer className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                TRUNG TÂM IN MÃ VẠCH & QR CODE
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono uppercase">
                BARCODE / QR
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
              Tạo và in nhãn dán ô kệ, tem định danh lô hàng, thẻ Pallet A6 theo chuẩn Code128 & QR Code 2D
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenScanner && (
            <button
              type="button"
              onClick={onOpenScanner}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-300 shadow-2xs cursor-pointer"
            >
              <ScanLine className="w-4 h-4 text-indigo-600" />
              <span>Quét Thử (Scanner)</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>In Toàn Bộ (Ctrl+P)</span>
          </button>
        </div>
      </div>

      {/* Helpful Hint Banner (Hidden on print) */}
      <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200 text-indigo-900 text-xs flex items-center gap-2.5 font-medium no-print">
        <Info className="w-4 h-4 text-indigo-700 flex-shrink-0" />
        <span>
          <strong>Mẹo In Ấn Chuẩn Công Nghiệp:</strong> Các tem nhãn đã được tối ưu CSS in ấn (`@media print`). Bạn có thể in trực tiếp ra giấy A4 (khổ 3 cột) hoặc xuất sang máy in nhiệt decal (Zebra/Xprinter) chuẩn xác không bị tràn lề!
        </span>
      </div>

      {/* Modern Segmented Pill Tabs Selector (Hidden on print) */}
      <div className="inline-flex flex-wrap items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200/80 gap-1 no-print">
        <button
          type="button"
          onClick={() => setActiveTab('BINS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'BINS'
              ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 border border-transparent'
          }`}
        >
          <MapPin className="w-4 h-4 text-indigo-600" />
          <span>1. Tem Nhãn Vị Trí Ô Kệ (Bin Locations)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('BATCHES')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'BATCHES'
              ? 'bg-white text-emerald-700 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 border border-transparent'
          }`}
        >
          <Tag className="w-4 h-4 text-emerald-600" />
          <span>2. Tem Lô Hàng & Hạn Dùng (FEFO Batches)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('PALLETS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'PALLETS'
              ? 'bg-white text-cyan-700 shadow-xs border border-slate-200'
              : 'text-slate-600 hover:text-slate-900 border border-transparent'
          }`}
        >
          <Truck className="w-4 h-4 text-cyan-600" />
          <span>3. Tem Pallet A6 & Tạo Tem Tự Do (Custom)</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'BINS' && <BinLabelPrintSection />}
      {activeTab === 'BATCHES' && <BatchLabelPrintSection />}
      {activeTab === 'PALLETS' && <CustomLabelPrintSection />}
    </div>
  );
};
