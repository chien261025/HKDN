import React from 'react';
import { OutboundOrderDto } from '../../services/operatorService';

interface PickingOrderSelectorProps {
  orders: OutboundOrderDto[];
  selectedOrder: OutboundOrderDto | null;
  onSelectOrder: (order: OutboundOrderDto) => void;
}

export const PickingOrderSelector: React.FC<PickingOrderSelectorProps> = ({
  orders,
  selectedOrder,
  onSelectOrder,
}) => {
  const pendingOrders = orders.filter((o) => o.status !== 'DISPATCHED');

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-2 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-800 uppercase">Chọn Đơn Xuất Kho (SO)</span>
        <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
          {pendingOrders.length} ĐƠN CHỜ
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1">
        {orders.slice(0, 4).map((o) => (
          <button
            key={o.id}
            onClick={() => onSelectOrder(o)}
            className={`p-2.5 rounded-xl text-left border transition-all text-xs cursor-pointer ${
              selectedOrder?.id === o.id
                ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-100'
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
            }`}
          >
            <div className="font-mono font-bold text-slate-900">{o.orderCode}</div>
            <div className="text-xs text-slate-500 mt-0.5 truncate">{o.customerName || 'Khách hàng'}</div>
            <div className="mt-1 flex items-center justify-between">
              <span
                className={`text-2xs font-bold px-1.5 py-0.5 rounded ${
                  o.status === 'DISPATCHED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {o.status}
              </span>
              <span className="text-2xs text-slate-400 font-mono">{o.items?.length || 0} món</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
