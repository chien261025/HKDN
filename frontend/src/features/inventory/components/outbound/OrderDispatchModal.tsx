import React from 'react';
import { X, MapPin, ArrowRight, Lock, Truck, FileText, Package, User, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { OrderItem, InventoryStats } from '../../types';

interface OrderDispatchModalProps {
  order: OrderItem;
  stats: InventoryStats;
  onClose: () => void;
  onReserve: () => void;
  onShip: () => void;
  onViewLedger: () => void;
}

export const OrderDispatchModal: React.FC<OrderDispatchModalProps> = ({
  order,
  stats,
  onClose,
  onReserve,
  onShip,
  onViewLedger,
}) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-[#0f172a] rounded-2xl max-w-3xl w-full border border-slate-700 shadow-2xl overflow-hidden text-slate-100 relative">
        {/* Top line accent */}
        <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-indigo-500 to-emerald-500"></div>

        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="font-bold text-base text-white tracking-wide">
                  Chi Tiết Đơn Xuất Kho: <span className="font-mono text-cyan-300">{order.code}</span>
                </h3>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    order.status === 'PENDING'
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      : order.status === 'RESERVED'
                      ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                      : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  }`}
                >
                  {order.status === 'PENDING'
                    ? 'CHỜ XỬ LÝ'
                    : order.status === 'RESERVED'
                    ? 'ĐÃ GIỮ HÀNG'
                    : 'ĐÃ XUẤT KHO'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Khách hàng: <strong className="text-slate-200">{order.customer}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Hàng 1: Mặt hàng & Lô hàng xuất */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Box 1: Thông tin sản phẩm */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Mặt Hàng Xuất:</span>
                <span className="font-mono font-bold text-cyan-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  {order.productSku}
                </span>
              </div>
              <h4 className="font-bold text-white text-sm">{order.productName}</h4>
              <div className="pt-2 border-t border-slate-800 text-xs flex items-center justify-between">
                <span className="text-slate-400">Số lượng cần xuất:</span>
                <span className="font-mono font-extrabold text-cyan-300 text-base">{order.qty} SP</span>
              </div>
            </div>

            {/* Box 2: Lô hàng FEFO đề xuất */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Lô Hàng Xuất (FEFO):</span>
                <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                  HẾT HẠN TRƯỚC
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-white text-sm">{order.batchNumber}</span>
                <span className="font-mono font-bold text-rose-300 text-xs">HSD: {order.expiryDate}</span>
              </div>
              <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                Còn <strong className="text-amber-300 font-mono">{order.daysRemaining} ngày</strong> hạn sử dụng ➔ Tự động ưu tiên xuất.
              </p>
            </div>
          </div>

          {/* Hàng 2: Vị trí lấy hàng & Tồn kho tại ô kệ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Box 3: Vị trí ô kệ & lộ trình */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  Vị Trí Ô Kệ:
                </span>
                <span className="font-mono text-cyan-300 font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-700/50">
                  {order.locationBarcode}
                </span>
              </div>

              <div className="text-[11px] text-slate-400 pt-1">Đường đi lấy hàng:</div>
              <div className="flex items-center gap-1 text-[11px] font-mono text-slate-200 flex-wrap">
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

            {/* Box 4: Tồn kho tại vị trí */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-1 border-b border-slate-800">
                <span>Tồn Kho Tại Ô Kệ:</span>
                <span className="text-emerald-400 text-[11px] font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Thời gian thực
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center py-1">
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Tồn Kệ</div>
                  <div className="text-sm font-extrabold font-mono text-white mt-0.5">{stats.onHand}</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Đang Giữ</div>
                  <div className="text-sm font-extrabold font-mono text-amber-400 mt-0.5">{stats.reserved}</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400">Khả Dụng</div>
                  <div className="text-sm font-extrabold font-mono text-emerald-400 mt-0.5">{stats.available}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-5 border-t border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Nút 1: Giữ hàng */}
            {order.status === 'PENDING' && (
              <button
                onClick={onReserve}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-900/30 transition-all cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Giữ Hàng ({order.qty} SP)</span>
              </button>
            )}

            {/* Nút 2: Xuất kho */}
            {order.status === 'RESERVED' && (
              <button
                onClick={onShip}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all cursor-pointer"
              >
                <Truck className="w-4 h-4" />
                <span>Xác Nhận Xuất Kho ({order.qty} SP)</span>
              </button>
            )}

            {/* Nút 3: Xem phiếu xuất */}
            {order.status === 'SHIPPED' && (
              <button
                onClick={onViewLedger}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/30 transition-all cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>In / Xem Phiếu Xuất</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
