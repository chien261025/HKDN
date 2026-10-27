import React from 'react';
import { Eye, MapPin, AlertTriangle, ChevronRight } from 'lucide-react';
import { OrderItem } from '../../types';

interface FefoTableProps {
  orders: OrderItem[];
  onSelectOrder: (order: OrderItem) => void;
}

export const FefoTable: React.FC<FefoTableProps> = ({ orders, onSelectOrder }) => {
  const getStatusBadge = (status: OrderItem['status']) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Chờ Giữ Hàng
          </span>
        );
      case 'RESERVED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Đã Giữ Hàng
          </span>
        );
      case 'SHIPPED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Đã Xuất Kho
          </span>
        );
    }
  };

  return (
    <div>
      {/* Mobile Card Feed (< md) */}
      <div className="block md:hidden p-3 space-y-3 bg-slate-50/70">
        {orders.length === 0 ? (
          <div className="p-8 text-center text-slate-400 italic text-sm bg-white rounded-xl">
            Không tìm thấy đơn hàng nào.
          </div>
        ) : (
          orders.map((order) => {
            const isUrgent = order.daysRemaining < 30;

            return (
              <div
                key={order.id}
                onClick={() => onSelectOrder(order)}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-2.5 active:bg-slate-50 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200 text-xs">
                    {order.code}
                  </span>
                  {getStatusBadge(order.status)}
                </div>

                <div>
                  <div className="font-semibold text-slate-900 text-sm">{order.productName}</div>
                  <div className="text-xs text-slate-500 mt-0.5 flex items-center justify-between">
                    <span>Khách: <strong className="text-slate-700">{order.customer}</strong></span>
                    <span className="font-mono font-bold text-slate-900">{order.qty} SP</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Vị trí:</span>
                    <span className="font-mono font-bold text-indigo-700">{order.locationBarcode}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Lô FEFO:</span>
                    <span className="font-mono text-slate-800 font-semibold">{order.batchNumber}</span>
                  </div>
                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-slate-500">Hạn dùng:</span>
                    <span className="flex items-center gap-1 font-mono">
                      <span>{order.expiryDate}</span>
                      {isUrgent && (
                        <span className="text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 px-1 rounded inline-flex items-center gap-0.5">
                          <AlertTriangle className="w-2.5 h-2.5 text-rose-500" /> Cận Hạn
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-indigo-600 font-medium pt-1">
                  <span>Chạm để điều phối xuất hàng</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table View (>= md) */}
      <div className="hidden md:block overflow-x-auto px-4 pb-4">
        <table className="w-full text-left text-xs sm:text-sm text-slate-800">
          <thead className="bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3 px-4 min-w-[140px] whitespace-nowrap">Mã Đơn</th>
              <th className="py-3 px-4 min-w-[180px]">Khách Hàng</th>
              <th className="py-3 px-4 min-w-[220px]">Sản Phẩm & SKU</th>
              <th className="py-3 px-4 text-center w-28 whitespace-nowrap">Số Lượng</th>
              <th className="py-3 px-4 min-w-[200px] whitespace-nowrap">Hạn Dùng & Lô FEFO</th>
              <th className="py-3 px-4 min-w-[170px] whitespace-nowrap">Vị Trí Ô Kệ</th>
              <th className="py-3 px-4 text-center w-32 whitespace-nowrap">Trạng Thái</th>
              <th className="py-3 px-4 text-right min-w-[110px] whitespace-nowrap">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans text-slate-800">
            {orders.map((order) => {
              const isUrgent = order.daysRemaining < 30;

              return (
                <tr
                  key={order.id}
                  className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                  onClick={() => onSelectOrder(order)}
                >
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-mono font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200 text-xs">
                      {order.code}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900 text-sm">{order.customer}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors" title={order.productName}>
                      {order.productName}
                    </div>
                    <div className="inline-block mt-0.5 font-mono text-xs font-medium text-slate-500">
                      {order.productSku}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-center font-semibold text-slate-900 tabular-nums text-sm whitespace-nowrap">
                    {order.qty} SP
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-800 text-xs font-semibold">{order.batchNumber}</span>
                      {isUrgent && (
                        <span className="text-[11px] font-semibold bg-rose-50 text-rose-700 px-1.5 py-0.2 rounded border border-rose-200 inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-rose-500" /> Cận Hạn
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 font-normal">
                      HSD: <span className="font-medium text-slate-700 tabular-nums">{order.expiryDate}</span> (còn {order.daysRemaining} ngày)
                    </div>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="bg-slate-100/90 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200/80 font-mono text-xs font-semibold inline-flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{order.locationBarcode}</span>
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    {getStatusBadge(order.status)}
                  </td>

                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectOrder(order);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-medium transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Chi Tiết</span>
                    </button>
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
