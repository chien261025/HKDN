import React, { useState } from 'react';
import { Truck, Sparkles, Printer, Plus, Minus, QrCode } from 'lucide-react';
import { PalletLabelCard, PalletLabelData } from './PalletLabelCard';
import { BarcodeSvg, QrCodeSvg } from '../../../components/common';

const DEFAULT_PALLET: PalletLabelData = {
  palletCode: 'PLT-2026-0042',
  orderCode: 'PO-2026-001',
  productName: 'Sữa tươi tiệt trùng Vinamilk 100% 1L',
  sku: 'SKU-MILK-100',
  totalQuantity: 120,
  unit: 'Thùng (1,440 Hộp)',
  grossWeightKg: 1480,
  destinationLocation: 'WH01-ZA-A01-R01-S01-B01',
  dateCreated: new Date().toLocaleDateString('vi-VN'),
  inspectorName: 'Nguyễn Quản Trị',
};

export const CustomLabelPrintSection: React.FC = () => {
  const [mode, setMode] = useState<'PALLET' | 'CUSTOM'>('PALLET');

  // Pallet state
  const [palletData, setPalletData] = useState<PalletLabelData>(DEFAULT_PALLET);
  const [palletCopies, setPalletCopies] = useState<number>(2);

  // Custom quick barcode state
  const [customCode, setCustomCode] = useState<string>('QC-PASSED-2026');
  const [customTitle, setCustomTitle] = useState<string>('TEM KIỂM SOÁT CHẤT LƯỢNG');
  const [customSubtitle, setCustomSubtitle] = useState<string>('Kho Trung Tâm WH-01 • Tiêu Chuẩn ISO');
  const [barcodeType, setBarcodeType] = useState<'BOTH' | 'BARCODE' | 'QR'>('BOTH');
  const [customCopies, setCustomCopies] = useState<number>(3);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Control Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 no-print">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMode('PALLET')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'PALLET'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>1. Tem Pallet & Kiện Hàng (A6)</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('CUSTOM')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mode === 'CUSTOM'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>2. Trình Tạo Tem Tự Do (Ad-hoc)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>In Bản Này</span>
          </button>
        </div>

        {/* Dynamic Form Filters */}
        {mode === 'PALLET' ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="text-2xs font-bold text-slate-600 uppercase">Mã Pallet:</label>
              <input
                type="text"
                value={palletData.palletCode}
                onChange={(e) => setPalletData({ ...palletData, palletCode: e.target.value })}
                className="w-full mt-1 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="text-2xs font-bold text-slate-600 uppercase">Đơn Hàng / Vị Trí Đích:</label>
              <input
                type="text"
                value={palletData.destinationLocation}
                onChange={(e) => setPalletData({ ...palletData, destinationLocation: e.target.value })}
                className="w-full mt-1 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="text-2xs font-bold text-slate-600 uppercase">Số Lượng Kiện / Hàng:</label>
              <input
                type="number"
                value={palletData.totalQuantity}
                onChange={(e) => setPalletData({ ...palletData, totalQuantity: Number(e.target.value) })}
                className="w-full mt-1 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="text-2xs font-bold text-slate-600 uppercase">Bản In:</label>
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setPalletCopies((c) => Math.max(1, c - 1))}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="flex-1 text-center font-mono font-bold text-xs bg-slate-50 py-1 rounded-lg border border-slate-300">
                  {palletCopies} tem
                </span>
                <button
                  type="button"
                  onClick={() => setPalletCopies((c) => Math.min(10, c + 1))}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
            <div>
              <label className="text-2xs font-bold text-slate-600 uppercase">Mã Barcode / QR Cần Tạo:</label>
              <input
                type="text"
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value)}
                placeholder="VD: QC-PASSED-2026"
                className="w-full mt-1 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="text-2xs font-bold text-slate-600 uppercase">Tiêu Đề Nhãn:</label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full mt-1 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="text-2xs font-bold text-slate-600 uppercase">Định Dạng Mã:</label>
              <select
                value={barcodeType}
                onChange={(e) => setBarcodeType(e.target.value as any)}
                className="w-full mt-1 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:border-indigo-600"
              >
                <option value="BOTH">Cả 1D Barcode & 2D QR</option>
                <option value="BARCODE">Chỉ 1D Code128</option>
                <option value="QR">Chỉ 2D QR Code</option>
              </select>
            </div>
            <div>
              <label className="text-2xs font-bold text-slate-600 uppercase">Số Lượng Bản In:</label>
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setCustomCopies((c) => Math.max(1, c - 1))}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="flex-1 text-center font-mono font-bold text-xs bg-slate-50 py-1 rounded-lg border border-slate-300">
                  {customCopies} tem
                </span>
                <button
                  type="button"
                  onClick={() => setCustomCopies((c) => Math.min(24, c + 1))}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Printable Sheet */}
      {mode === 'PALLET' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 print-label-sheet">
          {Array.from({ length: palletCopies }).map((_, idx) => (
            <div key={idx} className="relative">
              <span className="absolute top-2 right-2 z-10 text-3xs font-mono font-bold text-slate-400 no-print">
                Kiện #{idx + 1}
              </span>
              <PalletLabelCard data={palletData} />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 print-label-sheet">
          {Array.from({ length: customCopies }).map((_, idx) => (
            <div
              key={idx}
              className="bg-white border-2 border-slate-900 rounded-xl p-3.5 flex flex-col justify-between text-slate-900 shadow-sm print-single-label"
              style={{ width: '100%', maxWidth: '340px', minHeight: '180px' }}
            >
              <div className="pb-1.5 border-b border-slate-300 flex items-center justify-between">
                <span className="font-black text-2xs uppercase tracking-wider text-slate-900 truncate">
                  {customTitle}
                </span>
                <span className="text-3xs font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded border">
                  CUSTOM
                </span>
              </div>

              <div className="my-2 flex items-center justify-center gap-3">
                {(barcodeType === 'BOTH' || barcodeType === 'BARCODE') && (
                  <div className="flex-1 flex flex-col items-center justify-center overflow-hidden">
                    <BarcodeSvg value={customCode} format="CODE128" width={1.6} height={42} fontSize={11} />
                  </div>
                )}
                {(barcodeType === 'BOTH' || barcodeType === 'QR') && (
                  <div className="flex-shrink-0 flex flex-col items-center">
                    <QrCodeSvg value={customCode} size={60} level="M" />
                  </div>
                )}
              </div>

              <div className="pt-1.5 border-t border-slate-300 flex justify-between text-3xs font-mono text-slate-500">
                <span>{customSubtitle}</span>
                <span>#{idx + 1}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
