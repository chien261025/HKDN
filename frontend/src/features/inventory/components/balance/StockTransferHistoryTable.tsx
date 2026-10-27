import React from 'react';
import { ArrowRight, CheckCircle2, Clock, ArrowRightLeft } from 'lucide-react';
import { StockTransferDto } from '../../types';

interface StockTransferHistoryTableProps {
  transfers: StockTransferDto[];
  loading: boolean;
  onViewLedger?: (transfer: StockTransferDto) => void;
}

export const StockTransferHistoryTable: React.FC<StockTransferHistoryTableProps> = ({
  transfers,
  loading,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center text-slate-500 shadow-xs">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="font-semibold text-xs text-slate-700">Đang tải lịch sử điều chuyển nội bộ...</p>
      </div>
    );
  }

  if (transfers.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center text-slate-500 shadow-xs">
        <ArrowRightLeft className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="font-bold text-slate-800 text-sm">Chưa có lệnh điều chuyển nào trong ca làm việc!</p>
        <p className="text-xs text-slate-500 mt-1">
          Bấm nút "Chuyển Kệ" tại bảng tồn kho thực tế để lập lệnh điều chuyển hàng hóa giữa các ô.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="p-3 sm:p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
            <span>Lịch Sử Điều Chuyển Hàng Nội Bộ ({transfers.length})</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Giao dịch chuyển ô kệ đã được ghi nhận đối ứng vào Sổ cái
          </p>
        </div>
      </div>

      {/* Mobile Card Feed (< md) */}
      <div className="block md:hidden p-3 space-y-3 bg-slate-50/70">
        {transfers.map((t) => (
          <div key={t.id} className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 text-xs">
                {t.transferCode}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Hoàn Tất
              </span>
            </div>

            <div>
              <div className="font-semibold text-slate-900 text-sm">{t.productName}</div>
              <div className="text-xs font-mono text-slate-500 mt-0.5 flex items-center gap-2">
                <span>SKU: {t.productSku}</span>
                <span>•</span>
                <span>Lô: {t.batchNumber}</span>
              </div>
            </div>

            {/* From -> To */}
            <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 font-mono text-xs">
              <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-semibold">
                {t.fromLocationBarcode}
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold">
                {t.toLocationBarcode}
              </span>
              <span className="font-bold text-slate-900 font-sans text-xs">
                {t.quantity.toLocaleString('vi-VN')} SP
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
              <span className="truncate max-w-[180px] font-sans text-slate-600">{t.notes}</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(t.createdAt).toLocaleTimeString('vi-VN')}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table (>= md) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider text-2xs">
              <th className="py-3 px-4 min-w-[130px] whitespace-nowrap">Mã Phiếu</th>
              <th className="py-3 px-4 min-w-[200px]">Mặt Hàng & Lô</th>
              <th className="py-3 px-4 text-center min-w-[280px] whitespace-nowrap">Lộ Trình Điều Chuyển</th>
              <th className="py-3 px-4 text-right min-w-[100px] whitespace-nowrap">Số Lượng</th>
              <th className="py-3 px-4 min-w-[220px]">Thời Gian & Ghi Chú</th>
              <th className="py-3 px-4 text-center min-w-[110px] whitespace-nowrap">Trạng Thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {transfers.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3 px-4 whitespace-nowrap">
                  <span className="font-mono font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 text-xs">
                    {t.transferCode}
                  </span>
                </td>

                <td className="py-3 px-4">
                  <div className="font-semibold text-slate-900 text-sm">{t.productName}</div>
                  <div className="text-2xs font-mono text-slate-500 mt-0.5 flex items-center gap-2">
                    <span>SKU: {t.productSku}</span>
                    <span>•</span>
                    <span className="text-slate-600 font-medium">Lô: {t.batchNumber}</span>
                  </div>
                </td>

                <td className="py-3 px-4 whitespace-nowrap">
                  <div className="flex items-center justify-center gap-2 font-mono text-xs">
                    <span className="px-2 py-1 rounded-md bg-slate-100/90 border border-slate-200/80 text-slate-700 font-medium whitespace-nowrap">
                      {t.fromLocationBarcode}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="px-2 py-1 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 font-medium whitespace-nowrap">
                      {t.toLocationBarcode}
                    </span>
                  </div>
                </td>

                <td className="py-3 px-4 text-right font-semibold text-sm text-slate-900 tabular-nums whitespace-nowrap">
                  {t.quantity.toLocaleString('vi-VN')} SP
                </td>

                <td className="py-3 px-4">
                  <div className="text-slate-700 font-medium truncate max-w-xs">{t.notes}</div>
                  <div className="text-2xs text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{new Date(t.createdAt).toLocaleString('vi-VN')}</span>
                  </div>
                </td>

                <td className="py-3 px-4 text-center whitespace-nowrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Hoàn Tất</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
