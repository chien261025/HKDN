import React, { useEffect, useState } from 'react';
import { X, Building2, Calendar, CheckCircle2, Clock, Truck, Layers, Printer, MapPin, DollarSign, ShieldCheck } from 'lucide-react';
import { InboundOrder } from '../types';
import { Pagination } from '../../../components/common';

const PAGE_SIZE = 10;

interface InboundDetailModalProps {
  order: InboundOrder | null;
  onClose: () => void;
}

export const InboundDetailModal: React.FC<InboundDetailModalProps> = ({ order, onClose }) => {
  const [currentPage, setCurrentPage] = useState(1);
  useEffect(() => {
    if (order) setCurrentPage(1);
  }, [order?.id]);

  if (!order) return null;

  const visibleItems = order.items.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const isPending = order.status === 'PENDING';
  const isReceived = order.status === 'RECEIVED';
  const isStocked = order.status === 'STOCKED';

  const totalQuantity = order.items.reduce((sum, item) => sum + (item.expectedQty || 0), 0);
  const totalReceived = order.items.reduce((sum, item) => sum + (item.receivedQty || 0), 0);
  const totalOrderValue = order.totalValue || order.items.reduce((sum, item) => sum + (item.expectedQty * (item.unitPrice || 0)), 0);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden text-slate-900 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="font-bold text-base text-slate-900">Chi Tiết Đơn Nhập Kho: {order.poCode}</h3>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded border ${
                  isStocked ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : isReceived ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {isPending ? 'CHỜ TIẾP NHẬN' : isReceived ? 'TẠI KHU ĐỆM' : 'ĐÃ CẤT KỆ'}
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium mt-0.5">{order.supplierName}</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto text-sm">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Tổng Giá Trị PO</span>
              <div className="font-black text-indigo-700 text-base mt-0.5 font-mono">
                {totalOrderValue.toLocaleString('vi-VN')} đ
              </div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Quy Mô Hàng</span>
              <div className="font-black text-slate-800 text-base mt-0.5 font-mono">
                {order.items.length} SKU ({totalQuantity} sp)
              </div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Thực Nhận / Cất Kệ</span>
              <div className="font-black text-emerald-700 text-base mt-0.5 font-mono">
                {totalReceived} / {totalQuantity} sp
              </div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Hạn Giao Hàng</span>
              <div className="font-bold text-slate-800 text-sm mt-1 font-mono">
                {order.expectedDeliveryDate}
              </div>
            </div>
          </div>

          {/* Timeline 3 bước */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-xs font-bold text-slate-700 uppercase font-mono mb-3">
              Tiến Độ Vận Hành Thực Địa (Workflow 3 Bước)
            </div>

            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              {/* Bước 1 */}
              <div className="p-3 rounded-xl bg-white border border-emerald-300 text-emerald-900 space-y-1 shadow-xs">
                <div className="flex items-center justify-center gap-1.5 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>1. Phát Hành PO</span>
                </div>
                <div className="text-xs text-slate-600 font-mono">Đơn giá mua & Đặt hàng</div>
              </div>

              {/* Bước 2 */}
              <div
                className={`p-3 rounded-xl border space-y-1 ${
                  isReceived || isStocked
                    ? 'bg-white border-indigo-300 text-indigo-900 shadow-xs'
                    : 'bg-slate-100 border-slate-200 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5 font-bold text-sm">
                  <Truck className="w-4 h-4 text-indigo-600" />
                  <span>2. Khu Đệm (Staging)</span>
                </div>
                <div className="text-xs text-slate-600 font-mono">Quét mã kiểm đếm & tạo lô</div>
              </div>

              {/* Bước 3 */}
              <div
                className={`p-3 rounded-xl border space-y-1 ${
                  isStocked
                    ? 'bg-white border-emerald-300 text-emerald-900 shadow-xs'
                    : 'bg-slate-100 border-slate-200 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5 font-bold text-sm">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <span>3. Cất Lên Kệ (Put-away)</span>
                </div>
                <div className="text-xs text-slate-600 font-mono">Ghi sổ cái Stock Ledger</div>
              </div>
            </div>
          </div>

          {/* Quy tắc WMS Box */}
          <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 flex items-start gap-2.5 text-xs text-blue-900 leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Nguyên tắc cốt lõi:</strong> Hệ thống <strong>không cộng tồn kho</strong> khi mới lập PO. Tồn kho khả dụng On-hand và Sổ cái giao dịch (Stock Ledger) chỉ được ghi nhận bất biến khi nhân viên kho hoàn tất bước <strong>Cất Lên Kệ (Put-away)</strong>.
            </div>
          </div>

          {/* Bảng danh sách mặt hàng */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-sm">Danh Sách Mặt Hàng Chi Tiết:</span>
              <span className="text-xs font-mono font-semibold text-slate-600">
                Giao dự kiến: {order.expectedDeliveryDate}
              </span>
            </div>

            <div className="rounded-xl border border-slate-300 overflow-hidden bg-white shadow-xs">
              <table className="w-full text-left text-sm font-mono">
                <thead className="bg-slate-100 text-slate-800 text-xs font-bold uppercase border-b border-slate-300">
                  <tr>
                    <th className="py-3 px-4">Mặt Hàng (SKU)</th>
                    <th className="py-3 px-4">Lô & HSD</th>
                    <th className="py-3 px-4 text-right">Đơn Giá Mua</th>
                    <th className="py-3 px-4 text-center">Đặt / Nhận</th>
                    <th className="py-3 px-4 text-right">Thành Tiền</th>
                    <th className="py-3 px-4">Vị Trí Cất Kệ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {visibleItems.map((item) => {
                    const price = item.unitPrice || 0;
                    const subtotal = price * item.expectedQty;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <div className="font-sans font-bold text-slate-900 text-sm">{item.productName}</div>
                          <div className="text-xs text-slate-600 font-mono font-medium mt-0.5">{item.sku}</div>
                        </td>

                        <td className="py-3 px-4 text-xs font-mono">
                          <div className="text-slate-900">Lô: <strong className="text-indigo-700 font-bold">{item.batchNumber || 'Tự động gán'}</strong></div>
                          <div className="text-amber-800 font-semibold mt-0.5">HSD: {item.expiryDate || 'Theo bao bì'}</div>
                        </td>

                        <td className="py-3 px-4 text-right text-xs font-mono font-bold text-slate-700">
                          {price > 0 ? `${price.toLocaleString('vi-VN')} đ` : '-'}
                        </td>

                        <td className="py-3 px-4 text-center font-mono">
                          <div className="text-sm font-black text-slate-900">
                            <span className="text-indigo-700">{item.receivedQty}</span> / {item.expectedQty} {item.unit}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right text-xs font-mono font-bold text-indigo-700">
                          {subtotal > 0 ? `${subtotal.toLocaleString('vi-VN')} đ` : '-'}
                        </td>

                        <td className="py-3 px-4 text-xs font-mono">
                          {item.putawayLocation ? (
                            <span className="flex items-center gap-1 text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                              {item.putawayLocation}
                            </span>
                          ) : (
                            <span className="text-slate-500 italic font-sans text-xs">
                              {isStocked ? 'ZA-A01-R01-S01-B01' : 'Chờ cất hàng...'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <Pagination
                currentPage={currentPage}
                totalItems={order.items.length}
                pageSize={PAGE_SIZE}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>

          {/* Ghi chú */}
          {order.notes && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed font-medium">
              <strong className="text-slate-900 font-bold">Ghi chú PO:</strong> {order.notes}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 flex items-center justify-between bg-slate-50">
          <button
            onClick={() => alert(`In phiếu nhập kho cho đơn: ${order.poCode}`)}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-sm font-bold transition-colors cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>In Phiếu Nhập Kho</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-indigo-200 cursor-pointer"
          >
            Đóng Cửa Sổ
          </button>
        </div>
      </div>
    </div>
  );
};

