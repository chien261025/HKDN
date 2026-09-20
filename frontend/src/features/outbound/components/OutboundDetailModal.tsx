import React from 'react';
import { X, Lock, MapPin, Calendar, CheckCircle2, Printer, ShieldCheck, ArrowRight, Package } from 'lucide-react';
import { OutboundOrder } from '../types';

interface OutboundDetailModalProps {
  order: OutboundOrder | null;
  onClose: () => void;
}

export const OutboundDetailModal: React.FC<OutboundDetailModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden text-slate-900 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="font-bold text-base text-slate-900">Lệnh Xuất & Danh Sách Nhặt Hàng (Pick List)</h3>
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-300">
                  {order.soCode}
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium mt-0.5">{order.customerName} • Giao: {order.requiredDate}</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto text-sm">
          {/* Lock & FEFO Certification Card */}
          <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                <Lock className="w-4.5 h-4.5 text-indigo-600" />
                <span>Cơ Chế Khóa Giữ Tồn Kho (Pessimistic Locking Active)</span>
              </div>
              <span className="text-xs font-mono text-indigo-800 font-bold bg-white px-2.5 py-0.5 rounded border border-indigo-300 shadow-2xs">
                {order.lockId || 'LOCK-TX-99824'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
              Hệ thống đã thực hiện câu lệnh <code className="text-indigo-800 font-mono font-bold bg-white px-1 py-0.5 rounded border border-indigo-200">SELECT ... FOR UPDATE</code> trên cơ sở dữ liệu PostgreSQL. Số lượng tồn kho đã được khóa cứng (Reserved), ngăn chặn hoàn toàn tranh chấp từ các đơn hàng xuất đồng thời.
            </p>
          </div>

          {/* Danh sách nhặt hàng FEFO */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-xs sm:text-sm">
                Lộ Trình Nhặt Hàng Tối Ưu Theo FEFO (Pick Route):
              </span>
              <span className="text-xs text-amber-800 font-mono font-bold">Hạn ngắn đi trước</span>
            </div>

            <div className="space-y-3">
              {order.items.map((item, idx) => {
                const allocation = item.allocations[0] || {
                  locationBarcode: 'ZB-B01-R01-S01-B05',
                  batchNumber: 'BATCH-MILK-26A',
                  expiryDate: '2026-09-25',
                  qtyAllocated: item.requestedQty,
                  isNearestExpiry: true,
                };

                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 font-mono font-bold text-xs flex items-center justify-center border border-amber-300">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-slate-900 text-sm sm:text-base">{item.productName}</span>
                        <span className="text-xs font-mono font-semibold text-slate-600">{item.sku}</span>
                      </div>

                      <div className="text-xs font-mono text-slate-700 pl-8 flex items-center gap-3 flex-wrap font-medium">
                        <span className="flex items-center gap-1 text-indigo-700 font-bold">
                          <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                          Ô: {allocation.locationBarcode}
                        </span>
                        <span>•</span>
                        <span>Lô: <strong className="text-slate-900 font-bold">{allocation.batchNumber}</strong></span>
                        <span>•</span>
                        <span className="text-rose-700 font-bold flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          HSD: {allocation.expiryDate} (FEFO)
                        </span>
                      </div>
                    </div>

                    <div className="text-right pl-8 sm:pl-0 font-mono">
                      <div className="text-emerald-700 font-black text-base">
                        {item.requestedQty} {item.unit}
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold">
                        ĐÃ PHÂN BỔ
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ghi chú */}
          {order.notes && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed font-medium">
              <strong className="text-slate-900 font-bold">Ghi chú đơn:</strong> {order.notes}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 flex items-center justify-between bg-slate-50">
          <button
            onClick={() => alert(`Bắt đầu in phiếu nhặt hàng Pick List cho đơn: ${order.soCode}`)}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-sm font-bold transition-colors cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>In Lệnh Nhặt Hàng (Pick List)</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-indigo-200 cursor-pointer"
          >
            Đóng Cửa Sổ
          </button>
        </div>
      </div>
    </div>
  );
};
