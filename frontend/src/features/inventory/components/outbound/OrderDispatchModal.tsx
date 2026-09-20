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
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden text-slate-900 relative">
        {/* Top line accent */}
        <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-indigo-600 to-emerald-600"></div>

        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="font-bold text-base text-slate-900 tracking-wide">
                  Chi Tiết Đơn Xuất Kho: <span className="font-mono text-indigo-700">{order.code}</span>
                </h3>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                    order.status === 'PENDING'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : order.status === 'RESERVED'
                      ? 'bg-cyan-50 text-cyan-800 border-cyan-200'
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
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Khách hàng: <strong className="text-slate-800">{order.customer}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Hàng 1: Mặt hàng & Lô hàng xuất */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Box 1: Thông tin sản phẩm */}
            <div className="p-4.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-medium">Mặt Hàng Xuất:</span>
                <span className="font-mono font-bold text-indigo-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {order.productSku}
                </span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm">{order.productName}</h4>
              <div className="pt-2 border-t border-slate-200 text-xs flex items-center justify-between">
                <span className="text-slate-500 font-medium">Số lượng cần xuất:</span>
                <span className="font-mono font-extrabold text-indigo-700 text-base">{order.qty} SP</span>
              </div>
            </div>

            {/* Box 2: Lô hàng FEFO đề xuất */}
            <div className="p-4.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-medium">Lô Hàng Xuất (FEFO):</span>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  HẾT HẠN TRƯỚC
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-slate-900 text-sm">{order.batchNumber}</span>
                <span className="font-mono font-bold text-rose-700 text-xs">HSD: {order.expiryDate}</span>
              </div>
              <p className="text-xs text-slate-500 pt-1.5 border-t border-slate-200 font-medium">
                Còn <strong className="text-amber-800 font-mono font-bold">{order.daysRemaining} ngày</strong> hạn sử dụng ➔ Tự động ưu tiên xuất.
              </p>
            </div>
          </div>

          {/* Hàng 2: Vị trí lấy hàng & Tồn kho tại ô kệ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Box 3: Vị trí ô kệ & lộ trình */}
            <div className="p-4.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="flex items-center gap-1.5 font-bold text-slate-700">
                  <MapPin className="w-4 h-4 text-indigo-600" />
                  Vị Trí Ô Kệ:
                </span>
                <span className="font-mono text-indigo-700 font-black text-xs bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200">
                  {order.locationBarcode}
                </span>
              </div>

              <div className="text-xs text-slate-500 pt-1 font-medium">Đường đi lấy hàng:</div>
              <div className="flex items-center gap-1 text-xs font-mono text-slate-700 flex-wrap">
                <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-semibold">
                  Khu {order.locationBarcode.startsWith('ZA') ? 'A' : 'B'}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-semibold">
                  Dãy {order.locationBarcode.split('-')[1] || '01'}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-semibold">
                  Kệ {order.locationBarcode.split('-')[2] || 'R01'}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-300 text-indigo-700 font-black">
                  Ô {order.locationBarcode.split('-')[4] || 'B01'}
                </span>
              </div>
            </div>

            {/* Box 4: Tồn kho tại vị trí */}
            <div className="p-4.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-500 pb-1 border-b border-slate-200">
                <span className="font-medium text-slate-700">Tồn Kho Tại Ô Kệ:</span>
                <span className="text-emerald-700 text-xs font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Thời gian thực
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center py-1">
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <div className="text-xs text-slate-500 font-medium">Tồn Kệ</div>
                  <div className="text-sm font-extrabold font-mono text-slate-900 mt-0.5">{stats.onHand}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                  <div className="text-xs text-slate-500 font-medium">Đang Giữ</div>
                  <div className="text-sm font-extrabold font-mono text-amber-700 mt-0.5">{stats.reserved}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 shadow-2xs">
                  <div className="text-xs text-emerald-700 font-medium">Khả Dụng</div>
                  <div className="text-sm font-extrabold font-mono text-emerald-800 mt-0.5">{stats.available}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-5 border-t border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* Nút 1: Giữ hàng */}
            {order.status === 'PENDING' && (
              <button
                onClick={onReserve}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
              >
                <Lock className="w-4 h-4" />
                <span>Giữ Hàng ({order.qty} SP)</span>
              </button>
            )}

            {/* Nút 2: Xuất kho */}
            {order.status === 'RESERVED' && (
              <button
                onClick={onShip}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
              >
                <Truck className="w-4 h-4" />
                <span>Xác Nhận Xuất Kho ({order.qty} SP)</span>
              </button>
            )}

            {/* Nút 3: Xem phiếu xuất */}
            {order.status === 'SHIPPED' && (
              <button
                onClick={onViewLedger}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-95"
              >
                <FileText className="w-4 h-4" />
                <span>In / Xem Phiếu Xuất</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 text-xs font-bold border border-slate-300 transition-colors cursor-pointer shadow-2xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
