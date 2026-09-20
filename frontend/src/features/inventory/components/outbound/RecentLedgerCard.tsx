import React from 'react';
import { LedgerEntryData } from '../../types';
import { History, ArrowUpRight, ArrowDownRight, Eye, ShieldCheck } from 'lucide-react';

interface RecentLedgerCardProps {
  history: LedgerEntryData[];
  onSelectEntry: (entry: LedgerEntryData) => void;
}

export const RecentLedgerCard: React.FC<RecentLedgerCardProps> = ({
  history,
  onSelectEntry,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-3">
      {/* Tiêu đề */}
      <div className="p-4 md:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm md:text-base font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <span>Lịch Sử Xuất Nhập Kho Gần Đây</span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                REALTIME
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
              Ghi nhận chi tiết mọi giao dịch xuất nhập hàng và biến động số dư ô kệ theo thời gian thực.
            </p>
          </div>
        </div>

        <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 flex items-center gap-2 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          Tự Động Ghi Sổ Kho
        </span>
      </div>

      {/* Bảng Dữ Liệu Lịch Sử Giao Dịch */}
      <div className="overflow-x-auto px-4 pb-4">
        <table className="w-full text-left text-xs sm:text-sm text-slate-800">
          <thead className="bg-slate-100 text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3.5 px-4">Mã Giao Dịch</th>
              <th className="py-3.5 px-4">Thời Gian</th>
              <th className="py-3.5 px-4">Sản Phẩm & Lô Hàng</th>
              <th className="py-3.5 px-4">Ô Kệ</th>
              <th className="py-3.5 px-4 text-center">Biến Động</th>
              <th className="py-3.5 px-4 text-center">Tồn Sau GD</th>
              <th className="py-3.5 px-4">Mã Đơn Tham Chiếu</th>
              <th className="py-3.5 px-4 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-sans">
            {history.map((item) => {
              const isOutbound = item.qtyChange < 0;

              return (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                  {/* Mã Giao Dịch */}
                  <td className="py-4 px-4">
                    <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 shadow-xs group-hover:border-indigo-400 transition-colors">
                      {item.id}
                    </span>
                  </td>

                  {/* Thời Gian */}
                  <td className="py-4 px-4 font-mono text-slate-600 text-xs font-medium">
                    {item.timestamp}
                  </td>

                  {/* Mặt hàng & Lô */}
                  <td className="py-4 px-4">
                    <div className="font-bold text-slate-900 text-sm truncate max-w-[240px]" title={item.productName}>
                      {item.productName}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-xs font-mono text-slate-600 font-medium">
                      <span className="text-indigo-600 font-semibold">{item.productSku}</span>
                      <span>•</span>
                      <span className="text-slate-800 font-bold">Lô: {item.batchNumber}</span>
                    </div>
                  </td>

                  {/* Ô Kệ */}
                  <td className="py-4 px-4 font-mono text-xs">
                    <span className="bg-slate-100 text-slate-800 font-bold px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs">
                      {item.locationBarcode}
                    </span>
                  </td>

                  {/* Biến Động Số Lượng */}
                  <td className="py-4 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 font-mono font-bold px-3 py-1 rounded-full text-xs shadow-xs ${
                        isOutbound
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {isOutbound ? <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" /> : <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />}
                      {item.qtyChange > 0 ? `+${item.qtyChange}` : item.qtyChange} SP
                    </span>
                  </td>

                  {/* Tồn Sau GD */}
                  <td className="py-4 px-4 text-center font-mono font-bold text-slate-900 text-base">
                    {item.balanceAfter}
                  </td>

                  {/* Mã Đơn Tham Chiếu */}
                  <td className="py-4 px-4 font-mono text-indigo-700 font-bold text-xs">
                    {item.referenceCode}
                  </td>

                  {/* Nút Xem Chứng Từ */}
                  <td className="py-4 px-4 text-right">
                    <button
                      onClick={() => onSelectEntry(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer active:scale-95"
                      title="Xem chi tiết phiếu xuất / nhập kho"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem Phiếu</span>
                    </button>
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
