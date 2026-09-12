import React from 'react';
import { OrderItem } from '../../types';
import { Check } from 'lucide-react';

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
    <div className="bg-slate-900/60 rounded-2xl p-4 border border-slate-800 space-y-3 shadow-sm">
      {/* Header khối */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-[11px] font-mono">
            1
          </span>
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
            Danh Sách Lệnh Xuất Kho Chờ Cấp Phát (Outbound Orders)
          </span>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">Chọn đơn hàng SO để kích hoạt phân bổ FEFO</span>
      </div>

      {/* Danh sách thẻ đơn */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {orders.map((order) => {
          const isSelected = order.id === selectedOrderId;
          return (
            <button
              key={order.id}
              onClick={() => onSelectOrder(order.id)}
              className={`p-3 rounded-xl border text-left transition-all relative ${
                isSelected
                  ? 'bg-indigo-950/30 border-indigo-500/80 text-white shadow-md shadow-indigo-950/40 ring-1 ring-indigo-500/30'
                  : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-300'
              }`}
            >
              {/* Header của thẻ đơn */}
              <div className="flex items-center justify-between font-mono text-xs">
                <span className={isSelected ? 'text-cyan-300 font-bold' : 'text-slate-300 font-semibold'}>
                  {order.code}
                </span>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full font-sans ${
                      order.status === 'SHIPPED'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : order.status === 'RESERVED'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-750'
                    }`}
                  >
                    {order.status === 'SHIPPED'
                      ? 'Đã Xuất Kho (Dispatched)'
                      : order.status === 'RESERVED'
                      ? 'Đã Khóa Tồn (Allocated)'
                      : 'Chờ Cấp Phát (Pending)'}
                  </span>

                  {isSelected && (
                    <span className="w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  )}
                </div>
              </div>

              {/* Tên khách hàng */}
              <p className="text-xs font-semibold text-slate-200 mt-1.5 truncate">{order.customer}</p>

              {/* Footer thẻ đơn */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-mono pt-1.5 border-t border-slate-850">
                <span>
                  Cần xuất: <strong className="text-white font-bold">{order.qty}</strong> cái
                </span>
                <span className="text-indigo-300 font-medium">{order.productSku}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
