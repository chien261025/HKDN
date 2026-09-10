import React from 'react';
import { CheckCircle2, MapPin, ArrowRight, Lock, Truck, FileText } from 'lucide-react';
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
    <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800 space-y-3.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          2. Phân tích FEFO & Vị trí lấy hàng
        </span>
        <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Đã quét hạn dùng tối ưu
        </span>
      </div>

      {/* Thông tin mặt hàng đang chọn */}
      <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/80 text-xs">
        <p className="text-slate-400 text-[11px]">Sản phẩm cần xuất:</p>
        <h3 className="text-sm font-bold text-white mt-0.5">{order.productName}</h3>
        <p className="text-slate-400 font-mono text-[11px] mt-1">
          Mã SKU: <span className="text-indigo-300">{order.productSku}</span> | Khách nhận:{' '}
          <span className="text-slate-300">{order.customer}</span>
        </p>
      </div>

      {/* So sánh Lô FEFO (nếu có 2 lô để đối chiếu) */}
      {order.alternateBatch && (
        <div className="space-y-2">
          <p className="text-[11px] text-slate-400">So sánh các lô hàng trong kho:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Lô Cận Date Được Chọn */}
            <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-white">{order.batchNumber}</span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  FEFO CHỌN
                </span>
              </div>
              <div className="text-[11px] text-rose-300 font-mono">
                HSD: {order.expiryDate} (Còn {order.daysRemaining} ngày)
              </div>
              <p className="text-[10px] text-slate-400">Hạn gần nhất ➔ Xuất trước chống hỏng.</p>
            </div>

            {/* Lô Xa Date Được Giữ Lại */}
            <div className="p-2.5 rounded-xl bg-slate-950/30 border border-slate-800 text-xs space-y-1 opacity-75">
              <div className="flex items-center justify-between">
                <span className="font-mono text-slate-300">{order.alternateBatch.batchNumber}</span>
                <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                  LƯU KHO
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                HSD: {order.alternateBatch.expiryDate} (Còn {order.alternateBatch.daysRemaining} ngày)
              </div>
              <p className="text-[10px] text-slate-500">Hạn còn dài ➔ Giữ lại kho an toàn.</p>
            </div>
          </div>
        </div>
      )}

      {/* Lộ trình nhặt hàng chỉ dẫn */}
      <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-300 font-medium flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            Chỉ định ô kệ lấy hàng:
          </span>
          <span className="font-mono text-cyan-300 font-bold bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/50">
            {order.locationBarcode}
          </span>
        </div>
        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
          <span>Lộ trình:</span>
          <span className="text-slate-300">Zone B</span>
          <ArrowRight className="w-3 h-3 text-slate-500" />
          <span className="text-slate-300">Dãy B01</span>
          <ArrowRight className="w-3 h-3 text-slate-500" />
          <span className="text-slate-300">Kệ R01</span>
          <ArrowRight className="w-3 h-3 text-slate-500" />
          <span className="text-cyan-300 font-bold">Ô B05 (Lấy {order.qty} cái)</span>
        </div>
      </div>

      {/* Hai Nút Thao Tác Trật Tự & Rõ Ràng */}
      <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
        {/* Nút 1: Khóa giữ hàng */}
        <button
          onClick={onReserve}
          disabled={order.status !== 'PENDING'}
          className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            order.status === 'PENDING'
              ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-900/20 cursor-pointer'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>
            {order.status === 'PENDING'
              ? `1. Khóa Giữ ${order.qty} Cái (Reserve)`
              : 'Đã Khóa Giữ Hàng'}
          </span>
        </button>

        {/* Nút 2: Xuất kho */}
        <button
          onClick={onShip}
          disabled={order.status !== 'RESERVED'}
          className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            order.status === 'RESERVED'
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/20 cursor-pointer'
              : order.status === 'SHIPPED'
              ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>
            {order.status === 'SHIPPED'
              ? 'Đã Xuất Kho Thành Công'
              : '2. Xuất Kho (Ship Order)'}
          </span>
        </button>
      </div>

      {/* Nút Xem lại phiếu thẻ kho nếu đã xuất */}
      {order.status === 'SHIPPED' && (
        <button
          onClick={onViewLedger}
          className="w-full py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Xem Phiếu Thẻ Kho Của Đơn Này</span>
        </button>
      )}
    </div>
  );
};
