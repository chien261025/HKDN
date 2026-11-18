import React, { useEffect, useState } from 'react';
import {
  PackageCheck,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Eye,
  Lock,
  Truck,
  Flame,
  Navigation,
} from 'lucide-react';
import { OutboundOrder } from '../types';
import { OutboundMobileCards } from './OutboundMobileCards';
import { Pagination } from '../../../components/common';

const PAGE_SIZE = 10;

interface OutboundOrderTableProps {
  orders: OutboundOrder[];
  onSelectOrder: (order: OutboundOrder) => void;
  onAllocateAndLock: (orderId: string) => void;
  onDispatchOrder: (orderId: string) => void;
  onOpenPickPath?: (order: OutboundOrder) => void;
}

export const OutboundOrderTable: React.FC<OutboundOrderTableProps> = ({
  orders,
  onSelectOrder,
  onAllocateAndLock,
  onDispatchOrder,
  onOpenPickPath,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(orders.length / PAGE_SIZE));
  const visibleOrders = orders.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => setCurrentPage((page) => Math.min(page, totalPages)), [totalPages]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Table Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
            <PackageCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              Danh Sách Đơn Xuất Kho
            </h2>
            <p className="text-xs text-slate-500 hidden sm:block">Phân bổ tự động ưu tiên lô cận hạn (FEFO)</p>
          </div>
        </div>
        <span className="text-xs font-mono font-semibold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
          {orders.length} Đơn Xuất
        </span>
      </div>

      {/* MOBILE CARD VIEW (Block on mobile < 768px) */}
      <OutboundMobileCards
        orders={visibleOrders}
        onSelectOrder={onSelectOrder}
        onAllocateAndLock={onAllocateAndLock}
        onDispatchOrder={onDispatchOrder}
        onOpenPickPath={onOpenPickPath}
      />

      {/* DESKTOP TABLE VIEW (Hidden on mobile < 768px) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 font-semibold text-xs border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Mã Đơn SO / Khách Hàng</th>
              <th className="py-3 px-4">Hạn Giao Hàng</th>
              <th className="py-3 px-4">Mặt Hàng & Quy Mô</th>
              <th className="py-3 px-4">Tiến Độ Quy Trình</th>
              <th className="py-3 px-4">Trạng Thái & Khóa</th>
              <th className="py-3 px-4 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {visibleOrders.map((order) => {
              const isPending = order.status === 'PENDING';
              const isAllocated = order.status === 'ALLOCATED';
              const isPicking = order.status === 'PICKING';
              const isDispatched = order.status === 'DISPATCHED';
              const totalRequested = order.items.reduce((sum, it) => sum + it.requestedQty, 0);

              let progressPercent = 20;
              if (isAllocated) progressPercent = 50;
              if (isPicking) progressPercent = 75;
              if (isDispatched) progressPercent = 100;

              return (
                <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 text-sm">{order.soCode}</span>
                      {order.priority === 'URGENT' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                          <Flame className="w-3 h-3 text-rose-600" /> HỎA TỐC
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">{order.customerName}</div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs">
                    <div className="text-slate-900 font-semibold">{order.requiredDate}</div>
                    <div className="text-xs text-slate-400 mt-0.5">Tạo: {order.orderDate}</div>
                  </td>
                  <td className="py-3.5 px-4 text-xs">
                    <div className="text-slate-900 font-semibold font-mono">{order.items.length} mặt hàng</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Tổng: <strong className="text-amber-700 font-mono font-bold">{totalRequested}</strong> đơn vị
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="w-40 space-y-1">
                      <div className="flex justify-between text-xs font-mono text-slate-600">
                        <span>
                          {isPending && '1. Chờ phân bổ'}
                          {isAllocated && '2. Đã giữ hàng'}
                          {isPicking && '3. Đang lấy hàng'}
                          {isDispatched && '4. Đã xuất xưởng'}
                        </span>
                        <span className="font-semibold text-amber-700">{progressPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isDispatched ? 'bg-emerald-500' : isPicking ? 'bg-indigo-600' : isAllocated ? 'bg-amber-500' : 'bg-slate-400'
                            }`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs">
                    {isPending && (
                      <span className="inline-flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 font-semibold" title="Đơn mới, chưa giữ chỗ tồn kho">
                        <Clock className="w-3.5 h-3.5 text-amber-600" /> CHỜ PHÂN BỔ
                      </span>
                    )}
                    {isAllocated && (
                      <span className="inline-flex items-center gap-1.5 text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 font-semibold" title="Đã khóa giữ đúng lô cận date cho đơn này">
                        <Lock className="w-3.5 h-3.5 text-indigo-600" /> ĐÃ GIỮ HÀNG
                      </span>
                    )}
                    {isPicking && (
                      <span className="inline-flex items-center gap-1.5 text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 font-semibold" title="Thủ kho đang đi nhặt hàng theo lộ trình">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> ĐANG LẤY HÀNG
                      </span>
                    )}
                    {isDispatched && (
                      <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-semibold" title="Xe tải đã bốc hàng rời kho">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> ĐÃ XUẤT XƯỞNG
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {isPending && (
                        <button
                          onClick={() => onAllocateAndLock(order.id)}
                          className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                          title="Tự động tìm lô cận date và khóa giữ tồn kho"
                        >
                          <Lock className="w-3.5 h-3.5 text-amber-700" />
                          <span>Phân Bổ Lô</span>
                        </button>
                      )}
                      {(isAllocated || isPicking) && (
                        <button
                          onClick={() => onDispatchOrder(order.id)}
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                          title="Bàn giao xe tải và chính thức trừ tồn kho"
                        >
                          <Truck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Xuất Kho</span>
                        </button>
                      )}
                      {onOpenPickPath && (
                        <button
                          onClick={() => onOpenPickPath(order)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                          title="Xem bản đồ hướng dẫn đường đi ngắn nhất trong kho"
                        >
                          <Navigation className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Lộ Trình</span>
                        </button>
                      )}
                      <button
                        onClick={() => onSelectOrder(order)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                        title="Xem danh sách chi tiết các mặt hàng cần lấy"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>Phiếu Nhặt</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={currentPage} totalItems={orders.length} pageSize={PAGE_SIZE} onPageChange={setCurrentPage} />
    </div>
  );
};
