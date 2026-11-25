import React from 'react';
import { X, Lock, MapPin, Calendar, CheckCircle2, Printer, ShieldCheck, ArrowRight, Package, Navigation, Clock, Truck, Box, XCircle } from 'lucide-react';
import { OutboundOrder } from '../types';

interface OutboundDetailModalProps {
  order: OutboundOrder | null;
  onClose: () => void;
  onOpenPickPath?: (order: OutboundOrder) => void;
  onCancelOrder?: (orderId: string) => void;
  onOpenVoucher?: (order: OutboundOrder) => void;
}

export const OutboundDetailModal: React.FC<OutboundDetailModalProps> = ({ order, onClose, onOpenPickPath, onCancelOrder, onOpenVoucher }) => {
  if (!order) return null;

  const isPending = order.status === 'PENDING';
  const isAllocated = order.status === 'ALLOCATED';
  const isPicking = order.status === 'PICKING';
  const isDispatched = order.status === 'DISPATCHED';
  const isCancelled = order.status === 'CANCELLED';

  const totalQuantity = order.items.reduce((sum, item) => sum + (item.requestedQty || 0), 0);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden text-slate-900 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm shadow-amber-200">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="font-bold text-base text-slate-900">Chi Tiết Đơn Xuất Kho & Phiếu Lấy Hàng</h3>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-300">
                  {order.soCode}
                </span>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded border ${
                  isDispatched ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  isAllocated ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                  isPicking ? 'bg-blue-50 text-blue-700 border-blue-200' :
                  isCancelled ? 'bg-slate-100 text-slate-600 border-slate-200' :
                  'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {isPending ? 'CHỜ PHÂN BỔ' : isAllocated ? 'ĐÃ GIỮ HÀNG' : isPicking ? 'ĐANG LẤY HÀNG' : isDispatched ? 'ĐÃ XUẤT XƯỞNG' : 'ĐÃ HỦY'}
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                Khách hàng: <strong className="text-slate-800">{order.customerName}</strong> • Hạn giao: <strong>{order.requiredDate}</strong>
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto text-sm">
          {/* Danh sách mặt hàng & Phân bổ Vị Trí / Lô Hàng */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-sm">
                Danh Sách Mặt Hàng & Phân Bổ Vị Trí/Lô Hàng (FEFO):
              </span>
              <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                {order.items.length} Mặt hàng • Tổng {totalQuantity} đơn vị
              </span>
            </div>

            <div className="space-y-3">
              {order.items.map((item, idx) => {
                const hasAllocations = item.allocations && item.allocations.length > 0;
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center border border-amber-300 shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <span className="font-bold text-slate-900 text-sm">{item.productName}</span>
                          <span className="text-xs font-mono text-slate-500 font-semibold ml-2">{item.sku}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-slate-500">Yêu cầu xuất:</span>
                        <span className="font-bold text-slate-900 ml-1.5 text-sm">{item.requestedQty} {item.unit}</span>
                      </div>
                    </div>

                    {/* Danh sách các vị trí & lô được phân bổ (Hỗ trợ 1 sản phẩm nhiều vị trí / nhiều lô) */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                        Các Vị Trí Ô Kệ & Lô Hàng Cần Nhặt (Picking Points):
                      </span>

                      {hasAllocations ? (
                        <div className="grid grid-cols-1 gap-2">
                          {item.allocations.map((alloc, aIdx) => (
                            <div
                              key={aIdx}
                              className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                            >
                              <div className="flex items-center gap-3 flex-wrap">
                                <span className="flex items-center gap-1 text-indigo-700 font-bold bg-white px-2 py-0.5 rounded border border-indigo-200">
                                  <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                                  Ô Kệ: {alloc.locationBarcode}
                                </span>
                                <span className="text-slate-800">
                                  Lô: <strong className="text-slate-900">{alloc.batchNumber}</strong>
                                </span>
                                <span className="text-rose-700 font-semibold flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-rose-200">
                                  <Calendar className="w-3.5 h-3.5" />
                                  HSD: {alloc.expiryDate} {alloc.isNearestExpiry && '(Cận Hạn Nhất)'}
                                </span>
                              </div>

                              <div className="text-right">
                                <span className="font-black text-emerald-700 text-sm">
                                  {alloc.qtyAllocated} {item.unit}
                                </span>
                                <span className="ml-2 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                                  ĐÃ KHÓA GIỮ
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200 text-xs text-amber-800 flex items-center justify-between">
                          <span>Chưa phân bổ lô. Nhấn "Phân Bổ Lô" để hệ thống tự động tìm vị trí và lô cận hạn.</span>
                          <span className="font-bold text-amber-700 text-xs">Chờ Phân Bổ</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ghi chú */}
          {order.notes && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium">
              <strong className="text-slate-900 font-bold">Ghi chú đơn SO:</strong> {order.notes}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 flex items-center justify-between bg-slate-50 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (onOpenVoucher) {
                  onOpenVoucher(order);
                }
              }}
              className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>In Phiếu Xuất Kho & Nhặt Hàng (A4)</span>
            </button>

            {onOpenPickPath && (isAllocated || isPicking) && (
              <button
                onClick={() => onOpenPickPath(order)}
                className="flex items-center gap-2 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                <Navigation className="w-4 h-4 text-indigo-600" />
                <span>Xem Bản Đồ Lộ Trình</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onCancelOrder && (isPending || isAllocated || isPicking) && (
              <button
                onClick={() => {
                  onCancelOrder(order.id);
                  onClose();
                }}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Hủy Đơn & Giải Phóng Tồn
              </button>
            )}

            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Đóng Cửa Sổ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
