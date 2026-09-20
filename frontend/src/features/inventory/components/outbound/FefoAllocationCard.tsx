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
    <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200 shadow-sm space-y-5">
      {/* Tiêu đề gọn gàng & trực quan */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 font-black text-xs">
            2
          </div>
          <div>
            <h2 className="text-xs md:text-sm font-bold text-slate-900 tracking-wide uppercase">
              Bước 2: Chi Tiết Đơn Hàng & Vị Trí Lấy Hàng
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 font-bold flex items-center gap-1.5">
            <PackageCheck className="w-4 h-4 text-emerald-600" />
            Lô Xuất Ưu Tiên (FEFO)
          </span>
        </div>
      </div>

      {/* 3 Cột thông tin rõ ràng: Sản phẩm & Lô • Vị trí lấy hàng • Tồn kho tại ô kệ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* CỘT 1: SẢN PHẨM & LÔ HÀNG XUẤT */}
        <div className="p-4.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-mono mb-1">
              <span className="font-sans font-medium">Sản Phẩm Xuất:</span>
              <span className="text-indigo-700 font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                {order.productSku}
              </span>
            </div>
            <div className="font-bold text-slate-900 text-sm leading-snug">{order.productName}</div>
            <div className="text-xs text-slate-500 mt-1">
              Khách nhận: <span className="text-slate-800 font-semibold">{order.customer}</span>
            </div>
          </div>

          <div className="pt-2.5 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Lô hàng xuất:</span>
              <span className="text-xs font-bold font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                HẾT HẠN TRƯỚC
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="font-mono font-bold text-slate-900 text-xs">{order.batchNumber}</span>
              <span className="text-rose-700 font-mono text-xs font-bold">
                HSD: {order.expiryDate}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              (Còn {order.daysRemaining} ngày hạn sử dụng ➔ Tự động đề xuất xuất trước)
            </p>
          </div>
        </div>

        {/* CỘT 2: VỊ TRÍ Ô KỆ & HƯỚNG DẪN LẤY HÀNG */}
        <div className="p-4.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
              <span className="flex items-center gap-1.5 font-bold text-slate-700">
                <MapPin className="w-4 h-4 text-indigo-600" />
                Vị Trí Ô Kệ:
              </span>
              <span className="font-mono text-indigo-700 font-black text-xs bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200">
                {order.locationBarcode}
              </span>
            </div>

            <div className="mt-2 text-xs text-slate-500 font-medium">Đường đi lấy hàng:</div>
            <div className="flex items-center gap-1 text-xs font-mono text-slate-800 mt-1 flex-wrap">
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

          <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">Số lượng cần lấy:</span>
            <span className="font-mono font-black text-indigo-700 text-sm">
              {order.qty} sản phẩm
            </span>
          </div>
        </div>

        {/* CỘT 3: TỒN KHO TẠI VỊ TRÍ */}
        <div className="p-4.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 pb-1.5 border-b border-slate-200">
            <span className="font-medium text-slate-700">Tồn Kho Tại Ô Kệ:</span>
            <span className="text-emerald-700 font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Đang Cập Nhật
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center py-1">
            <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <div className="text-xs text-slate-500 font-medium">Tồn Thực Tế</div>
              <div className="text-base font-black font-mono text-slate-900 mt-0.5">{stats.onHand}</div>
            </div>

            <div className={`p-2.5 rounded-xl border shadow-2xs ${stats.reserved > 0 ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-white border-slate-200 text-slate-500'}`}>
              <div className="text-xs font-medium">Đang Giữ</div>
              <div className="text-base font-black font-mono mt-0.5">{stats.reserved > 0 ? `${stats.reserved}` : '0'}</div>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 shadow-2xs">
              <div className="text-xs font-medium">Khả Dụng</div>
              <div className="text-base font-black font-mono mt-0.5">{stats.available}</div>
            </div>
          </div>

          <div className="text-xs text-slate-500 text-center pt-1 border-t border-slate-200 font-medium">
            Khả dụng = Tồn thực tế ({stats.onHand}) - Đang giữ ({stats.reserved})
          </div>
        </div>
      </div>

      {/* BƯỚC 3: THAO TÁC XUẤT KHO TRỰC TIẾP */}
      <div className="pt-3 border-t border-slate-100">
        <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-900 uppercase">
          <div className="w-6 h-6 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono text-xs flex items-center justify-center font-black">
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
                ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm cursor-pointer active:scale-[0.99]'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
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
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm cursor-pointer active:scale-[0.99]'
                : order.status === 'SHIPPED'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
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
              className="py-3 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm flex-shrink-0 cursor-pointer"
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
