import React from 'react';
import {
  PackagePlus,
  Clock,
  Truck,
  CheckCircle2,
  ChevronRight,
  Eye,
  FileText,
  Printer
} from 'lucide-react';
import { InboundOrder } from '../types';

interface InboundOrderListProps {
  orders: InboundOrder[];
  onSelectOrder: (order: InboundOrder) => void;
  onAdvanceStatus: (orderId: string) => void;
}

export const InboundOrderList: React.FC<InboundOrderListProps> = ({
  orders,
  onSelectOrder,
  onAdvanceStatus,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden">
      {/* Table Title Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-2.5">
          <PackagePlus className="w-5 h-5 text-indigo-600" />
          <h2 className="text-sm sm:text-base font-bold text-slate-900 uppercase tracking-wider">
            Danh Sách Đơn Đặt Hàng Nhập Kho (Purchase Orders)
          </h2>
        </div>
        <span className="text-xs font-mono font-bold text-slate-700 bg-white px-3 py-1 rounded-full border border-slate-300 shadow-2xs">
          {orders.length} Đơn PO
        </span>
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-800 font-bold text-xs uppercase border-b border-slate-300">
            <tr>
              <th className="py-3.5 px-4">Mã Đơn PO / Nhà Cung Cấp</th>
              <th className="py-3.5 px-4">Ngày Giao Hàng</th>
              <th className="py-3.5 px-4">Quy Mô Hàng Hóa</th>
              <th className="py-3.5 px-4">Tiến Độ Quy Trình</th>
              <th className="py-3.5 px-4">Trạng Thái</th>
              <th className="py-3.5 px-4 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-800 font-sans">
            {orders.map((order) => {
              const isPending = order.status === 'PENDING';
              const isReceived = order.status === 'RECEIVED';
              const isStocked = order.status === 'STOCKED';

              const totalExpected = order.items.reduce((sum, it) => sum + it.expectedQty, 0);
              const totalReceived = order.items.reduce((sum, it) => sum + it.receivedQty, 0);

              let progressPercent = 15;
              if (isReceived) progressPercent = 60;
              if (isStocked) progressPercent = 100;

              return (
                <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                  {/* Mã đơn & NCC */}
                  <td className="py-4 px-4">
                    <div className="font-mono font-bold text-slate-900 text-sm sm:text-base">{order.poCode}</div>
                    <div className="text-xs text-slate-600 font-medium line-clamp-1 mt-0.5">{order.supplierName}</div>
                  </td>

                  {/* Ngày giao */}
                  <td className="py-4 px-4 font-mono text-xs sm:text-sm">
                    <div className="text-slate-900 font-semibold">{order.expectedDeliveryDate}</div>
                    <div className="text-xs text-slate-500 mt-0.5">Tạo: {order.createdAt}</div>
                  </td>

                  {/* Quy mô */}
                  <td className="py-4 px-4 font-mono text-xs sm:text-sm">
                    <div className="text-slate-900 font-bold">
                      {order.items.length} mặt hàng
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5 font-sans font-medium">
                      Tổng: <strong className="text-indigo-700 font-mono font-bold">{totalExpected}</strong> đơn vị
                    </div>
                  </td>

                  {/* Tiến độ 3 giai đoạn */}
                  <td className="py-4 px-4">
                    <div className="w-44 space-y-1.5">
                      <div className="flex justify-between text-xs font-mono text-slate-700 font-medium">
                        <span>
                          {isPending && '1. Chờ xe tải'}
                          {isReceived && '2. Tại khu đệm'}
                          {isStocked && '3. Đã cất kệ'}
                        </span>
                        <span className="font-bold text-indigo-700">{progressPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 rounded-full ${
                            isStocked
                              ? 'bg-emerald-500'
                              : isReceived
                              ? 'bg-indigo-600'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>

                  {/* Trạng thái badge */}
                  <td className="py-4 px-4 font-mono text-xs">
                    {isPending && (
                      <span className="inline-flex items-center gap-1.5 text-amber-800 bg-amber-50 px-3 py-1 rounded-lg border border-amber-300 font-bold">
                        <Clock className="w-3.5 h-3.5 text-amber-600" /> PENDING
                      </span>
                    )}
                    {isReceived && (
                      <span className="inline-flex items-center gap-1.5 text-indigo-800 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-300 font-bold">
                        <Truck className="w-3.5 h-3.5 text-indigo-600" /> RECEIVED
                      </span>
                    )}
                    {isStocked && (
                      <span className="inline-flex items-center gap-1.5 text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-300 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> STOCKED
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {isPending && (
                        <button
                          onClick={() => onAdvanceStatus(order.id)}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-300 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                          title="Mô phỏng xe tải đã đến, nhận hàng vào Staging"
                        >
                          Nhận Vào Đệm
                        </button>
                      )}

                      {isReceived && (
                        <button
                          onClick={() => onAdvanceStatus(order.id)}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                          title="Hoàn tất cất hàng lên ô kệ"
                        >
                          Cất Lên Kệ
                        </button>
                      )}

                      <button
                        onClick={() => onSelectOrder(order)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Chi Tiết</span>
                      </button>
                    </div>
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
