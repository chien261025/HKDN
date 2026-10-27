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
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs flex-shrink-0">
            <Printer className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              In Tem Nhãn Mã Vạch & QR Code
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
              In nhãn dán ô kệ kho, tem định danh lô hàng theo hạn dùng và phiếu kiện Pallet A6
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenScanner && (
            <button
              type="button"
              onClick={onOpenScanner}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium transition-colors border border-slate-300 shadow-xs cursor-pointer"
            >
              <ScanLine className="w-3.5 h-3.5 text-indigo-600" />
              <span>Quét Thử</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>In Toàn Bộ (Ctrl+P)</span>
          </button>
        </div>
      </div>

      {/* Helpful Hint Banner (Hidden on print) */}
      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-xs flex items-center gap-2 no-print font-normal">
        <Info className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
        <span>
          Định dạng in ấn đã được cấu hình tối ưu (@media print) cho cả giấy in thường A4 và máy in nhiệt decal (Zebra, Xprinter).
        </span>
      </div>

      {/* Segmented Tabs Selector (Hidden on print) */}
      <div className="inline-flex flex-wrap items-center bg-slate-100 p-1 rounded-lg border border-slate-200 gap-1 no-print text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('BINS')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
            activeTab === 'BINS'
              ? 'bg-white text-indigo-700 shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          <span>Tem Vị Trí Ô Kệ</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('BATCHES')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
            activeTab === 'BATCHES'
              ? 'bg-white text-indigo-700 shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Tem Lô Hàng (FEFO)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('PALLETS')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
            activeTab === 'PALLETS'
              ? 'bg-white text-indigo-700 shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Phiếu Kiện Pallet A6</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'BINS' && <BinLabelPrintSection />}
      {activeTab === 'BATCHES' && <BatchLabelPrintSection />}
      {activeTab === 'PALLETS' && <CustomLabelPrintSection />}
    </div>
  );
};
