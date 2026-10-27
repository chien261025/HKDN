import React from 'react';
import {
  Clock,
  ShieldCheck,
  CheckCircle2,
  Eye,
  Lock,
  Truck,
  Flame,
  Navigation,
} from 'lucide-react';
import { OutboundOrder } from '../types';

interface OutboundMobileCardsProps {
  orders: OutboundOrder[];
  onSelectOrder: (order: OutboundOrder) => void;
  onAllocateAndLock: (orderId: string) => void;
  onDispatchOrder: (orderId: string) => void;
  onOpenPickPath?: (order: OutboundOrder) => void;
}

export const OutboundMobileCards: React.FC<OutboundMobileCardsProps> = ({
  orders,
  onSelectOrder,
  onAllocateAndLock,
  onDispatchOrder,
  onOpenPickPath,
}) => {
  if (orders.length === 0) {
    return <div className="text-center py-8 text-xs text-slate-400">Không có đơn xuất kho nào.</div>;
  }

  return (
    <div className="block md:hidden divide-y divide-slate-100 p-2 sm:p-3 space-y-2.5">
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
          <div key={order.id} className="bg-slate-50/60 rounded-xl p-3.5 border border-slate-200/80 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-mono font-bold text-sm text-slate-900">{order.soCode}</span>
                  {order.priority === 'URGENT' && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-700">
                      <Flame className="w-3 h-3 text-rose-600" /> HỎA TỐC
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-600 line-clamp-1 mt-0.5">{order.customerName}</span>
              </div>

              {isPending && (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 shrink-0">
                  <Clock className="w-3 h-3" /> PENDING
                </span>
              )}
              {isAllocated && (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200 shrink-0">
                  <Lock className="w-3 h-3" /> FEFO
                </span>
              )}
              {isPicking && (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 shrink-0">
                  <ShieldCheck className="w-3 h-3" /> PICKING
                </span>
              )}
              {isDispatched && (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 shrink-0">
                  <CheckCircle2 className="w-3 h-3" /> DISPATCHED
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200/60">
              <div>
                <span className="text-slate-400 block text-[11px]">Hạn giao:</span>
                <span className="font-semibold text-slate-800">{order.requiredDate}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Quy mô:</span>
                <span className="font-semibold text-slate-800 font-mono">
                  {order.items.length} SKU ({totalRequested} sp)
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono text-slate-600">
                <span>
                  {isPending && '1. Chờ duyệt'}
                  {isAllocated && '2. Khóa FEFO'}
                  {isPicking && '3. Nhặt hàng'}
                  {isDispatched && '4. Xuất kho'}
                </span>
                <span className="font-bold text-amber-700">{progressPercent}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    isDispatched ? 'bg-emerald-500' : isPicking ? 'bg-indigo-600' : isAllocated ? 'bg-amber-500' : 'bg-slate-400'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5 pt-1 flex-wrap">
              {isPending && (
                <button
                  onClick={() => onAllocateAndLock(order.id)}
                  className="flex-1 py-2 px-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Khóa FEFO</span>
                </button>
              )}
              {(isAllocated || isPicking) && (
                <button
                  onClick={() => onDispatchOrder(order.id)}
                  className="flex-1 py-2 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Xuất Kho</span>
                </button>
              )}
              {onOpenPickPath && (
                <button
                  onClick={() => onOpenPickPath(order)}
                  className="py-2 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Lộ Trình</span>
                </button>
              )}
              <button
                onClick={() => onSelectOrder(order)}
                className="py-2 px-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span>Chi Tiết</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
