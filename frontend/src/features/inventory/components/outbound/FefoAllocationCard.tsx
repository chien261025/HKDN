import React from 'react';
import { MapPin, ArrowRight, Lock, Truck, FileText, CheckCircle2, PackageCheck } from 'lucide-react';
import { OrderItem, InventoryStats } from '../../types';

interface FefoAllocationCardProps {
  order: OrderItem;
  stats: InventoryStats;
  onReserve: () => void;
  onShip: () => void;
  onViewLedger: () => void;
}

export const FefoAllocationCard: React.FC<FefoAllocationCardProps> = ({
  order,
  stats,
  onReserve,
  onShip,
  onViewLedger,
}) => {
  return (
    <div className="bg-[#0b101f]/90 backdrop-blur-xl rounded-2xl p-4 md:p-6 border border-slate-800/80 shadow-xl space-y-5">
      {/* Tiêu đề gọn gàng & trực quan */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/60">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xs">
            2
          </div>
          <div>
            <h2 className="text-xs md:text-sm font-bold text-white tracking-wide uppercase">
              Bước 2: Chi Tiết Đơn Hàng & Vị Trí Lấy Hàng
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30 font-semibold flex items-center gap-1.5">
            <PackageCheck className="w-3.5 h-3.5 text-emerald-400" />
            Lô Xuất Ưu Tiên (FEFO)
          </span>
        </div>
      </div>

      {/* 3 Cột thông tin rõ ràng: Sản phẩm & Lô • Vị trí lấy hàng • Tồn kho tại ô kệ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* CỘT 1: SẢN PHẨM & LÔ HÀNG XUẤT */}
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/70 space-y-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-1">
              <span>Sản Phẩm Xuất:</span>
              <span className="text-cyan-300 font-bold bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                {order.productSku}
              </span>
            </div>
            <div className="font-bold text-white text-sm leading-snug">{order.productName}</div>
            <div className="text-[11px] text-slate-400 mt-1">
              Khách nhận: <span className="text-slate-200 font-medium">{order.customer}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/60">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400">Lô hàng xuất:</span>
              <span className="text-[10px] font-bold font-mono text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                HẾT HẠN TRƯỚC
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="font-mono font-bold text-white text-xs">{order.batchNumber}</span>
              <span className="text-rose-300 font-mono text-[11px] font-bold">
                HSD: {order.expiryDate}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              (Còn {order.daysRemaining} ngày hạn sử dụng ➔ Tự động đề xuất xuất trước)
            </p>
          </div>
        </div>

        {/* CỘT 2: VỊ TRÍ Ô KỆ & HƯỚNG DẪN LẤY HÀNG */}
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/70 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span className="flex items-center gap-1.5 font-medium">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                Vị Trí Ô Kệ:
              </span>
              <span className="font-mono text-cyan-300 font-bold text-xs bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-700/50">
                {order.locationBarcode}
              </span>
            </div>

            <div className="mt-2 text-[11px] text-slate-400">Đường đi lấy hàng:</div>
            <div className="flex items-center gap-1 text-[11px] font-mono text-slate-200 mt-1 flex-wrap">
              <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                Khu {order.locationBarcode.startsWith('ZA') ? 'A' : 'B'}
              </span>
              <ArrowRight className="w-3 h-3 text-slate-500" />
              <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                Dãy {order.locationBarcode.split('-')[1] || '01'}
              </span>
              <ArrowRight className="w-3 h-3 text-slate-500" />
              <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                Kệ {order.locationBarcode.split('-')[2] || 'R01'}
              </span>
              <ArrowRight className="w-3 h-3 text-slate-500" />
              <span className="px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-600 text-cyan-300 font-bold">
                Ô {order.locationBarcode.split('-')[4] || 'B01'}
              </span>
            </div>
          </div>

          <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/60 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Số lượng cần lấy:</span>
            <span className="font-mono font-black text-cyan-300 text-sm">
              {order.qty} sản phẩm
            </span>
          </div>
        </div>

        {/* CỘT 3: TỒN KHO TẠI VỊ TRÍ */}
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/70 space-y-2 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-slate-400 pb-1 border-b border-slate-800/50">
            <span>Tồn Kho Tại Ô Kệ:</span>
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Đang Cập Nhật
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center py-1">
            <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800">
              <div className="text-[10px] text-slate-400">Tồn Thực Tế</div>
              <div className="text-base font-extrabold font-mono text-white mt-0.5">{stats.onHand}</div>
            </div>

            <div className={`p-2 rounded-lg border ${stats.reserved > 0 ? 'bg-amber-950/30 border-amber-500/40 text-amber-300' : 'bg-slate-950/80 border-slate-800 text-slate-400'}`}>
              <div className="text-[10px]">Đang Giữ</div>
              <div className="text-base font-extrabold font-mono mt-0.5">{stats.reserved > 0 ? `${stats.reserved}` : '0'}</div>
            </div>

            <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-500/40 text-emerald-300">
              <div className="text-[10px]">Khả Dụng</div>
              <div className="text-base font-extrabold font-mono mt-0.5">{stats.available}</div>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 text-center pt-1 border-t border-slate-800/50">
            Khả dụng = Tồn thực tế ({stats.onHand}) - Đang giữ ({stats.reserved})
          </div>
        </div>
      </div>

      {/* BƯỚC 3: THAO TÁC XUẤT KHO TRỰC TIẾP */}
      <div className="pt-2 border-t border-slate-800/60">
        <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-300 uppercase">
          <div className="w-5 h-5 rounded-md bg-indigo-600/20 text-indigo-400 font-mono text-[10px] flex items-center justify-center">
            3
          </div>
          <span>Bước 3: Thao Tác Xuất Kho</span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Nút 1: Giữ hàng */}
          <button
            onClick={onReserve}
            disabled={order.status !== 'PENDING'}
            className={`flex-1 w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              order.status === 'PENDING'
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/30 cursor-pointer active:scale-[0.99]'
                : 'bg-slate-900 text-slate-500 cursor-not-allowed border border-slate-800'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>
              {order.status === 'PENDING'
                ? `1. Giữ Hàng (${order.qty} SP)`
                : 'Đã Giữ Hàng Thành Công'}
            </span>
          </button>

          {/* Nút 2: Xuất kho */}
          <button
            onClick={onShip}
            disabled={order.status !== 'RESERVED'}
            className={`flex-1 w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              order.status === 'RESERVED'
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30 cursor-pointer active:scale-[0.99]'
                : order.status === 'SHIPPED'
                ? 'bg-slate-900 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-900 text-slate-500 cursor-not-allowed border border-slate-800'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>
              {order.status === 'SHIPPED'
                ? 'Đã Xuất Kho Thành Công'
                : '2. Xác Nhận Xuất Kho'}
            </span>
          </button>

          {/* Nút 3: Xem phiếu xuất */}
          {order.status === 'SHIPPED' && (
            <button
              onClick={onViewLedger}
              className="py-3 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-indigo-900/30 flex-shrink-0 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>In / Xem Phiếu Xuất</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
