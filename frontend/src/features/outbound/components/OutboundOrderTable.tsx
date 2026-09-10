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
    <div className="bg-[#0b101d]/90 backdrop-blur-xl rounded-2xl border border-slate-800/80 shadow-xl overflow-hidden">
      {/* Table Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
        <div className="flex items-center gap-2">
          <PackageCheck className="w-4 h-4 text-amber-400" />
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">
            Danh Sách Đơn Xuất Bán (Sales Orders / SO)
          </h2>
        </div>
        <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700">
          {orders.length} Đơn SO
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/80 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Mã Đơn SO / Khách Hàng</th>
              <th className="py-3 px-4">Hạn Giao Hàng</th>
              <th className="py-3 px-4">Mặt Hàng & Quy Mô</th>
              <th className="py-3 px-4">Tiến Độ Quy Trình</th>
              <th className="py-3 px-4">Trạng Thái & Khóa</th>
              <th className="py-3 px-4 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
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
                <tr key={order.id} className="hover:bg-slate-800/30 transition-colors">
                  {/* Mã đơn & Khách hàng */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-sm">{order.soCode}</span>
                      {order.priority === 'URGENT' && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          <Flame className="w-2.5 h-2.5" /> HỎA TỐC
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 line-clamp-1">{order.customerName}</div>
                  </td>

                  {/* Ngày giao */}
                  <td className="py-3.5 px-4 font-mono text-[11px]">
                    <div className="text-slate-300">{order.requiredDate}</div>
                    <div className="text-[10px] text-slate-500">Tạo: {order.orderDate}</div>
                  </td>

                  {/* Mặt hàng */}
                  <td className="py-3.5 px-4 font-mono text-[11px]">
                    <div className="text-white font-semibold">
                      {order.items.length} mặt hàng
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Tổng: <strong className="text-amber-400">{totalRequested}</strong> đơn vị
                    </div>
                  </td>

                  {/* Tiến độ */}
                  <td className="py-3.5 px-4">
                    <div className="w-40 space-y-1">
                      <div className="flex justify-between text-[10px] font-mono text-slate-400">
                        <span>
                          {isPending && '1. Chờ duyệt'}
                          {isAllocated && '2. Đã khóa FEFO'}
                          {isPicking && '3. Đang nhặt hàng'}
                          {isDispatched && '4. Đã xuất kho'}
                        </span>
                        <span className="font-bold text-amber-400">{progressPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
                        <div
                          className={`h-full transition-all duration-300 rounded-full ${
                            isDispatched
                              ? 'bg-emerald-400'
                              : isPicking
                              ? 'bg-indigo-400'
                              : isAllocated
                              ? 'bg-cyan-400'
                              : 'bg-amber-400'
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>

                  {/* Trạng thái & Khóa */}
                  <td className="py-3.5 px-4 font-mono text-[11px]">
                    {isPending && (
                      <span className="inline-flex items-center gap-1 text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 font-bold">
                        <Clock className="w-3 h-3" /> PENDING
                      </span>
                    )}
                    {isAllocated && (
                      <span className="inline-flex items-center gap-1 text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20 font-bold">
                        <Lock className="w-3 h-3" /> LOCKED (FEFO)
                      </span>
                    )}
                    {isPicking && (
                      <span className="inline-flex items-center gap-1 text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20 font-bold">
                        <ShieldCheck className="w-3 h-3" /> PICKING
                      </span>
                    )}
                    {isDispatched && (
                      <span className="inline-flex items-center gap-1 text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 font-bold">
                        <CheckCircle2 className="w-3 h-3" /> DISPATCHED
                      </span>
                    )}
                  </td>

                  {/* Thao tác */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {isPending && (
                        <button
                          onClick={() => onAllocateAndLock(order.id)}
                          className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1"
                          title="Kích hoạt Pessimistic Lock & sinh Pick List FEFO"
                        >
                          <Lock className="w-3 h-3" />
                          <span>Duyệt & Khóa FEFO</span>
                        </button>
                      )}

                      {(isAllocated || isPicking) && (
                        <button
                          onClick={() => onDispatchOrder(order.id)}
                          className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1"
                          title="Hoàn tất xuất kho & trừ số dư tồn"
                        >
                          <Truck className="w-3 h-3" />
                          <span>Xuất Kho</span>
                        </button>
                      )}

                      <button
                        onClick={() => onSelectOrder(order)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-semibold transition-colors"
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
