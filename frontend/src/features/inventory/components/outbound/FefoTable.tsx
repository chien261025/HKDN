import React from 'react';
import { Eye, MapPin, AlertTriangle } from 'lucide-react';
import { OrderItem } from '../../types';

interface FefoTableProps {
  orders: OrderItem[];
  onSelectOrder: (order: OrderItem) => void;
}

export const FefoTable: React.FC<FefoTableProps> = ({ orders, onSelectOrder }) => {
  return (
    <div className="overflow-x-auto px-4 pb-4">
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
                {/* Mã đơn */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span className="font-mono font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200 text-xs">
                    {order.code}
                  </span>
                </td>

                {/* Khách hàng */}
                <td className="py-3.5 px-4">
                  <div className="font-semibold text-slate-900 text-sm">{order.customer}</div>
                </td>

                {/* Sản phẩm */}
                <td className="py-3.5 px-4">
                  <div className="font-semibold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors" title={order.productName}>
                    {order.productName}
                  </div>
                  <div className="inline-block mt-0.5 font-mono text-xs font-medium text-slate-500">
                    {order.productSku}
                  </div>
                </td>

                {/* Số lượng */}
                <td className="py-3.5 px-4 text-center font-semibold text-slate-900 tabular-nums text-sm whitespace-nowrap">
                  {order.qty} SP
                </td>

                {/* Thước đo HSD FEFO */}
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

                {/* Vị Trí Ô Kệ */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span className="bg-slate-100/90 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200/80 font-mono text-xs font-semibold inline-flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{order.locationBarcode}</span>
                  </span>
                </td>

                {/* Trạng thái */}
                <td className="py-3.5 px-4 text-center whitespace-nowrap">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full border ${
                      order.status === 'PENDING'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : order.status === 'RESERVED'
                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        order.status === 'PENDING'
                          ? 'bg-amber-500'
                          : order.status === 'RESERVED'
                          ? 'bg-blue-500'
                          : 'bg-emerald-500'
                      }`}
                    ></span>
                    {order.status === 'PENDING'
                      ? 'Chờ Xử Lý'
                      : order.status === 'RESERVED'
                      ? 'Đã Giữ Hàng'
                      : 'Đã Xuất Kho'}
                  </span>
                </td>

                {/* Thao tác */}
                <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onSelectOrder(order)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs transition-colors cursor-pointer shadow-2xs"
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
  );
};
