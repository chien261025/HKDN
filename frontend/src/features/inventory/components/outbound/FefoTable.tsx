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
        <thead className="bg-slate-100 text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
          <tr>
            <th className="py-3.5 px-4">Mã Đơn</th>
            <th className="py-3.5 px-4">Khách Hàng</th>
            <th className="py-3.5 px-4">Sản Phẩm & SKU</th>
            <th className="py-3.5 px-4 text-center">Số Lượng</th>
            <th className="py-3.5 px-4">Hạn Dùng & Lô FEFO</th>
            <th className="py-3.5 px-4">Vị Trí Ô Kệ</th>
            <th className="py-3.5 px-4 text-center">Trạng Thái</th>
            <th className="py-3.5 px-4 text-right">Thao Tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 font-sans">
          {orders.map((order) => {
            const isUrgent = order.daysRemaining < 30;

            return (
              <tr
                key={order.id}
                className="hover:bg-slate-50 transition-colors cursor-pointer group"
                onClick={() => onSelectOrder(order)}
              >
                {/* Mã đơn */}
                <td className="py-4 px-4">
                  <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 group-hover:border-indigo-400 transition-colors shadow-xs">
                    {order.code}
                  </span>
                </td>

                {/* Khách hàng */}
                <td className="py-4 px-4">
                  <div className="font-bold text-slate-900 text-sm">{order.customer}</div>
                </td>

                {/* Sản phẩm */}
                <td className="py-4 px-4">
                  <div className="font-bold text-slate-900 text-sm group-hover:text-indigo-700 transition-colors" title={order.productName}>
                    {order.productName}
                  </div>
                  <div className="inline-block mt-1 font-mono text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    {order.productSku}
                  </div>
                </td>

                {/* Số lượng */}
                <td className="py-4 px-4 text-center font-mono font-bold text-slate-900 text-base">
                  {order.qty} SP
                </td>

                {/* Thước đo HSD FEFO */}
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-900 text-xs font-bold">{order.batchNumber}</span>
                    {isUrgent && (
                      <span className="text-[11px] font-bold bg-rose-50 text-rose-700 px-2 py-0.5 rounded-md border border-rose-200 flex items-center gap-1 shadow-xs animate-pulse">
                        <AlertTriangle className="w-3 h-3 text-rose-600" /> CẬN HẠN
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-600 mt-1 font-medium">
                    HSD: <strong className="text-rose-600">{order.expiryDate}</strong> (Còn {order.daysRemaining} ngày)
                  </div>
                </td>

                {/* Vị Trí Ô Kệ */}
                <td className="py-4 px-4 font-mono text-xs">
                  <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 font-bold flex items-center gap-1.5 w-fit shadow-xs">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{order.locationBarcode}</span>
                  </span>
                </td>

                {/* Trạng thái */}
                <td className="py-4 px-4 text-center">
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border shadow-xs ${
                      order.status === 'PENDING'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : order.status === 'RESERVED'
                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        order.status === 'PENDING'
                          ? 'bg-amber-500 animate-pulse'
                          : order.status === 'RESERVED'
                          ? 'bg-blue-500 animate-ping'
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
                <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => onSelectOrder(order)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer active:scale-95"
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
