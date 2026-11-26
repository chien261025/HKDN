import React from 'react';
import { CheckCircle2, PackageCheck } from 'lucide-react';
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
  // Chỉ hiển thị các đơn xuất kho đang chờ nhặt hoặc đang phân bổ (loại bỏ hoàn toàn các đơn đã xuất hoặc đã hủy)
  const pendingOrders = orders.filter((o) => o.status === 'ALLOCATED' || o.status === 'PICKING' || o.status === 'PENDING');

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-2.5 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Chọn Đơn Xuất Kho (SO)
        </span>
        <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
          {pendingOrders.length} ĐƠN CHỜ NHẶT
        </span>
      </div>

      {pendingOrders.length === 0 ? (
        <div className="p-4 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          Hiện tại không có đơn xuất kho nào đang chờ nhặt hàng.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 pt-1 max-h-56 overflow-y-auto pr-0.5">
          {pendingOrders.map((o) => {
            const isSelected = selectedOrder?.id === o.id;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => onSelectOrder(o)}
                className={`p-2.5 rounded-xl text-left border transition-all text-xs cursor-pointer relative ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-200 shadow-xs'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-1">
                  <div className="font-mono font-extrabold text-slate-900 truncate">{o.orderCode}</div>
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                </div>
                <div className="text-xs text-slate-600 font-medium mt-0.5 truncate" title={o.customerName}>
                  {o.customerName || 'Khách hàng'}
                </div>
                <div className="mt-1.5 flex items-center justify-between pt-1 border-t border-slate-200/60">
                  <span
                    className={`text-2xs font-extrabold px-1.5 py-0.2 rounded font-mono ${
                      o.status === 'ALLOCATED'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {o.status === 'ALLOCATED' ? 'ĐÃ PHÂN BỔ' : 'CHỜ NHẶT'}
                  </span>
                  <span className="text-2xs text-slate-500 font-mono font-bold">
                    {o.items?.length || 0} món
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
