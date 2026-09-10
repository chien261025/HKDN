import React from 'react';
import { X, Printer, Barcode, CheckCircle2, ShieldAlert } from 'lucide-react';
import { ProductItem } from '../types';

interface BarcodeLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductItem | null;
}

export const BarcodeLabelModal: React.FC<BarcodeLabelModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  if (!isOpen || !product) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#0e1626] border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30">
              <Barcode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Xem & In Tem Nhãn Barcode GS1-128</h2>
              <p className="text-xs text-slate-400 mt-0.5">Quy chuẩn nhãn dán Pallet / Thùng hàng dán ngoài kho</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Tag Preview */}
        <div className="p-6 flex flex-col items-center justify-center bg-slate-950/60">
          <div className="w-full max-w-sm bg-white text-slate-950 p-5 rounded-xl shadow-2xl border-2 border-slate-300 font-sans">
            {/* Tag Header */}
            <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-3">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-600">SMART WMS SYSTEM</div>
                <div className="text-sm font-black uppercase tracking-tight">TEM NHÃN ĐỊNH DANH HÀNG HÓA</div>
              </div>
              <div className="text-right">
                <span className="inline-block px-1.5 py-0.5 text-[9px] font-black uppercase bg-black text-white rounded">
                  {product.storageZone}
                </span>
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-1 mb-4">
              <div className="text-xs font-mono font-black text-indigo-900">
                SKU: <span className="text-base">{product.sku}</span>
              </div>
              <div className="text-sm font-bold leading-tight text-slate-900">
                {product.name}
              </div>
              <div className="text-[11px] text-slate-700 font-medium">
                NCC: {product.supplierName} ({product.supplierCode})
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-700 font-mono pt-1">
                <span>ĐVT: <b>{product.unit}</b></span>
                <span>Khối lượng: <b>{product.weightKg} kg</b></span>
              </div>
            </div>

            {/* Visual Barcode Bars Representation */}
            <div className="border-t border-dashed border-slate-300 pt-3 flex flex-col items-center">
              <div className="h-16 w-full flex items-center justify-center gap-[2px] bg-slate-50 px-2 py-1 rounded border border-slate-200">
                {/* Simulated realistic barcode bars */}
                {[2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 1, 2, 3, 1, 4, 2, 1, 3, 1, 2, 3, 4, 1, 2, 1, 3, 2, 1, 4, 2, 1, 3, 2, 1, 4, 1, 2].map(
                  (width, idx) => (
                    <div
                      key={idx}
                      className="bg-black h-full"
                      style={{ width: `${width * 1.5}px` }}
                    ></div>
                  )
                )}
              </div>
              <div className="font-mono text-xs font-black tracking-[0.25em] text-slate-900 mt-1.5">
                {product.barcode}
              </div>
              <div className="text-[9px] text-slate-500 font-mono mt-0.5 uppercase">
                Format: GS1 / Code-128 Standard
              </div>
            </div>

            {/* Warning notes */}
            <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-500">
              <span>Bảo quản: {product.storageZone === 'ZONE_B' ? 'Kho Mát 2-8°C' : 'Nơi khô ráo, thoáng mát'}</span>
              <span>In lúc: {new Date().toLocaleDateString('vi-VN')}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/40">
          <div className="text-xs text-slate-400 font-mono">
            Hỗ trợ máy in nhiệt Zebra ZT411 & Xprinter
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              Đóng
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-900/30 transition-all active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Gửi Lệnh In Tem (Print)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
