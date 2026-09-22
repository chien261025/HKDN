import React from 'react';
import {
  Clock,
  Lock,
  Truck,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { OrderItem } from '../../types';

interface FefoKanbanProps {
  orders: OrderItem[];
  onSelectOrder: (order: OrderItem) => void;
  onReserveOrder: (orderId: string) => void;
  onShipOrder: (orderId: string) => void;
  onViewLedger: (order: OrderItem) => void;
}

export const FefoKanban: React.FC<FefoKanbanProps> = ({
  orders,
  onSelectOrder,
  onReserveOrder,
  onShipOrder,
  onViewLedger,
}) => {
  const pendingOrders = orders.filter((o) => o.status === 'PENDING');
  const reservedOrders = orders.filter((o) => o.status === 'RESERVED');
  const shippedOrders = orders.filter((o) => o.status === 'SHIPPED');

  return (
    <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* CỘT 1: CHỜ XỬ LÝ (AMBER) */}
      <div className="rounded-2xl overflow-hidden border border-amber-200 shadow-xs bg-amber-50/40">
        {/* Header Cột */}
        <div className="bg-amber-500 p-3.5 flex items-center justify-between text-white">
          <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
            <Clock className="w-4 h-4 text-white" />
            <span>1. Chờ Xuất Kho</span>
          </div>
          <span className="font-mono text-xs font-black bg-white/20 text-white px-2.5 py-0.5 rounded-full">
            {pendingOrders.length} đơn
          </span>
        </div>

        {/* Thân Cột */}
        <div className="p-3.5 space-y-3">
          {pendingOrders.map((order) => (
            <div
              key={order.id}
              onClick={() => onSelectOrder(order)}
              className="p-4 rounded-xl bg-white hover:bg-slate-50 border-l-4 border-l-amber-500 border border-slate-200 transition-all cursor-pointer space-y-2 shadow-xs group"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-indigo-700 text-xs bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {order.code}
                </span>
                <span className="font-mono font-bold text-amber-700 text-xs bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {order.qty} SP
                </span>
              </div>
              <div className="font-bold text-slate-900 text-sm leading-snug group-hover:text-indigo-700 transition-colors">
                {order.productName}
              </div>
              <div className="text-xs text-slate-500 font-medium">{order.customer}</div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                  {order.locationBarcode.split('-')[4] || 'Ô Kệ'}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onReserveOrder(order.id);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Giữ Hàng ➔</span>
                </button>
              </div>
            </div>
          ))}
          {pendingOrders.length === 0 && (
            <div className="text-center py-10 text-xs text-slate-400 italic">Không có đơn chờ xử lý</div>
          )}
        </div>
      </div>

      {/* CỘT 2: ĐÃ GIỮ HÀNG (BLUE) */}
      <div className="rounded-2xl overflow-hidden border border-blue-200 shadow-xs bg-blue-50/40">
        {/* Header Cột */}
        <div className="bg-blue-600 p-3.5 flex items-center justify-between text-white">
          <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
            <Lock className="w-4 h-4 text-white" />
            <span>2. Đã Giữ Hàng</span>
          </div>
          <span className="font-mono text-xs font-black bg-white/20 text-white px-2.5 py-0.5 rounded-full">
            {reservedOrders.length} đơn
          </span>
        </div>

        {/* Thân Cột */}
        <div className="p-3.5 space-y-3">
          {reservedOrders.map((order) => (
            <div
              key={order.id}
              onClick={() => onSelectOrder(order)}
              className="p-4 rounded-xl bg-white hover:bg-slate-50 border-l-4 border-l-blue-600 border border-slate-200 transition-all cursor-pointer space-y-2 shadow-xs group"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-indigo-700 text-xs bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {order.code}
                </span>
                <span className="font-mono font-bold text-blue-700 text-xs bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {order.qty} SP
                </span>
              </div>
              <div className="font-bold text-slate-900 text-sm leading-snug group-hover:text-indigo-700 transition-colors">
                {order.productName}
              </div>
              <div className="text-xs text-slate-500 font-medium">{order.customer}</div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-blue-700 text-xs flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Đã Khóa Tồn
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onShipOrder(order.id);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Xuất Kho ➔</span>
                </button>
              </div>
            </div>
          ))}
          {reservedOrders.length === 0 && (
            <div className="text-center py-10 text-xs text-slate-400 italic">Chưa có đơn đang giữ hàng</div>
          )}
        </div>
      </div>

      {/* CỘT 3: ĐÃ XUẤT KHO (EMERALD) */}
      <div className="rounded-2xl overflow-hidden border border-emerald-200 shadow-xs bg-emerald-50/40">
        {/* Header Cột */}
        <div className="bg-emerald-600 p-3.5 flex items-center justify-between text-white">
          <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span>3. Đã Xuất Kho</span>
          </div>
          <span className="font-mono text-xs font-black bg-white/20 text-white px-2.5 py-0.5 rounded-full">
            {shippedOrders.length} đơn
          </span>
        </div>

        {/* Thân Cột */}
        <div className="p-3.5 space-y-3">
          {shippedOrders.map((order) => (
            <div
              key={order.id}
              onClick={() => onSelectOrder(order)}
              className="p-4 rounded-xl bg-white hover:bg-slate-50 border-l-4 border-l-emerald-600 border border-slate-200 transition-all cursor-pointer space-y-2 shadow-xs group"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-indigo-700 text-xs bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  {order.code}
                </span>
                <span className="font-mono font-bold text-emerald-700 text-xs bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {order.qty} SP
                </span>
              </div>
              <div className="font-bold text-slate-900 text-sm leading-snug">{order.productName}</div>
              <div className="text-xs text-slate-500 font-medium">{order.customer}</div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Đã Ghi Sổ Kho
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewLedger(order);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 font-bold text-xs flex items-center gap-1 border border-slate-200 shadow-xs cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Xem Phiếu</span>
                </button>
              </div>
            </div>
          ))}
          {shippedOrders.length === 0 && (
            <div className="text-center py-10 text-xs text-slate-400 italic">Chưa có đơn đã xuất kho</div>
          )}
        </div>
      </div>
    </div>
  );
};
