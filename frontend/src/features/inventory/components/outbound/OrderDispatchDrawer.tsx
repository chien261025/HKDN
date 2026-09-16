import React from 'react';
import { X, MapPin, ArrowRight, Lock, Truck, FileText, Package, Calendar, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { OrderItem, InventoryStats } from '../../types';

interface OrderDispatchDrawerProps {
  order: OrderItem | null;
  stats: InventoryStats;
  onClose: () => void;
  onReserve: (orderId: string) => void;
  onShip: (orderId: string) => void;
  onViewLedger: (order: OrderItem) => void;
}

export const OrderDispatchDrawer: React.FC<OrderDispatchDrawerProps> = ({
  order,
  stats,
  onClose,
  onReserve,
  onShip,
  onViewLedger,
}) => {
  if (!order) return null;

  const isUrgent = order.daysRemaining < 30;

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-[#0b1222] border-l border-slate-700 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
      {/* Drawer Top Header - Rực rỡ & Sắc nét */}
      <div className="p-5 border-b border-slate-700 flex items-center justify-between bg-slate-900/95 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-500/40">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-mono font-black text-white text-lg tracking-tight">{order.code}</h3>
              <span
                className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border shadow-sm ${
                  order.status === 'PENDING'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-400/60 shadow-amber-900/30'
                    : order.status === 'RESERVED'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/60 shadow-cyan-900/30'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/60 shadow-emerald-900/30'
                }`}
              >
                {order.status === 'PENDING'
                  ? 'CHỜ XỬ LÝ'
                  : order.status === 'RESERVED'
                  ? 'ĐÃ GIỮ HÀNG'
                  : 'ĐÃ XUẤT KHO'}
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-0.5 truncate max-w-[280px]">
              Khách nhận: <span className="text-white font-bold">{order.customer}</span>
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer border border-slate-700/60"
          title="Đóng bảng chi tiết (ESC)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Drawer Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Card 1: Thông tin sản phẩm & Khách nhận */}
        <div className="p-4 rounded-2xl bg-[#111c33] border border-slate-700/80 shadow-lg space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="font-bold">Sản Phẩm Xuất Kho:</span>
            <span className="font-mono font-bold text-cyan-300 bg-cyan-950/80 px-2.5 py-1 rounded-lg border border-cyan-500/50 shadow-sm">
              {order.productSku}
            </span>
          </div>

          <div className="font-extrabold text-white text-base leading-snug">{order.productName}</div>

          <div className="pt-2.5 border-t border-slate-700/80 flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">Số lượng đơn đặt:</span>
            <span className="font-mono font-black text-amber-300 text-lg">{order.qty} Sản Phẩm</span>
          </div>
        </div>

        {/* Card 2: Lô hàng FEFO & Hạn sử dụng */}
        <div className={`p-4 rounded-2xl border shadow-lg space-y-3 ${
          isUrgent 
            ? 'bg-gradient-to-br from-rose-950/40 via-slate-900 to-[#111c33] border-rose-500/60' 
            : 'bg-[#111c33] border-slate-700/80'
        }`}>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-200 flex items-center gap-1.5 font-bold">
              <Calendar className="w-4 h-4 text-indigo-400" />
              Lô Đề Xuất FEFO:
            </span>
            <span className="text-[10px] font-black font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/60 shadow-sm">
              HẠN DÙNG GẦN NHẤT
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-mono font-black text-white text-base">{order.batchNumber}</div>
              <div className="text-xs text-slate-300 mt-0.5 font-medium">
                Hạn dùng: <strong className="text-rose-300 font-bold">{order.expiryDate}</strong>
              </div>
            </div>

            <div className={`text-right font-mono ${isUrgent ? 'text-rose-300' : 'text-slate-200'}`}>
              <div className="text-sm font-black">Còn {order.daysRemaining} ngày</div>
              {isUrgent && (
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/40 flex items-center justify-end gap-1 mt-1 animate-pulse">
                  <AlertTriangle className="w-3 h-3 text-rose-400" /> Cận Hạn Xuất Gấp
                </span>
              )}
            </div>
          </div>

          {/* Thanh trực quan độ tươi của lô hàng */}
          <div className="pt-2">
            <div className="flex justify-between text-[11px] text-slate-300 font-medium mb-1.5">
              <span>Độ tươi của lô:</span>
              <span className="font-bold text-white">{Math.min(100, Math.round((order.daysRemaining / 365) * 100))}% thời hạn</span>
            </div>
            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full rounded-full transition-all ${
                  isUrgent 
                    ? 'bg-gradient-to-r from-rose-600 to-amber-500' 
                    : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                }`}
                style={{ width: `${Math.min(100, Math.max(10, Math.round((order.daysRemaining / 365) * 100)))}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Card 3: Vị trí ô kệ & Tuyến lấy hàng */}
        <div className="p-4 rounded-2xl bg-[#111c33] border border-slate-700/80 shadow-lg space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-200 flex items-center gap-1.5 font-bold">
              <MapPin className="w-4 h-4 text-cyan-400" />
              Vị Trí Ô Kệ Lưu Trữ:
            </span>
            <span className="font-mono font-black text-cyan-300 bg-cyan-950 px-2.5 py-1 rounded-lg border border-cyan-400/60 text-xs shadow-sm">
              {order.locationBarcode}
            </span>
          </div>

          <div className="text-[11px] text-slate-300 font-semibold">Tuyến lấy hàng tối ưu (Pick Path):</div>
          <div className="flex items-center gap-1.5 text-xs font-mono flex-wrap">
            <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 font-bold">
              Khu {order.locationBarcode.startsWith('ZA') ? 'A' : 'B'}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
            <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 font-bold">
              Dãy {order.locationBarcode.split('-')[1] || '01'}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
            <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-100 font-bold">
              Kệ {order.locationBarcode.split('-')[2] || 'R01'}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
            <span className="px-2.5 py-1 rounded-lg bg-indigo-950 border border-indigo-500 text-indigo-300 font-black shadow-sm">
              Ô {order.locationBarcode.split('-')[4] || 'B01'}
            </span>
          </div>
        </div>

        {/* Card 4: Thước đo tồn kho tại vị trí */}
        <div className="p-4 rounded-2xl bg-[#111c33] border border-slate-700/80 shadow-lg space-y-3">
          <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-700">
            <span className="text-slate-200 font-bold">Tồn Kho Tại Ô Kệ:</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1.5 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Đồng bộ thời gian thực
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 shadow-inner">
              <span className="text-[10px] text-slate-400 font-bold block">Tồn Kệ</span>
              <span className="text-lg font-black font-mono text-white mt-0.5 block">{stats.onHand}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-amber-500/30 shadow-inner">
              <span className="text-[10px] text-amber-400 font-bold block">Đang Giữ</span>
              <span className="text-lg font-black font-mono text-amber-300 mt-0.5 block">{stats.reserved}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-emerald-500/30 shadow-inner">
              <span className="text-[10px] text-emerald-400 font-bold block">Khả Dụng</span>
              <span className="text-lg font-black font-mono text-emerald-400 mt-0.5 block">{stats.available}</span>
            </div>
          </div>

          {/* Mini stock ratio gauge */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[11px] text-slate-300 font-mono font-medium">
              <span>Tỷ lệ chiếm dụng ô kệ:</span>
              <span className="font-bold text-amber-300">{Math.round((stats.reserved / (stats.onHand || 1)) * 100)}% đang giữ</span>
            </div>
            <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
              <div
                className="h-full bg-amber-500 transition-all shadow-sm"
                style={{ width: `${Math.min(100, Math.round((stats.reserved / (stats.onHand || 1)) * 100))}%` }}
              ></div>
              <div
                className="h-full bg-emerald-500 transition-all shadow-sm"
                style={{ width: `${Math.min(100, Math.round((stats.available / (stats.onHand || 1)) * 100))}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Drawer Action Bar - Đậm Đà & Rực Rỡ Sắc Màu */}
      <div className="p-5 border-t border-slate-700 bg-slate-900/95 space-y-2.5 shadow-2xl">
        {order.status === 'PENDING' && (
          <button
            onClick={() => onReserve(order.id)}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-amber-500/30 transition-all cursor-pointer active:scale-[0.99]"
          >
            <Lock className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            <span>1. Khóa & Giữ Hàng Cho Đơn ({order.qty} SP)</span>
          </button>
        )}

        {order.status === 'RESERVED' && (
          <button
            onClick={() => onShip(order.id)}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/30 transition-all cursor-pointer active:scale-[0.99]"
          >
            <Truck className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            <span>2. Xác Nhận Xuất Hàng Khỏi Kho</span>
          </button>
        )}

        {order.status === 'SHIPPED' && (
          <button
            onClick={() => onViewLedger(order)}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/40 transition-all cursor-pointer active:scale-[0.99]"
          >
            <FileText className="w-4 h-4 text-white stroke-[2.5]" />
            <span>In & Xem Phiếu Xuất Kho</span>
          </button>
        )}

        <button
          onClick={onClose}
          className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs transition-colors cursor-pointer border border-slate-700"
        >
          Đóng Lại
        </button>
      </div>
    </div>
  );
};
