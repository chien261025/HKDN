import React from 'react';
import { OrderItem } from '../../types';
import { Check, Package, Clock, CheckCircle2, ShoppingBag } from 'lucide-react';

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
    <div className="bg-[#0b101f]/90 backdrop-blur-xl rounded-2xl p-4 md:p-5 border border-slate-800/80 shadow-lg space-y-3">
      {/* Header gọn gàng */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-800/60">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center text-xs">
            1
          </span>
          <h2 className="text-xs md:text-sm font-bold text-white tracking-wide">
            Đơn Hàng Chờ Xuất Kho
          </h2>
        </div>
        <span className="text-xs text-slate-400">
          {orders.length} đơn hàng
        </span>
      </div>

      {/* Danh sách thẻ đơn nằm ngang thoáng mắt */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {orders.map((order) => {
          const isSelected = order.id === selectedOrderId;
          return (
            <div
              key={order.id}
              onClick={() => onSelectOrder(order.id)}
              className={`p-3 rounded-xl border text-left cursor-pointer transition-all relative flex flex-col justify-between gap-2 ${
                isSelected
                  ? 'bg-indigo-950/40 border-indigo-500/80 shadow-md shadow-indigo-950/50 ring-1 ring-indigo-500/40'
                  : 'bg-slate-900/40 border-slate-800 hover:bg-slate-900/80 hover:border-slate-700'
              }`}
            >
              {/* Row 1: Mã đơn & Trạng thái */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`font-mono text-xs font-bold ${isSelected ? 'text-cyan-300' : 'text-white'}`}>
                    {order.code}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                    {order.productSku}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      order.status === 'SHIPPED'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : order.status === 'RESERVED'
                        ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {order.status === 'SHIPPED' ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        Đã Xuất Kho
                      </>
                    ) : order.status === 'RESERVED' ? (
                      <>
                        <Clock className="w-3 h-3" />
                        Đã Giữ Hàng
                      </>
                    ) : (
                      'Chờ Xử Lý'
                    )}
                  </span>

                  {isSelected && (
                    <span className="w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center flex-shrink-0">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  )}
                </div>
              </div>

              {/* Row 2: Khách hàng & Số lượng */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/40">
                <div className="text-slate-300 font-medium truncate max-w-[200px]" title={order.customer}>
                  {order.customer}
                </div>
                <div className="font-mono text-right flex-shrink-0">
                  <span className="text-slate-400 text-[11px]">Xuất: </span>
                  <span className="text-white font-black text-sm">{order.qty}</span>
                  <span className="text-slate-400 text-[11px]"> SP</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
