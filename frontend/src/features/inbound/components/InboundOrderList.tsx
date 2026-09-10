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
    <div className="bg-[#0b101d]/90 backdrop-blur-xl rounded-2xl border border-slate-800/80 shadow-xl overflow-hidden">
      {/* Table Title Bar */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
        <div className="flex items-center gap-2">
          <PackagePlus className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">
            Danh Sách Đơn Đặt Hàng Nhập Kho (Purchase Orders)
          </h2>
        </div>
        <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700">
          {orders.length} Đơn PO
        </span>
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900/80 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Mã Đơn PO / Nhà Cung Cấp</th>
              <th className="py-3 px-4">Ngày Giao Hàng</th>
              <th className="py-3 px-4">Quy Mô Hàng Hóa</th>
              <th className="py-3 px-4">Tiến Độ Quy Trình</th>
              <th className="py-3 px-4">Trạng Thái</th>
              <th className="py-3 px-4 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
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
                <tr key={order.id} className="hover:bg-slate-800/30 transition-colors">
                  {/* Mã đơn & NCC */}
                  <td className="py-3.5 px-4">
                    <div className="font-mono font-bold text-white text-sm">{order.poCode}</div>
                    <div className="text-[11px] text-slate-400 line-clamp-1">{order.supplierName}</div>
                  </td>

                  {/* Ngày giao */}
                  <td className="py-3.5 px-4 font-mono text-[11px]">
                    <div className="text-slate-300">{order.expectedDeliveryDate}</div>
                    <div className="text-[10px] text-slate-500">Tạo: {order.createdAt}</div>
                  </td>

                  {/* Quy mô */}
                  <td className="py-3.5 px-4 font-mono text-[11px]">
                    <div className="text-white font-semibold">
                      {order.items.length} mặt hàng
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Tổng: <strong className="text-cyan-400">{totalExpected}</strong> đơn vị
                    </div>
                  </td>

                  {/* Tiến độ 3 giai đoạn */}
                  <td className="py-3.5 px-4">
                    <div className="w-40 space-y-1">
                      <div className="flex justify-between text-[10px] font-mono text-slate-400">
                        <span>
                          {isPending && '1. Chờ xe tải'}
                          {isReceived && '2. Tại khu đệm'}
                          {isStocked && '3. Đã cất kệ'}
                        </span>
                        <span className="font-bold text-cyan-400">{progressPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
                        <div
                          className={`h-full transition-all duration-300 rounded-full ${
                            isStocked
                              ? 'bg-emerald-400'
                              : isReceived
                              ? 'bg-cyan-400'
                              : 'bg-amber-400'
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>

                  {/* Trạng thái badge */}
                  <td className="py-3.5 px-4 font-mono text-[11px]">
                    {isPending && (
                      <span className="inline-flex items-center gap-1 text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 font-bold">
                        <Clock className="w-3 h-3" /> PENDING
                      </span>
                    )}
                    {isReceived && (
                      <span className="inline-flex items-center gap-1 text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20 font-bold">
                        <Truck className="w-3 h-3" /> RECEIVED
                      </span>
                    )}
                    {isStocked && (
                      <span className="inline-flex items-center gap-1 text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 font-bold">
                        <CheckCircle2 className="w-3 h-3" /> STOCKED
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {isPending && (
                        <button
                          onClick={() => onAdvanceStatus(order.id)}
                          className="px-2.5 py-1 bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/30 rounded-lg text-[11px] font-semibold transition-all"
                          title="Mô phỏng xe tải đã đến, nhận hàng vào Staging"
                        >
                          Nhận Vào Đệm
                        </button>
                      )}

                      {isReceived && (
                        <button
                          onClick={() => onAdvanceStatus(order.id)}
                          className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 rounded-lg text-[11px] font-semibold transition-all"
                          title="Hoàn tất cất hàng lên ô kệ"
                        >
                          Cất Lên Kệ
                        </button>
                      )}

                      <button
                        onClick={() => onSelectOrder(order)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-semibold transition-colors"
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
