import React from 'react';
import {
  PackageCheck,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Eye,
  Lock,
  Truck,
  ArrowRight,
  Flame
} from 'lucide-react';
import { OutboundOrder } from '../types';

interface OutboundOrderTableProps {
  orders: OutboundOrder[];
  onSelectOrder: (order: OutboundOrder) => void;
  onAllocateAndLock: (orderId: string) => void;
  onDispatchOrder: (orderId: string) => void;
}

export const OutboundOrderTable: React.FC<OutboundOrderTableProps> = ({
  orders,
  onSelectOrder,
  onAllocateAndLock,
  onDispatchOrder,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden">
      {/* Table Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-2.5">
          <PackageCheck className="w-5 h-5 text-amber-600" />
          <h2 className="text-sm sm:text-base font-bold text-slate-900 uppercase tracking-wider">
            Danh Sách Đơn Xuất Bán (Sales Orders / SO)
          </h2>
        </div>
        <span className="text-xs font-mono font-bold text-slate-700 bg-white px-3 py-1 rounded-full border border-slate-300 shadow-2xs">
          {orders.length} Đơn SO
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-800 font-bold text-xs uppercase border-b border-slate-300">
            <tr>
              <th className="py-3.5 px-4">Mã Đơn SO / Khách Hàng</th>
              <th className="py-3.5 px-4">Hạn Giao Hàng</th>
              <th className="py-3.5 px-4">Mặt Hàng & Quy Mô</th>
              <th className="py-3.5 px-4">Tiến Độ Quy Trình</th>
              <th className="py-3.5 px-4">Trạng Thái & Khóa</th>
              <th className="py-3.5 px-4 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-800 font-sans">
            {orders.map((order) => {
              const isPending = order.status === 'PENDING';
              const isAllocated = order.status === 'ALLOCATED';
              const isPicking = order.status === 'PICKING';
              const isDispatched = order.status === 'DISPATCHED';

              const totalRequested = order.items.reduce((sum, it) => sum + it.requestedQty, 0);

              let progressPercent = 20;
              if (isAllocated) progressPercent = 50;
              if (isPicking) progressPercent = 75;
              if (isDispatched) progressPercent = 100;

              return (
                <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                  {/* Mã đơn & Khách hàng */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 text-sm sm:text-base">{order.soCode}</span>
                      {order.priority === 'URGENT' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300">
                          <Flame className="w-3 h-3 text-rose-600" /> HỎA TỐC
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-600 font-medium line-clamp-1 mt-0.5">{order.customerName}</div>
                  </td>

                  {/* Ngày giao */}
                  <td className="py-4 px-4 font-mono text-xs sm:text-sm">
                    <div className="text-slate-900 font-semibold">{order.requiredDate}</div>
                    <div className="text-xs text-slate-500 mt-0.5">Tạo: {order.orderDate}</div>
                  </td>

                  {/* Mặt hàng */}
                  <td className="py-4 px-4 font-mono text-xs sm:text-sm">
                    <div className="text-slate-900 font-bold">
                      {order.items.length} mặt hàng
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5 font-sans font-medium">
                      Tổng: <strong className="text-amber-800 font-mono font-bold">{totalRequested}</strong> đơn vị
                    </div>
                  </td>

                  {/* Tiến độ */}
                  <td className="py-4 px-4">
                    <div className="w-44 space-y-1.5">
                      <div className="flex justify-between text-xs font-mono text-slate-700 font-medium">
                        <span>
                          {isPending && '1. Chờ duyệt'}
                          {isAllocated && '2. Đã khóa FEFO'}
                          {isPicking && '3. Đang nhặt hàng'}
                          {isDispatched && '4. Đã xuất kho'}
                        </span>
                        <span className="font-bold text-amber-800">{progressPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 rounded-full ${
                            isDispatched
                              ? 'bg-emerald-500'
                              : isPicking
                              ? 'bg-indigo-600'
                              : isAllocated
                              ? 'bg-amber-500'
                              : 'bg-slate-400'
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>

                  {/* Trạng thái & Khóa */}
                  <td className="py-4 px-4 font-mono text-xs">
                    {isPending && (
                      <span className="inline-flex items-center gap-1.5 text-amber-800 bg-amber-50 px-3 py-1 rounded-lg border border-amber-300 font-bold">
                        <Clock className="w-3.5 h-3.5 text-amber-600" /> PENDING
                      </span>
                    )}
                    {isAllocated && (
                      <span className="inline-flex items-center gap-1.5 text-indigo-800 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-300 font-bold">
                        <Lock className="w-3.5 h-3.5 text-indigo-600" /> LOCKED (FEFO)
                      </span>
                    )}
                    {isPicking && (
                      <span className="inline-flex items-center gap-1.5 text-blue-800 bg-blue-50 px-3 py-1 rounded-lg border border-blue-300 font-bold">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> PICKING
                      </span>
                    )}
                    {isDispatched && (
                      <span className="inline-flex items-center gap-1.5 text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-300 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> DISPATCHED
                      </span>
                    )}
                  </td>

                  {/* Thao tác */}
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {isPending && (
                        <button
                          onClick={() => onAllocateAndLock(order.id)}
                          className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                          title="Kích hoạt Pessimistic Lock & sinh Pick List FEFO"
                        >
                          <Lock className="w-3.5 h-3.5 text-amber-700" />
                          <span>Duyệt & Khóa FEFO</span>
                        </button>
                      )}

                      {(isAllocated || isPicking) && (
                        <button
                          onClick={() => onDispatchOrder(order.id)}
                          className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                          title="Hoàn tất xuất kho & trừ số dư tồn"
                        >
                          <Truck className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Xuất Kho</span>
                        </button>
                      )}

                      <button
                        onClick={() => onSelectOrder(order)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Pick List</span>
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
