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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 print:bg-white print:p-0 print:static">
      <div className="printable-voucher bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden text-slate-900 relative">
        {/* Top vivid accent line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 print:hidden"></div>

        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-start justify-between bg-slate-50/90">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200 print:border print:border-slate-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="font-extrabold text-xl text-slate-900 tracking-tight">
                  {getVoucherTitle()}
                </h3>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full border shadow-xs ${
                    isOutbound
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {isOutbound ? 'XUẤT HÀNG' : 'NHẬP HÀNG'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
                Mã chứng từ: <strong className="text-indigo-700 font-mono font-bold">{entry.id}</strong> • Thời gian: {entry.timestamp}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors border border-slate-200 print:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Thông tin chung */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs sm:text-sm shadow-xs">
            <div>
              <span className="text-slate-500 block text-xs font-medium">Mã Chứng Từ:</span>
              <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">{entry.id}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-xs font-medium">Mã Đơn Hàng:</span>
              <span className="font-mono font-bold text-indigo-700 text-sm mt-0.5 block">{entry.referenceCode}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-xs font-medium">Người Lập Phiếu:</span>
              <span className="font-semibold text-slate-900 mt-0.5 block">{entry.performedBy}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-xs font-medium">Thời Gian Ký:</span>
              <span className="font-mono font-medium text-slate-700 mt-0.5 block">{entry.timestamp}</span>
            </div>
          </div>

          {/* Bảng Chi Tiết Mặt Hàng */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
              <span>Chi Tiết Hàng Hóa Lưu Kho</span>
            </h4>
            <div className="rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-100 text-xs text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
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
                <tbody className="divide-y divide-slate-200 bg-white font-sans text-slate-800">
                  <tr>
                    <td className="py-3.5 px-3.5 text-center text-slate-600 font-mono font-bold">1</td>
                    <td className="py-3.5 px-3.5">
                      <div className="font-bold text-slate-900 text-sm">{entry.productName}</div>
                    </td>
                    <td className="py-3.5 px-3.5 font-mono font-semibold text-indigo-700">{entry.productSku}</td>
                    <td className="py-3.5 px-3.5 font-mono font-semibold text-amber-700">{entry.batchNumber}</td>
                    <td className="py-3.5 px-3.5 font-mono font-semibold text-rose-700">{entry.expiryDate}</td>
                    <td className="py-3.5 px-3.5 font-mono text-xs">
                      <span className="bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-800 font-bold">
                        {entry.locationBarcode}
                      </span>
                    </td>
                    <td className="py-3.5 px-3.5 text-right font-mono font-black text-slate-900 text-base">
                      {Math.abs(entry.qtyChange)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Biến Động Số Dư & Ghi Chú */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center shadow-xs">
              <span className="text-xs text-slate-500 font-bold block mb-0.5">Tồn Trước Khi Xuất</span>
              <span className="text-xl font-black font-mono text-slate-800">{entry.balanceBefore}</span>
            </div>

            <div className={`p-3.5 rounded-xl border text-center shadow-xs ${
              isOutbound
                ? 'bg-rose-50 border-rose-200 text-rose-700'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}>
              <span className="text-xs block mb-0.5 font-bold uppercase tracking-wider">
                {isOutbound ? 'Số Lượng Xuất' : 'Số Lượng Nhập'}
              </span>
              <span className="text-xl font-black font-mono">
                {entry.qtyChange > 0 ? `+${entry.qtyChange}` : entry.qtyChange} SP
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center shadow-xs">
              <span className="text-xs text-slate-500 font-bold block mb-0.5">Tồn Sau Khi Xuất</span>
              <span className="text-xl font-black font-mono text-indigo-700">{entry.balanceAfter}</span>
            </div>
          </div>

          {/* Ghi chú */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm">
            <span className="text-slate-700 font-bold block">Ghi chú phiếu xuất:</span>
            <p className="text-slate-800 mt-1 font-medium leading-relaxed">{entry.notes || 'Không có ghi chú bổ sung.'}</p>
          </div>

          {/* Phần Chữ Ký 3 Bên Chuẩn Kho Vận Doanh Nghiệp */}
          <div className="pt-4 border-t border-slate-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="space-y-1">
                <span className="text-xs sm:text-sm font-bold text-slate-900 block">Người Lập Phiếu</span>
                <span className="text-xs text-slate-500 block italic">(Ký, ghi rõ họ tên)</span>
                <div className="h-16 flex items-end justify-center">
                  <span className="text-xs sm:text-sm font-bold text-indigo-700 border-t border-dashed border-slate-300 pt-1 w-36">
                    {entry.performedBy}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs sm:text-sm font-bold text-slate-900 block">Thủ Kho</span>
                <span className="text-xs text-slate-500 block italic">(Ký, ghi rõ họ tên)</span>
                <div className="h-16 flex items-end justify-center">
                  <span className="text-xs sm:text-sm font-bold text-indigo-700 border-t border-dashed border-slate-300 pt-1 w-36">
                    Trần Trưởng Kho
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs sm:text-sm font-bold text-slate-900 block">Người Nhận Hàng</span>
                <span className="text-xs text-slate-500 block italic">(Ký, ghi rõ họ tên)</span>
                <div className="h-16 flex items-end justify-center">
                  <span className="text-xs sm:text-sm font-medium text-slate-400 border-t border-dashed border-slate-300 pt-1 w-36">
                    (Ký nhận)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 print:hidden">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-xs sm:text-sm font-bold border border-slate-300 transition-colors cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4 text-indigo-600" />
            <span>In Chứng Từ Này</span>
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-md shadow-indigo-200"
          >
            Đóng Lại
          </button>
        </div>
      </div>
    </div>
  );
};
