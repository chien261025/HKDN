import React from 'react';
import { ShieldCheck, FileText, CheckCircle2, Hash, Calendar, MapPin, Package, User, Printer, Copy, X } from 'lucide-react';

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
  const [copied, setCopied] = React.useState(false);

  const handleCopyHash = () => {
    navigator.clipboard.writeText(entry.hashSignature);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-[#0b1120] rounded-3xl max-w-2xl w-full border border-indigo-500/40 shadow-2xl shadow-indigo-950/50 overflow-hidden text-slate-100 relative">
        {/* Glowing top line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-600"></div>

        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-start justify-between bg-slate-900/50">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg text-white tracking-wide">CHỨNG TỪ SỔ CÁI THẺ KHO ĐIỆN TỬ</h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  IMMUTABLE (BẤT BIẾN)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                <span>Mã bút toán: <strong className="text-white font-mono">{entry.id}</strong></span>
                <span>•</span>
                <span className="font-mono text-cyan-300">{entry.timestamp}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Certificate Badge Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-indigo-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-200">Giao dịch đã được ghi sổ kế toán kho vĩnh viễn</p>
                <p className="text-[11px] text-slate-400">
                  Thỏa mãn quy tắc toàn vẹn <span className="text-cyan-400 font-mono">APPEND-ONLY</span>. Không có quyền sửa hoặc xóa.
                </p>
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-xl text-xs font-mono font-bold border ${
                entry.transactionType === 'INBOUND'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : entry.transactionType === 'OUTBOUND'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  : entry.transactionType === 'ADJUSTMENT'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
              }`}
            >
              {entry.transactionType === 'INBOUND'
                ? 'NHẬP KHO (INBOUND)'
                : entry.transactionType === 'OUTBOUND'
                ? 'XUẤT KHO (OUTBOUND)'
                : entry.transactionType === 'ADJUSTMENT'
                ? 'CÂN ĐỐI KHO (AUDIT)'
                : 'ĐIỀU CHUYỂN (TRANSFER)'}
            </span>
          </div>

          {/* Grid Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Sản phẩm & Lô */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
                <Package className="w-4 h-4 text-indigo-400" />
                <span>Mặt Hàng & Số Lô FEFO</span>
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">{entry.productName}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                    {entry.productSku}
                  </span>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    Lô: {entry.batchNumber}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 font-mono">
                  Hạn sử dụng: <strong className="text-rose-400">{entry.expiryDate}</strong>
                </p>
              </div>
            </div>

            {/* Vị Trí Ô Kệ & Chứng từ */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <span>Vị Trí Ô Kệ & Mã Tham Chiếu</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Ô Kệ Vật Lý:</span>
                  <span className="font-mono font-bold text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                    {entry.locationBarcode}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Mã Tham Chiếu:</span>
                  <span className="font-mono font-bold text-indigo-300">{entry.referenceCode}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Người Thực Hiện:</span>
                  <span className="font-semibold text-slate-200 flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" /> {entry.performedBy}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Balance Change Matrix */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              Biến Động Số Dư Thẻ Kho (Double-Entry Balance Flow)
            </h4>
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <span className="text-[11px] text-slate-400 block mb-1">Tồn Trước GD</span>
                <span className="text-base font-extrabold font-mono text-slate-200">{entry.balanceBefore}</span>
              </div>

              <div
                className={`p-3 rounded-xl border ${
                  entry.qtyChange > 0
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                }`}
              >
                <span className="text-[11px] block mb-1 opacity-80">
                  {entry.transactionType === 'INBOUND'
                    ? 'Nhập Thực Tế'
                    : entry.transactionType === 'OUTBOUND'
                    ? 'Xuất Thực Tế'
                    : 'Biến Động Số Dư'}
                </span>
                <span className="text-base font-extrabold font-mono">
                  {entry.qtyChange > 0 ? `+${entry.qtyChange}` : `${entry.qtyChange}`}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30">
                <span className="text-[11px] text-indigo-300 block mb-1">Tồn Sau GD (Balance After)</span>
                <span className="text-base font-extrabold font-mono text-indigo-400">{entry.balanceAfter}</span>
              </div>
            </div>
          </div>

          {/* Digital Signature & Hash */}
          <div className="p-3.5 rounded-2xl bg-black/40 border border-slate-800 space-y-1.5 text-xs font-mono">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-indigo-400" />
                Mã Băm Toàn Vẹn (Audit Cryptographic Checksum):
              </span>
              <button
                onClick={handleCopyHash}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                <span>{copied ? 'Đã sao chép!' : 'Sao chép'}</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-300 break-all bg-slate-900/90 p-2 rounded-lg border border-slate-800">
              {entry.hashSignature}
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-slate-800/80 bg-slate-900/60 flex items-center justify-between gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Printer className="w-4 h-4 text-slate-400" />
            <span>
              {entry.transactionType === 'INBOUND'
                ? 'In Phiếu Nhập Kho'
                : entry.transactionType === 'OUTBOUND'
                ? 'In Phiếu Xuất Kho'
                : entry.transactionType === 'ADJUSTMENT'
                ? 'In Biên Bản Cân Đối'
                : 'In Thẻ Kho Điện Tử'}
            </span>
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/30 transition-all"
          >
            Đã Kiểm Tra & Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
