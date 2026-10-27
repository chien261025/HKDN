import React from 'react';
import {
  PackagePlus,
  Clock,
  Truck,
  CheckCircle2,
  ChevronRight,
  Eye,
  FileText,
  Printer
} from 'lucide-react';
import { InboundOrder } from '../types';

interface InboundOrderListProps {
  orders: InboundOrder[];
  onSelectOrder: (order: InboundOrder) => void;
  onAdvanceStatus: (orderId: string) => void;
}

export const InboundOrderList: React.FC<InboundOrderListProps> = ({
  orders,
  onSelectOrder,
  onAdvanceStatus,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Table Title Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
            <PackagePlus className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              Danh Sách Đơn Nhập Kho (Purchase Orders)
            </h2>
            <p className="text-xs text-slate-500 hidden sm:block">Theo dõi tiến độ từ vận chuyển đến cất kệ</p>
          </div>
        </div>
        <span className="text-xs font-mono font-semibold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
          {orders.length} Đơn PO
        </span>
      </div>

      {/* MOBILE CARD VIEW (Block on mobile < 768px) */}
      <div className="block md:hidden divide-y divide-slate-100 p-2 sm:p-3 space-y-2.5">
        {orders.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">Không có đơn nhập kho nào.</div>
        ) : (
          orders.map((order) => {
            const isPending = order.status === 'PENDING';
            const isReceived = order.status === 'RECEIVED';
            const isStocked = order.status === 'STOCKED';
            const totalExpected = order.items.reduce((sum, it) => sum + it.expectedQty, 0);

            let progressPercent = 15;
            if (isReceived) progressPercent = 60;
            if (isStocked) progressPercent = 100;

            return (
              <div
                key={order.id}
                className="bg-slate-50/60 rounded-xl p-3.5 border border-slate-200/80 space-y-3"
              >
                {/* Header row: Code + Status Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono font-bold text-sm text-slate-900 block">{order.poCode}</span>
                    <span className="text-xs text-slate-600 line-clamp-1 mt-0.5">{order.supplierName}</span>
                  </div>
                  {isPending && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 shrink-0">
                      <Clock className="w-3 h-3" /> PENDING
                    </span>
                  )}
                  {isReceived && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200 shrink-0">
                      <Truck className="w-3 h-3" /> RECEIVED
                    </span>
                  )}
                  {isStocked && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 shrink-0">
                      <CheckCircle2 className="w-3 h-3" /> STOCKED
                    </span>
                  )}
                </div>

                {/* Info row */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200/60">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Hạn giao hàng:</span>
                    <span className="font-semibold text-slate-800">{order.expectedDeliveryDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Quy mô:</span>
                    <span className="font-semibold text-slate-800 font-mono">
                      {order.items.length} SKU ({totalExpected} sp)
                    </span>
                  </div>
                </div>

                {/* Progress */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono text-slate-600">
                    <span>
                      {isPending && '1. Chờ xe tải'}
                      {isReceived && '2. Tại khu đệm'}
                      {isStocked && '3. Đã cất kệ'}
                    </span>
                    <span className="font-bold text-indigo-600">{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        isStocked ? 'bg-emerald-500' : isReceived ? 'bg-indigo-600' : 'bg-amber-500'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1">
                  {isPending && (
                    <button
                      onClick={() => onAdvanceStatus(order.id)}
                      className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      Nhận Vào Đệm
                    </button>
                  )}
                  {isReceived && (
                    <button
                      onClick={() => onAdvanceStatus(order.id)}
                      className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      Cất Lên Kệ
                    </button>
                  )}
                  <button
                    onClick={() => onSelectOrder(order)}
                    className="flex-1 py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Chi Tiết</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DESKTOP TABLE VIEW (Hidden on mobile < 768px) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 font-semibold text-xs border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Mã Đơn PO / Nhà Cung Cấp</th>
              <th className="py-3 px-4">Ngày Giao Hàng</th>
              <th className="py-3 px-4">Quy Mô Hàng Hóa</th>
              <th className="py-3 px-4">Tiến Độ Quy Trình</th>
              <th className="py-3 px-4">Trạng Thái</th>
              <th className="py-3 px-4 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {orders.map((order) => {
              const isPending = order.status === 'PENDING';
              const isReceived = order.status === 'RECEIVED';
              const isStocked = order.status === 'STOCKED';
              const totalExpected = order.items.reduce((sum, it) => sum + it.expectedQty, 0);

              let progressPercent = 15;
              if (isReceived) progressPercent = 60;
              if (isStocked) progressPercent = 100;

              return (
                <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-mono font-bold text-slate-900 text-sm">{order.poCode}</div>
                    <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">{order.supplierName}</div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs">
                    <div className="text-slate-900 font-semibold">{order.expectedDeliveryDate}</div>
                    <div className="text-xs text-slate-400 mt-0.5">Tạo: {order.createdAt}</div>
                  </td>
                  <td className="py-3.5 px-4 text-xs">
                    <div className="text-slate-900 font-semibold font-mono">{order.items.length} mặt hàng</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Tổng: <strong className="text-indigo-600 font-mono font-bold">{totalExpected}</strong> đơn vị
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="w-40 space-y-1">
                      <div className="flex justify-between text-xs font-mono text-slate-600">
                        <span>
                          {isPending && '1. Chờ xe tải'}
                          {isReceived && '2. Tại khu đệm'}
                          {isStocked && '3. Đã cất kệ'}
                        </span>
                        <span className="font-semibold text-indigo-600">{progressPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isStocked ? 'bg-emerald-500' : isReceived ? 'bg-indigo-600' : 'bg-amber-500'
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs">
                    {isPending && (
                      <span className="inline-flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 font-semibold">
                        <Clock className="w-3.5 h-3.5 text-amber-600" /> PENDING
                      </span>
                    )}
                    {isReceived && (
                      <span className="inline-flex items-center gap-1.5 text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 font-semibold">
                        <Truck className="w-3.5 h-3.5 text-indigo-600" /> RECEIVED
                      </span>
                    )}
                    {isStocked && (
                      <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> STOCKED
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {isPending && (
                        <button
                          onClick={() => onAdvanceStatus(order.id)}
                          className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Nhận Vào Đệm
                        </button>
                      )}
                      {isReceived && (
                        <button
                          onClick={() => onAdvanceStatus(order.id)}
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Cất Lên Kệ
                        </button>
                      )}
                      <button
                        onClick={() => onSelectOrder(order)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>Chi Tiết</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
