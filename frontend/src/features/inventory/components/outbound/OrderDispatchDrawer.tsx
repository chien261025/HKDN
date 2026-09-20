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
    <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
      {/* Drawer Top Header */}
      <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center font-bold">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-mono font-bold text-slate-900 text-lg tracking-tight">{order.code}</h3>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full border shadow-xs ${
                  order.status === 'PENDING'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : order.status === 'RESERVED'
                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}
              >
                {order.status === 'PENDING'
                  ? 'CHỜ XỬ LÝ'
                  : order.status === 'RESERVED'
                  ? 'ĐÃ GIỮ HÀNG'
                  : 'ĐÃ XUẤT KHO'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5 truncate max-w-[280px]">
              Khách nhận: <span className="text-slate-900 font-bold">{order.customer}</span>
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer border border-slate-200"
          title="Đóng bảng chi tiết (ESC)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Drawer Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Card 1: Thông tin sản phẩm & Khách nhận */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs sm:text-sm text-slate-600">
            <span className="font-semibold">Sản Phẩm Xuất Kho:</span>
            <span className="font-mono font-bold text-indigo-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs">
              {order.productSku}
            </span>
          </div>

          <div className="font-bold text-slate-900 text-base leading-snug">{order.productName}</div>

          <div className="pt-2.5 border-t border-slate-200 flex items-center justify-between text-xs sm:text-sm">
            <span className="text-slate-600 font-medium">Số lượng đơn đặt:</span>
            <span className="font-mono font-black text-amber-700 text-lg">{order.qty} Sản Phẩm</span>
          </div>
        </div>

        {/* Card 2: Lô hàng FEFO & Hạn sử dụng */}
        <div className={`p-4 rounded-2xl border shadow-xs space-y-3 ${
          isUrgent 
            ? 'bg-rose-50/70 border-rose-200' 
            : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-slate-800 flex items-center gap-1.5 font-bold">
              <Calendar className="w-4 h-4 text-indigo-600" />
              Lô Đề Xuất FEFO:
            </span>
            <span className="text-[11px] font-bold font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              HẠN DÙNG GẦN NHẤT
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-mono font-bold text-slate-900 text-base">{order.batchNumber}</div>
              <div className="text-xs text-slate-600 mt-0.5 font-medium">
                Hạn dùng: <strong className="text-rose-700 font-bold">{order.expiryDate}</strong>
              </div>
            </div>

            <div className={`text-right font-mono ${isUrgent ? 'text-rose-700' : 'text-slate-700'}`}>
              <div className="text-sm font-bold">Còn {order.daysRemaining} ngày</div>
              {isUrgent && (
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded border border-rose-300 flex items-center justify-end gap-1 mt-1 animate-pulse">
                  <AlertTriangle className="w-3 h-3 text-rose-600" /> Cận Hạn Xuất Gấp
                </span>
              )}
            </div>
          </div>

          {/* Thanh trực quan độ tươi của lô hàng */}
          <div className="pt-2">
            <div className="flex justify-between text-xs text-slate-600 font-medium mb-1.5">
              <span>Độ tươi của lô:</span>
              <span className="font-bold text-slate-900">{Math.min(100, Math.round((order.daysRemaining / 365) * 100))}% thời hạn</span>
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isUrgent 
                    ? 'bg-rose-500' 
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(10, Math.round((order.daysRemaining / 365) * 100)))}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Card 3: Vị trí ô kệ & Tuyến lấy hàng */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-slate-800 flex items-center gap-1.5 font-bold">
              <MapPin className="w-4 h-4 text-indigo-600" />
              Vị Trí Ô Kệ Lưu Trữ:
            </span>
            <span className="font-mono font-bold text-indigo-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-xs shadow-xs">
              {order.locationBarcode}
            </span>
          </div>

          <div className="text-xs text-slate-600 font-semibold">Tuyến lấy hàng tối ưu (Pick Path):</div>
          <div className="flex items-center gap-1.5 text-xs font-mono flex-wrap">
            <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 font-bold">
              Khu {order.locationBarcode.startsWith('ZA') ? 'A' : 'B'}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-indigo-600" />
            <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 font-bold">
              Dãy {order.locationBarcode.split('-')[1] || '01'}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-indigo-600" />
            <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 font-bold">
              Kệ {order.locationBarcode.split('-')[2] || 'R01'}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-indigo-600" />
            <span className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-300 text-indigo-700 font-bold shadow-xs">
              Ô {order.locationBarcode.split('-')[4] || 'B01'}
            </span>
          </div>
        </div>

        {/* Card 4: Thước đo tồn kho tại vị trí */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-200">
            <span className="text-slate-800 font-bold">Tồn Kho Tại Ô Kệ:</span>
            <span className="text-emerald-700 font-bold flex items-center gap-1.5 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              Đồng bộ thời gian thực
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium block">Tồn Kệ</span>
              <span className="text-lg font-bold font-mono text-slate-900 mt-0.5 block">{stats.onHand}</span>
            </div>
            <div className="p-3 rounded-xl bg-white border border-amber-200 shadow-xs">
              <span className="text-xs text-amber-700 font-bold block">Đang Giữ</span>
              <span className="text-lg font-bold font-mono text-amber-700 mt-0.5 block">{stats.reserved}</span>
            </div>
            <div className="p-3 rounded-xl bg-white border border-emerald-200 shadow-xs">
              <span className="text-xs text-emerald-700 font-bold block">Khả Dụng</span>
              <span className="text-lg font-bold font-mono text-emerald-700 mt-0.5 block">{stats.available}</span>
            </div>
          </div>

          {/* Mini stock ratio gauge */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-xs text-slate-600 font-mono font-medium">
              <span>Tỷ lệ chiếm dụng ô kệ:</span>
              <span className="font-bold text-amber-700">{Math.round((stats.reserved / (stats.onHand || 1)) * 100)}% đang giữ</span>
            </div>
            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-amber-500 transition-all shadow-xs"
                style={{ width: `${Math.min(100, Math.round((stats.reserved / (stats.onHand || 1)) * 100))}%` }}
              ></div>
              <div
                className="h-full bg-emerald-500 transition-all shadow-xs"
                style={{ width: `${Math.min(100, Math.round((stats.available / (stats.onHand || 1)) * 100))}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Drawer Action Bar */}
      <div className="p-5 border-t border-slate-200 bg-slate-50 space-y-2.5">
        {order.status === 'PENDING' && (
          <button
            onClick={() => onReserve(order.id)}
            className="w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-amber-200 transition-all cursor-pointer active:scale-[0.99]"
          >
            <Lock className="w-4 h-4 text-white stroke-[2.5]" />
            <span>1. Khóa & Giữ Hàng Cho Đơn ({order.qty} SP)</span>
          </button>
        )}

        {order.status === 'RESERVED' && (
          <button
            onClick={() => onShip(order.id)}
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-emerald-200 transition-all cursor-pointer active:scale-[0.99]"
          >
            <Truck className="w-4 h-4 text-white stroke-[2.5]" />
            <span>2. Xác Nhận Xuất Hàng Khỏi Kho</span>
          </button>
        )}

        {order.status === 'SHIPPED' && (
          <button
            onClick={() => onViewLedger(order)}
            className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-indigo-200 transition-all cursor-pointer active:scale-[0.99]"
          >
            <FileText className="w-4 h-4 text-white stroke-[2.5]" />
            <span>In & Xem Phiếu Xuất Kho</span>
          </button>
        )}

        <button
          onClick={onClose}
          className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 font-bold text-xs sm:text-sm transition-colors cursor-pointer border border-slate-300 shadow-xs"
        >
          Đóng Lại
        </button>
      </div>
    </div>
  );
};
