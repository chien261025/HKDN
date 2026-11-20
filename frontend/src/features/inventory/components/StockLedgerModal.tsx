import React, { useEffect, useState } from 'react';
import { Printer, X, FileText, CheckCircle2, ArrowRightLeft, ShieldCheck, RefreshCw } from 'lucide-react';
import { inventoryService } from '../services/inventoryService';
import { LedgerEntryData } from '../../labels/types';

export type { LedgerEntryData };

interface StockLedgerModalProps {
  entry: LedgerEntryData;
  onClose: () => void;
}

export const StockLedgerModal: React.FC<StockLedgerModalProps> = ({ entry, onClose }) => {
  const [transferLegs, setTransferLegs] = useState<LedgerEntryData[]>([]);
  const [loadingLegs, setLoadingLegs] = useState(false);

  useEffect(() => {
    if (entry.transactionType === 'TRANSFER' && entry.referenceCode) {
      setLoadingLegs(true);
      inventoryService.getLedgerByReference(entry.referenceCode)
        .then((legs) => {
          if (legs && legs.length > 0) {
            setTransferLegs(legs);
          } else {
            setTransferLegs([entry]);
          }
        })
        .catch(() => setTransferLegs([entry]))
        .finally(() => setLoadingLegs(false));
    } else {
      setTransferLegs([entry]);
    }
  }, [entry]);

  const getVoucherTitle = () => {
    switch (entry.transactionType) {
      case 'OUTBOUND':
        return 'PHIẾU XUẤT KHO';
      case 'INBOUND':
        return 'PHIẾU NHẬP KHO (NHẬP HÀNG)';
      case 'ADJUSTMENT':
        return 'BIÊN BẢN CÂN ĐỐI TỒN KHO';
      case 'INITIAL_BALANCE':
        return 'PHIẾU XÁC NHẬN SỐ DƯ TỒN KHO (INVENTORY SNAPSHOT)';
      case 'TRANSFER':
        return 'PHIẾU ĐIỀU CHUYỂN Ô KỆ NỘI BỘ';
      default:
        return 'CHỨNG TỪ THẺ KHO BIẾN ĐỘNG';
    }
  };

  const isTransfer = entry.transactionType === 'TRANSFER';
  const isSnapshot = entry.transactionType === 'INITIAL_BALANCE';
  const displayItems = isTransfer && transferLegs.length > 0 ? transferLegs : [entry];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 print:bg-white print:p-0 print:static">
      <div className="printable-voucher bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden text-slate-900 relative">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-start justify-between bg-slate-50/90">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-xl text-white flex items-center justify-center shadow-md print:border print:border-slate-400 ${
              isSnapshot ? 'bg-blue-600 shadow-blue-200' : isTransfer ? 'bg-indigo-600 shadow-indigo-200' : 'bg-slate-700 shadow-slate-200'
            }`}>
              {isTransfer ? <ArrowRightLeft className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="font-extrabold text-xl text-slate-900 tracking-tight">
                  {getVoucherTitle()}
                </h3>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full border shadow-xs ${
                    entry.transactionType === 'OUTBOUND'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : entry.transactionType === 'INBOUND'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : entry.transactionType === 'TRANSFER'
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : entry.transactionType === 'INITIAL_BALANCE'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {entry.transactionType === 'OUTBOUND'
                    ? 'XUẤT HÀNG'
                    : entry.transactionType === 'INBOUND'
                    ? 'NHẬP HÀNG'
                    : entry.transactionType === 'TRANSFER'
                    ? 'ĐIỀU CHUYỂN'
                    : entry.transactionType === 'INITIAL_BALANCE'
                    ? 'BẢN CHỤP SỐ DƯ (SNAPSHOT)'
                    : 'CÂN ĐỐI TỒN'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
                Mã chứng từ: <strong className="text-indigo-700 font-mono font-bold">#{entry.id}</strong> • Mã phiếu: <strong className="font-mono text-slate-900">{entry.referenceCode}</strong> • Thời gian: {entry.timestamp}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors border border-slate-200 print:hidden cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Thông tin chung */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs sm:text-sm shadow-xs">
            <div>
              <span className="text-slate-500 block text-xs font-medium">Bút toán gốc:</span>
              <span className="font-mono font-bold text-slate-900 text-sm mt-0.5 block">#{entry.id}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-xs font-medium">Mã Tham Chiếu:</span>
              <span className="font-mono font-bold text-indigo-700 text-sm mt-0.5 block">{entry.referenceCode}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-xs font-medium">Người Thực Hiện:</span>
              <span className="font-semibold text-slate-900 mt-0.5 block">{entry.performedBy}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-xs font-medium">Thời Gian Ghi Sổ:</span>
              <span className="font-mono font-medium text-slate-700 mt-0.5 block">{entry.timestamp}</span>
            </div>
          </div>

          {/* Banner giải thích điều chuyển 2 vế */}
          {isTransfer && displayItems.length > 1 && (
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-950 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Bút toán đối ứng kép (Double-Entry Transfer):</span> Lệnh điều chuyển ghi nhận đồng thời 2 bút toán: <strong>Ô nguồn (-{Math.abs(displayItems[0]?.qtyChange || entry.qtyChange)})</strong> và <strong>Ô đích (+{Math.abs(displayItems[1]?.qtyChange || entry.qtyChange)})</strong>. Tổng số lượng tồn toàn kho không đổi (Net change = 0).
              </div>
            </div>
          )}

          {/* Banner giải thích bản chụp số dư tức thời (Snapshot) */}
          {isSnapshot && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-950 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Bản chụp số dư tồn kho (Inventory State Snapshot):</span> Đây là bản đối soát số dư vật lý tức thời tại ô kệ lưu trữ, <strong>không phải là phiếu nhập hàng mới</strong> và không làm phát sinh tăng tổng tồn kho của doanh nghiệp.
              </div>
            </div>
          )}

          {/* Bảng Chi Tiết Mặt Hàng & Các Vế Giao Dịch */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                <span>Chi Tiết Bút Toán Sổ Cái ({displayItems.length} vế)</span>
              </span>
              {loadingLegs && (
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Đang tải vế đối ứng...
                </span>
              )}
            </h4>
            <div className="rounded-xl border border-slate-200 overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50/80 text-xs text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">STT</th>
                    <th className="py-2.5 px-3 min-w-[180px]">Sản Phẩm & SKU</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Lô & HSD</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Vị Trí Ô Kệ</th>
                    <th className="py-2.5 px-3 text-center whitespace-nowrap">Biến Động (SL)</th>
                    <th className="py-2.5 px-3 text-center whitespace-nowrap">Tồn Trước</th>
                    <th className="py-2.5 px-3 text-center whitespace-nowrap">Tồn Sau</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white font-sans text-slate-800">
                  {displayItems.map((item, idx) => {
                    const isMinus = item.qtyChange < 0;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 text-center text-slate-500 font-mono text-xs">{idx + 1}</td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-900 text-xs sm:text-sm">{item.productName}</div>
                          <div className="text-slate-500 font-mono text-xs">{item.productSku}</div>
                        </td>
                        <td className="py-3 px-3 font-mono text-xs whitespace-nowrap">
                          <div className="font-bold text-slate-800">{item.batchNumber}</div>
                          <div className="text-slate-500 text-[11px]">HSD: {item.expiryDate}</div>
                        </td>
                        <td className="py-3 px-3 font-mono text-xs whitespace-nowrap">
                          <span className="bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 text-slate-800 font-bold">
                            {item.locationBarcode}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap font-mono font-bold">
                          {isSnapshot ? (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-200">
                              0 (Xác nhận số dư)
                            </span>
                          ) : (
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs ${
                                isMinus
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              }`}
                            >
                              {item.qtyChange > 0 ? `+${item.qtyChange}` : item.qtyChange} SP
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-600 tabular-nums">
                          {item.balanceBefore.toLocaleString('vi-VN')}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-900 tabular-nums">
                          {item.balanceAfter.toLocaleString('vi-VN')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Ghi chú */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm">
            <span className="text-slate-700 font-bold block">Ghi chú nghiệp vụ:</span>
            <p className="text-slate-800 mt-1 font-medium leading-relaxed">{entry.notes || 'Bút toán tự động ghi nhận vào sổ cái theo nguyên tắc Append-Only.'}</p>
          </div>

          {/* Chữ Ký 3 Bên */}
          <div className="pt-4 border-t border-slate-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="space-y-1">
                <span className="text-xs sm:text-sm font-bold text-slate-900 block">Người Lập Phiếu</span>
                <span className="text-xs text-slate-500 block italic">(Ký, ghi rõ họ tên)</span>
                <div className="h-16 flex items-end justify-center">
                  <span className="text-xs sm:text-sm font-bold text-indigo-700 border-t border-dashed border-slate-300 pt-1 w-36">
                    {entry.performedBy}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs sm:text-sm font-bold text-slate-900 block">Thủ Kho / Giám Sát</span>
                <span className="text-xs text-slate-500 block italic">(Ký, ghi rõ họ tên)</span>
                <div className="h-16 flex items-end justify-center">
                  <span className="text-xs sm:text-sm font-bold text-indigo-700 border-t border-dashed border-slate-300 pt-1 w-36">
                    Quản Lý Kho WMS
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs sm:text-sm font-bold text-slate-900 block">Người Nhận / Vận Chuyển</span>
                <span className="text-xs text-slate-500 block italic">(Ký, ghi rõ họ tên)</span>
                <div className="h-16 flex items-end justify-center">
                  <span className="text-xs sm:text-sm font-medium text-slate-400 border-t border-dashed border-slate-300 pt-1 w-36">
                    (Ký nhận)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 print:hidden">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-xs sm:text-sm font-bold border border-slate-300 transition-colors cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4 text-indigo-600" />
            <span>In Chứng Từ Này</span>
          </button>

          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-md shadow-indigo-200"
          >
            Đóng Lại
          </button>
        </div>
      </div>
    </div>
  );
};
