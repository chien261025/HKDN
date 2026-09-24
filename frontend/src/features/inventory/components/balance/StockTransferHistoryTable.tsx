import React from 'react';
import { ArrowRight, CheckCircle2, Clock, MapPin, Package, ArrowRightLeft } from 'lucide-react';
import { StockTransferDto } from '../../types';

interface StockTransferHistoryTableProps {
  transfers: StockTransferDto[];
  loading: boolean;
  onViewLedger?: (transfer: StockTransferDto) => void;
}

export const StockTransferHistoryTable: React.FC<StockTransferHistoryTableProps> = ({
  transfers,
  loading,
  onViewLedger,
}) => {
  if (loading) {
    return (
      <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center text-slate-500 shadow-xs">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="font-semibold text-xs text-slate-700">Đang tải lịch sử điều chuyển nội bộ...</p>
      </div>
    );
  }

  if (transfers.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center text-slate-500 shadow-xs">
        <ArrowRightLeft className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="font-bold text-slate-800 text-sm">Chưa có lệnh điều chuyển nào trong ca làm việc!</p>
        <p className="text-xs text-slate-500 mt-1">
          Bấm nút "Chuyển Kệ" tại bảng tồn kho thực tế để lập lệnh điều chuyển hàng hóa giữa các ô.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
            Lịch Sử Điều Chuyển Hàng Nội Bộ ({transfers.length})
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Các giao dịch chuyển ô đã được ghi nhận đối ứng vào Sổ cái Thẻ kho bất biến
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-2xs">
              <th className="py-3.5 px-4">Mã Phiếu</th>
              <th className="py-3.5 px-4">Mặt Hàng & Lô</th>
              <th className="py-3.5 px-4 text-center">Lộ Trình Điều Chuyển</th>
              <th className="py-3.5 px-4 text-right">Số Lượng</th>
              <th className="py-3.5 px-4">Thời Gian & Ghi Chú</th>
              <th className="py-3.5 px-4 text-center">Trạng Thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transfers.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                {/* Mã phiếu */}
                <td className="py-3 px-4">
                  <span className="font-mono font-black text-indigo-700">{t.transferCode}</span>
                </td>

                {/* Mặt hàng */}
                <td className="py-3 px-4">
                  <div className="font-bold text-slate-900">{t.productName}</div>
                  <div className="text-2xs font-mono text-slate-500 mt-0.5 flex items-center gap-2">
                    <span>SKU: {t.productSku}</span>
                    <span>•</span>
                    <span className="text-amber-800 font-bold">Lô: {t.batchNumber}</span>
                  </div>
                </td>

                {/* Lộ trình: Ô nguồn -> Ô đích */}
                <td className="py-3 px-4">
                  <div className="flex items-center justify-center gap-2 font-mono text-xs">
                    <span className="px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-semibold">
                      {t.fromLocationBarcode}
                    </span>
                    <ArrowRight className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                    <span className="px-2 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold">
                      {t.toLocationBarcode}
                    </span>
                  </div>
                </td>

                {/* Số lượng */}
                <td className="py-3 px-4 text-right font-mono font-bold text-sm text-indigo-900">
                  {t.quantity} cái
                </td>

                {/* Ghi chú & Thời gian */}
                <td className="py-3 px-4">
                  <div className="text-slate-800 font-medium truncate max-w-xs">{t.notes}</div>
                  <div className="text-2xs text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(t.createdAt).toLocaleString('vi-VN')}</span>
                  </div>
                </td>

                {/* Trạng thái */}
                <td className="py-3 px-4 text-center">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-2xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>HOÀN TẤT</span>
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
