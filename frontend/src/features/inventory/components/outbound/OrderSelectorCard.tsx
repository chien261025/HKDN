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
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3.5">
      {/* Header gọn gàng */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 font-black flex items-center justify-center text-xs border border-indigo-200">
            1
          </span>
          <h2 className="text-xs md:text-sm font-bold text-slate-900 uppercase tracking-wide">
            Đơn Hàng Chờ Xuất Kho
          </h2>
        </div>
        <span className="text-xs text-slate-500 font-medium">
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
              className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all relative flex flex-col justify-between gap-2.5 ${
                isSelected
                  ? 'bg-indigo-50/70 border-indigo-500 shadow-sm ring-1 ring-indigo-400'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80 hover:border-slate-300'
              }`}
            >
              {/* Row 1: Mã đơn & Trạng thái */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`font-mono text-xs font-bold ${isSelected ? 'text-indigo-700' : 'text-slate-900'}`}>
                    {order.code}
                  </span>
                  <span className="text-xs font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 font-medium">
                    {order.productSku}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border ${
                      order.status === 'SHIPPED'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : order.status === 'RESERVED'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-slate-200 text-slate-700 border-slate-300'
                    }`}
                  >
                    {order.status === 'SHIPPED' ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Đã Xuất Kho
                      </>
                    ) : order.status === 'RESERVED' ? (
                      <>
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        Đã Giữ Hàng
                      </>
                    ) : (
                      'Chờ Xử Lý'
                    )}
                  </span>

                  {isSelected && (
                    <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  )}
                </div>
              </div>

              {/* Row 2: Khách hàng & Số lượng */}
              <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200/80">
                <div className="text-slate-700 font-semibold truncate max-w-[200px]" title={order.customer}>
                  {order.customer}
                </div>
                <div className="font-mono text-right flex-shrink-0">
                  <span className="text-slate-500 font-medium text-xs">Xuất: </span>
                  <span className="text-slate-900 font-black text-sm">{order.qty}</span>
                  <span className="text-slate-500 font-medium text-xs"> SP</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
