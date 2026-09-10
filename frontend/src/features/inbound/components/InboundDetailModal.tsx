import React from 'react';
import { X, Building2, Calendar, CheckCircle2, Clock, Truck, Layers, Printer, MapPin } from 'lucide-react';
import { InboundOrder } from '../types';

interface InboundDetailModalProps {
  order: InboundOrder | null;
  onClose: () => void;
}

export const InboundDetailModal: React.FC<InboundDetailModalProps> = ({ order, onClose }) => {
  if (!order) return null;

  const isPending = order.status === 'PENDING';
  const isReceived = order.status === 'RECEIVED';
  const isStocked = order.status === 'STOCKED';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-[#0b101d] rounded-2xl max-w-3xl w-full border border-slate-700 shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">Chi Tiết Đơn Nhập Kho: {order.poCode}</h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                  {order.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">{order.supplierName}</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 overflow-y-auto text-xs">
          {/* Timeline 3 bước */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
            <div className="text-[11px] font-bold text-slate-400 uppercase font-mono mb-3">
              Tiến Độ Vận Hành Thực Địa (Workflow 3 Bước)
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
              {/* Bước 1 */}
              <div className="p-2 rounded-lg bg-slate-800/60 border border-emerald-500/30 text-emerald-300 space-y-1">
                <div className="flex items-center justify-center gap-1 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>1. Phát Hành PO</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">Duyệt bởi Trưởng kho</div>
              </div>

              {/* Bước 2 */}
              <div
                className={`p-2 rounded-lg border space-y-1 ${
                  isReceived || isStocked
                    ? 'bg-slate-800/60 border-cyan-500/30 text-cyan-300'
                    : 'bg-slate-950/40 border-slate-800 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-center gap-1 font-bold">
                  <Truck className="w-3.5 h-3.5" />
                  <span>2. Khu Đệm (Staging)</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">Quét mã kiểm đếm thực tế</div>
              </div>

              {/* Bước 3 */}
              <div
                className={`p-2 rounded-lg border space-y-1 ${
                  isStocked
                    ? 'bg-slate-800/60 border-emerald-500/30 text-emerald-300'
                    : 'bg-slate-950/40 border-slate-800 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-center gap-1 font-bold">
                  <Layers className="w-3.5 h-3.5" />
                  <span>3. Cất Lên Kệ (Put-away)</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">Theo dõi tải trọng an toàn</div>
              </div>
            </div>
          </div>

          {/* Bảng danh sách mặt hàng */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-300">Danh Sách Hàng Hóa Thực Nhận:</span>
              <span className="text-[11px] font-mono text-slate-400">
                Giao dự kiến: {order.expectedDeliveryDate}
              </span>
            </div>

            <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950/60">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Mặt Hàng (SKU)</th>
                    <th className="py-2.5 px-3">Lô & HSD</th>
                    <th className="py-2.5 px-3 text-center">Đặt / Nhận</th>
                    <th className="py-2.5 px-3">Vị Trí Cất Kệ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {order.items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-900/40">
                      <td className="py-2.5 px-3">
                        <div className="font-sans font-bold text-white text-xs">{item.productName}</div>
                        <div className="text-[10px] text-slate-500">{item.sku}</div>
                      </td>

                      <td className="py-2.5 px-3 text-[11px]">
                        <div>Lô: <strong className="text-cyan-300">{item.batchNumber || 'Tự động gán'}</strong></div>
                        <div className="text-amber-400 text-[10px]">HSD: {item.expiryDate || 'Theo bao bì'}</div>
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <div className="text-xs font-bold text-white">
                          <span className="text-cyan-400">{item.receivedQty}</span> / {item.expectedQty} {item.unit}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-[11px]">
                        {item.putawayLocation ? (
                          <span className="flex items-center gap-1 text-emerald-400 font-bold">
                            <MapPin className="w-3 h-3" />
                            {item.putawayLocation}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic font-sans text-[10px]">
                            {isStocked ? 'ZA-A01-R01-S01-B01' : 'Chờ cất hàng...'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Ghi chú */}
          {order.notes && (
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
              <strong className="text-slate-300">Ghi chú PO:</strong> {order.notes}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/60">
          <button
            onClick={() => alert(`In phiếu nhập kho cho đơn: ${order.poCode}`)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>In Phiếu Nhập Kho</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-cyan-900/20"
          >
            Đóng Cửa Sổ
          </button>
        </div>
      </div>
    </div>
  );
};
