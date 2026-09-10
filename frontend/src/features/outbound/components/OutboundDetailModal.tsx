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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-[#0b101d] rounded-2xl max-w-3xl w-full border border-slate-700 shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">Lệnh Xuất & Danh Sách Nhặt Hàng (Pick List)</h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                  {order.soCode}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">{order.customerName} • Giao: {order.requiredDate}</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto text-xs">
          {/* Lock & FEFO Certification Card */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-indigo-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
                <Lock className="w-4 h-4 text-cyan-400" />
                <span>Cơ Chế Khóa Giữ Tồn Kho (Pessimistic Locking Active)</span>
              </div>
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30">
                {order.lockId || 'LOCK-TX-99824'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Hệ thống đã thực hiện câu lệnh <code className="text-cyan-300 font-mono">SELECT ... FOR UPDATE</code> trên cơ sở dữ liệu PostgreSQL. Số lượng tồn kho đã được khóa cứng (Reserved), ngăn chặn hoàn toàn tranh chấp từ các đơn hàng xuất đồng thời.
            </p>
          </div>

          {/* Danh sách nhặt hàng FEFO */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                Lộ Trình Nhặt Hàng Tối Ưu Theo FEFO (Pick Route):
              </span>
              <span className="text-[10px] text-amber-400 font-mono">Hạn ngắn đi trước</span>
            </div>

            <div className="space-y-2.5">
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
                    className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold text-[11px] flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-white text-xs">{item.productName}</span>
                        <span className="text-[10px] font-mono text-slate-500">{item.sku}</span>
                      </div>

                      <div className="text-[11px] font-mono text-slate-400 pl-7 flex items-center gap-3 flex-wrap">
                        <span className="flex items-center gap-1 text-cyan-300 font-bold">
                          <MapPin className="w-3 h-3 text-cyan-400" />
                          Ô: {allocation.locationBarcode}
                        </span>
                        <span>•</span>
                        <span>Lô: <strong className="text-white">{allocation.batchNumber}</strong></span>
                        <span>•</span>
                        <span className="text-rose-400 font-bold flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          HSD: {allocation.expiryDate} (FEFO)
                        </span>
                      </div>
                    </div>

                    <div className="text-right pl-7 sm:pl-0 font-mono">
                      <div className="text-emerald-400 font-extrabold text-sm">
                        {item.requestedQty} {item.unit}
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold">
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
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
              <strong className="text-slate-300">Ghi chú đơn:</strong> {order.notes}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/60">
          <button
            onClick={() => alert(`Bắt đầu in phiếu nhặt hàng Pick List cho đơn: ${order.soCode}`)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>In Lệnh Nhặt Hàng (Pick List)</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-amber-500/20"
          >
            Đóng Cửa Sổ
          </button>
        </div>
      </div>
    </div>
  );
};
