import React from 'react';
import { Printer, X, FileText, CheckCircle2 } from 'lucide-react';

export interface LedgerEntryData {
  id: string;
  transactionType: 'OUTBOUND' | 'INBOUND' | 'ADJUSTMENT' | 'TRANSFER';
  referenceCode: string;
  locationBarcode: string;
  productSku: string;
  productName: string;
  batchNumber: string;
  expiryDate: string;
  qtyChange: number;
  balanceBefore: number;
  balanceAfter: number;
  performedBy: string;
  notes: string;
  timestamp: string;
  hashSignature: string;
}

interface StockLedgerModalProps {
  entry: LedgerEntryData;
  onClose: () => void;
}

export const StockLedgerModal: React.FC<StockLedgerModalProps> = ({ entry, onClose }) => {
  const getVoucherTitle = () => {
    switch (entry.transactionType) {
      case 'OUTBOUND':
        return 'PHIẾU XUẤT KHO';
      case 'INBOUND':
        return 'PHIẾU NHẬP KHO';
      case 'ADJUSTMENT':
        return 'BIÊN BẢN CÂN ĐỐI TỒN KHO';
      default:
        return 'PHIẾU ĐIỀU CHUYỂN KHO';
    }
  };

  const isOutbound = entry.transactionType === 'OUTBOUND';

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-[#0b1222] rounded-2xl max-w-3xl w-full border border-slate-700 shadow-2xl overflow-hidden text-slate-100 relative">
        {/* Top vivid accent line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400"></div>

        {/* Modal Header */}
        <div className="p-5 border-b border-slate-700 flex items-start justify-between bg-slate-900/95 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg text-white tracking-wide">
                  {getVoucherTitle()}
                </h3>
                <span
                  className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border shadow-sm ${
                    isOutbound
                      ? 'bg-rose-500/20 text-rose-300 border-rose-400/60 shadow-rose-950/30'
                      : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/60 shadow-emerald-950/30'
                  }`}
                >
                  {isOutbound ? 'XUẤT HÀNG' : 'NHẬP HÀNG'}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                Mã chứng từ: <strong className="text-cyan-300 font-mono font-bold">{entry.id}</strong> • Thời gian: {entry.timestamp}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border border-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Thông tin chung */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#111c33] p-4 rounded-xl border border-slate-700/80 text-xs shadow-inner">
            <div>
              <span className="text-slate-400 block text-[11px] font-medium">Mã Chứng Từ:</span>
              <span className="font-mono font-black text-white text-sm mt-0.5 block">{entry.id}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] font-medium">Mã Đơn Hàng:</span>
              <span className="font-mono font-black text-cyan-300 text-sm mt-0.5 block">{entry.referenceCode}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] font-medium">Người Lập Phiếu:</span>
              <span className="font-bold text-slate-100 mt-0.5 block">{entry.performedBy}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] font-medium">Thời Gian Ký:</span>
              <span className="font-mono font-medium text-slate-200 mt-0.5 block">{entry.timestamp}</span>
            </div>
          </div>

          {/* Bảng Chi Tiết Mặt Hàng */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              <span>Chi Tiết Hàng Hóa Xuất Kho</span>
            </h4>
            <div className="rounded-xl border border-slate-700 overflow-hidden shadow-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0e1628] text-xs text-slate-200 font-bold border-b-2 border-slate-700 uppercase">
                  <tr>
                    <th className="py-3 px-3.5 w-10 text-center">STT</th>
                    <th className="py-3 px-3.5">Tên Sản Phẩm</th>
                    <th className="py-3 px-3.5">Mã SKU</th>
                    <th className="py-3 px-3.5">Số Lô (Batch)</th>
                    <th className="py-3 px-3.5">Hạn Sử Dụng</th>
                    <th className="py-3 px-3.5">Vị Trí Ô Kệ</th>
                    <th className="py-3 px-3.5 text-right">Số Lượng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-[#111c33]/70 font-sans">
                  <tr>
                    <td className="py-3.5 px-3.5 text-center text-slate-300 font-mono font-bold">1</td>
                    <td className="py-3.5 px-3.5">
                      <div className="font-bold text-white text-sm">{entry.productName}</div>
                    </td>
                    <td className="py-3.5 px-3.5 font-mono font-bold text-cyan-300">{entry.productSku}</td>
                    <td className="py-3.5 px-3.5 font-mono font-bold text-amber-300">{entry.batchNumber}</td>
                    <td className="py-3.5 px-3.5 font-mono font-bold text-rose-300">{entry.expiryDate}</td>
                    <td className="py-3.5 px-3.5 font-mono text-xs">
                      <span className="bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700 text-slate-100 font-bold">
                        {entry.locationBarcode}
                      </span>
                    </td>
                    <td className="py-3.5 px-3.5 text-right font-mono font-black text-amber-300 text-base">
                      {Math.abs(entry.qtyChange)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Biến Động Số Dư & Ghi Chú */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-[#111c33] border border-slate-700 text-center shadow-inner">
              <span className="text-[11px] text-slate-400 font-bold block mb-0.5">Tồn Trước Khi Xuất</span>
              <span className="text-lg font-black font-mono text-slate-200">{entry.balanceBefore}</span>
            </div>

            <div className={`p-3.5 rounded-xl border text-center shadow-inner ${
              isOutbound
                ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
            }`}>
              <span className="text-[11px] block mb-0.5 font-bold uppercase tracking-wider">
                {isOutbound ? 'Số Lượng Xuất' : 'Số Lượng Nhập'}
              </span>
              <span className="text-xl font-black font-mono">
                {entry.qtyChange > 0 ? `+${entry.qtyChange}` : entry.qtyChange} SP
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#111c33] border border-slate-700 text-center shadow-inner">
              <span className="text-[11px] text-slate-400 font-bold block mb-0.5">Tồn Sau Khi Xuất</span>
              <span className="text-lg font-black font-mono text-cyan-300">{entry.balanceAfter}</span>
            </div>
          </div>

          {/* Ghi chú */}
          <div className="p-3.5 rounded-xl bg-[#111c33]/70 border border-slate-700 text-xs">
            <span className="text-slate-300 font-bold block">Ghi chú phiếu xuất:</span>
            <p className="text-slate-100 mt-1 font-medium">{entry.notes || 'Không có ghi chú bổ sung.'}</p>
          </div>

          {/* Phần Chữ Ký 3 Bên Chuẩn Kho Vận Doanh Nghiệp */}
          <div className="pt-4 border-t border-slate-700">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="space-y-1">
                <span className="text-xs font-bold text-white block">Người Lập Phiếu</span>
                <span className="text-[11px] text-slate-400 block italic">(Ký, ghi rõ họ tên)</span>
                <div className="h-16 flex items-end justify-center">
                  <span className="text-xs font-bold text-cyan-300 border-t border-dashed border-slate-600 pt-1 w-36">
                    {entry.performedBy}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-white block">Thủ Kho</span>
                <span className="text-[11px] text-slate-400 block italic">(Ký, ghi rõ họ tên)</span>
                <div className="h-16 flex items-end justify-center">
                  <span className="text-xs font-bold text-indigo-300 border-t border-dashed border-slate-600 pt-1 w-36">
                    Trần Trưởng Kho
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-white block">Người Nhận Hàng</span>
                <span className="text-[11px] text-slate-400 block italic">(Ký, ghi rõ họ tên)</span>
                <div className="h-16 flex items-end justify-center">
                  <span className="text-xs font-medium text-slate-400 border-t border-dashed border-slate-600 pt-1 w-36">
                    (Ký nhận)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-700 bg-slate-900/95 flex items-center justify-between gap-3 shadow-lg">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-white text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-cyan-400" />
            <span>In Chứng Từ Này</span>
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-xs font-black transition-all cursor-pointer shadow-lg shadow-indigo-600/30"
          >
            Đóng Lại
          </button>
        </div>
      </div>
    </div>
  );
};
