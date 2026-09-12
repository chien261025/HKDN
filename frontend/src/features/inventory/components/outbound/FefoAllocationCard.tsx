import React from 'react';
import { CheckCircle2, MapPin, ArrowRight, Lock, Truck, FileText, Calendar, Sparkles } from 'lucide-react';
import { OrderItem } from '../../types';

interface FefoAllocationCardProps {
  order: OrderItem;
  onReserve: () => void;
  onShip: () => void;
  onViewLedger: () => void;
}

export const FefoAllocationCard: React.FC<FefoAllocationCardProps> = ({
  order,
  onReserve,
  onShip,
  onViewLedger,
}) => {
  return (
    <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800 space-y-3.5 shadow-sm">
      {/* Header Khối */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center text-[11px] font-mono">
            2
          </span>
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
            Chiến Lược Điều Phối FEFO & Lộ Trình Lấy Hàng (Pick Path)
          </span>
        </div>
        <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1.5 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-mono">
          <Sparkles className="w-3 h-3 text-emerald-400" />
          FEFO Optimized
        </span>
      </div>

      {/* Thông tin mặt hàng đang chọn */}
      <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-1">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400 font-medium">Mặt hàng cần xuất:</span>
          <span className="font-mono font-bold text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
            {order.productSku}
          </span>
        </div>
        <h3 className="text-sm font-bold text-white tracking-tight">{order.productName}</h3>
        <p className="text-[11px] text-slate-400 font-sans">
          Giao cho khách: <strong className="text-slate-200">{order.customer}</strong>
        </p>
      </div>

      {/* So sánh Lô FEFO (nếu có 2 lô để đối chiếu) */}
      {order.alternateBatch && (
        <div className="space-y-2">
          <p className="text-[11px] text-slate-400 font-medium">So sánh các lô hàng có sẵn trong kho:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Lô Cận Date Được Chọn */}
            <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/40 text-xs space-y-1.5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-white">{order.batchNumber}</span>
                <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  FEFO Ưu Tiên Xuất
                </span>
              </div>
              <div className="text-[11px] text-rose-300 font-mono font-semibold flex items-center gap-1">
                <Calendar className="w-3 h-3 text-rose-400" />
                <span>HSD: {order.expiryDate} (Còn {order.daysRemaining} ngày)</span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Lô cận date nhất ➔ Xuất trước để bảo vệ chất lượng hàng hóa.
              </p>
            </div>

            {/* Lô Xa Date Được Giữ Lại */}
            <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 text-xs space-y-1.5 opacity-80">
              <div className="flex items-center justify-between">
                <span className="font-mono text-slate-300 font-medium">{order.alternateBatch.batchNumber}</span>
                <span className="text-[10px] font-medium text-slate-400 bg-slate-850 px-2 py-0.5 rounded-full border border-slate-750">
                  Lưu Kho An Toàn
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-500" />
                <span>HSD: {order.alternateBatch.expiryDate} (Còn {order.alternateBatch.daysRemaining} ngày)</span>
              </div>
              <p className="text-[11px] text-slate-500 font-sans">
                Hạn còn dài ➔ Giữ lại kho, bảo toàn thời hạn lưu kho cho đơn sau.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Lộ trình nhặt hàng chỉ dẫn */}
      <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-300 font-medium flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            Vị trí ô kệ lấy hàng:
          </span>
          <span className="font-mono text-cyan-300 font-bold bg-cyan-950/40 px-2.5 py-0.5 rounded-lg border border-cyan-800/50 text-xs">
            {order.locationBarcode}
          </span>
        </div>

        {/* Breadcrumb Lộ Trình Sạch Sẽ */}
        <div className="flex items-center gap-1.5 text-xs font-mono overflow-x-auto pb-0.5">
          <span className="text-slate-400 text-[11px] font-sans font-medium mr-1">Lộ trình:</span>
          <span className="px-2 py-0.5 rounded bg-slate-850 text-slate-200 border border-slate-750 text-[11px]">
            Zone B
          </span>
          <ArrowRight className="w-3 h-3 text-slate-500 flex-shrink-0" />
          <span className="px-2 py-0.5 rounded bg-slate-850 text-slate-200 border border-slate-750 text-[11px]">
            Dãy B01
          </span>
          <ArrowRight className="w-3 h-3 text-slate-500 flex-shrink-0" />
          <span className="px-2 py-0.5 rounded bg-slate-850 text-slate-200 border border-slate-750 text-[11px]">
            Kệ R01
          </span>
          <ArrowRight className="w-3 h-3 text-slate-500 flex-shrink-0" />
          <span className="px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-700/60 font-bold text-[11px]">
            Ô B05 (Lấy {order.qty} cái)
          </span>
        </div>
      </div>

      {/* Hai Nút Thao Tác Trật Tự & Rõ Ràng */}
      <div className="pt-1.5 flex flex-col sm:flex-row gap-2.5">
        {/* Nút 1: Khóa giữ hàng */}
        <button
          onClick={onReserve}
          disabled={order.status !== 'PENDING'}
          className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            order.status === 'PENDING'
              ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-900/30 cursor-pointer active:scale-[0.99]'
              : 'bg-slate-850 text-slate-500 cursor-not-allowed border border-slate-800'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>
            {order.status === 'PENDING'
              ? `1. Khóa Cấp Phát ${order.qty} SP (Reserve Stock)`
              : 'Đã Khóa Cấp Phát (Allocated)'}
          </span>
        </button>

        {/* Nút 2: Xuất kho */}
        <button
          onClick={onShip}
          disabled={order.status !== 'RESERVED'}
          className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            order.status === 'RESERVED'
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/30 cursor-pointer active:scale-[0.99]'
              : order.status === 'SHIPPED'
              ? 'bg-slate-850 text-emerald-400 border border-emerald-500/30'
              : 'bg-slate-850 text-slate-500 cursor-not-allowed border border-slate-800'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>
            {order.status === 'SHIPPED'
              ? 'Đã Xuất Kho Hoàn Tất (Dispatched)'
              : '2. Xác Nhận Xuất Kho & Ghi Sổ (Confirm Dispatch)'}
          </span>
        </button>
      </div>

      {/* Nút Xem lại phiếu thẻ kho nếu đã xuất */}
      {order.status === 'SHIPPED' && (
        <button
          onClick={onViewLedger}
          className="w-full py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
        >
          <FileText className="w-4 h-4" />
          <span>Truy Xuất Chứng Từ Sổ Cái Điện Tử (View Stock Ledger)</span>
        </button>
      )}
    </div>
  );
};
