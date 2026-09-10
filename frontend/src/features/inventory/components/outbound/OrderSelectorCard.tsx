import React from 'react';
import { OrderItem } from '../../types';

interface OrderSelectorCardProps {
  orders: OrderItem[];
  selectedOrderId: string;
  onSelectOrder: (orderId: string) => void;
}

export const OrderSelectorCard: React.FC<OrderSelectorCardProps> = ({
  orders,
  selectedOrderId,
  onSelectOrder,
}) => {
  return (
    <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800 space-y-3">
      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
        1. Chọn đơn hàng xuất kho
      </span>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {orders.map((order) => {
          const isSelected = order.id === selectedOrderId;
          return (
            <button
              key={order.id}
              onClick={() => onSelectOrder(order.id)}
              className={`p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'bg-indigo-600/10 border-indigo-500 text-white shadow-sm'
                  : 'bg-slate-850/40 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between font-mono text-xs">
                <span className={isSelected ? 'text-indigo-400 font-bold' : 'text-slate-300 font-medium'}>
                  {order.code}
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    order.status === 'SHIPPED'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : order.status === 'RESERVED'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {order.status === 'SHIPPED'
                    ? 'Đã xuất kho'
                    : order.status === 'RESERVED'
                    ? 'Đã giữ hàng'
                    : 'Chờ xử lý'}
                </span>
              </div>

              <p className="text-xs font-semibold text-slate-200 mt-1.5 truncate">{order.customer}</p>

              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-mono">
                <span>SL: <strong className="text-white">{order.qty}</strong></span>
                <span className="text-slate-300">{order.productSku}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
