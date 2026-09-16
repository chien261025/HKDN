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
    <div className="bg-[#0b1222] rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden space-y-3">
      {/* Tiêu đề rực rỡ & chuyên nghiệp */}
      <div className="p-4 md:p-5 border-b border-slate-700/80 flex items-center justify-between bg-gradient-to-r from-slate-900 via-[#10182b] to-slate-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm md:text-base font-black text-white uppercase tracking-wide flex items-center gap-2">
              <span>Lịch Sử Xuất Nhập Kho Gần Đây</span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/50">
                REALTIME
              </span>
            </h2>
            <p className="text-xs text-slate-300 font-medium mt-0.5">
              Ghi nhận chi tiết mọi giao dịch xuất nhập hàng và biến động số dư ô kệ theo thời gian thực.
            </p>
          </div>
        </div>

        <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-950/80 px-3 py-1.5 rounded-full border border-emerald-500/50 flex items-center gap-2 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          Tự Động Ghi Sổ Kho
        </span>
      </div>

      {/* Bảng Dữ Liệu Lịch Sử Giao Dịch Đậm Nét */}
      <div className="overflow-x-auto px-4 pb-4">
        <table className="w-full text-left text-xs text-slate-200">
          <thead className="bg-[#0e1628] text-xs font-bold text-slate-200 uppercase tracking-wider border-b-2 border-slate-700">
            <tr>
              <th className="py-3 px-3.5">Mã Giao Dịch</th>
              <th className="py-3 px-3.5">Thời Gian</th>
              <th className="py-3 px-3.5">Sản Phẩm & Lô Hàng</th>
              <th className="py-3 px-3.5">Ô Kệ</th>
              <th className="py-3 px-3.5 text-center">Biến Động</th>
              <th className="py-3 px-3.5 text-center">Tồn Sau GD</th>
              <th className="py-3 px-3.5">Mã Đơn Tham Chiếu</th>
              <th className="py-3 px-3.5 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 font-sans">
            {history.map((item) => {
              const isOutbound = item.qtyChange < 0;

              return (
                <tr key={item.id} className="hover:bg-slate-800/50 transition-colors group">
                  {/* Mã Giao Dịch */}
                  <td className="py-3.5 px-3.5">
                    <span className="font-mono font-black text-cyan-300 bg-cyan-950/80 px-2.5 py-1 rounded-lg border border-cyan-500/50 shadow-sm group-hover:border-cyan-400 transition-colors">
                      {item.id}
                    </span>
                  </td>

                  {/* Thời Gian */}
                  <td className="py-3.5 px-3.5 font-mono text-slate-300 text-xs font-medium">
                    {item.timestamp}
                  </td>

                  {/* Mặt hàng & Lô */}
                  <td className="py-3.5 px-3.5">
                    <div className="font-bold text-white text-sm truncate max-w-[240px]" title={item.productName}>
                      {item.productName}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 text-xs font-mono text-slate-300 font-medium">
                      <span className="text-cyan-400">{item.productSku}</span>
                      <span>•</span>
                      <span className="text-amber-300 font-bold">Lô: {item.batchNumber}</span>
                    </div>
                  </td>

                  {/* Ô Kệ */}
                  <td className="py-3.5 px-3.5 font-mono text-xs">
                    <span className="bg-slate-900 text-slate-100 font-bold px-2.5 py-1 rounded-lg border border-slate-700 shadow-sm">
                      {item.locationBarcode}
                    </span>
                  </td>

                  {/* Biến Động Số Lượng */}
                  <td className="py-3.5 px-3.5 text-center">
                    <span
                      className={`inline-flex items-center gap-1 font-mono font-black px-3 py-1 rounded-full text-xs shadow-sm ${
                        isOutbound
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-rose-950/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-emerald-950/30'
                      }`}
                    >
                      {isOutbound ? <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" /> : <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />}
                      {item.qtyChange > 0 ? `+${item.qtyChange}` : item.qtyChange} SP
                    </span>
                  </td>

                  {/* Tồn Sau GD */}
                  <td className="py-3.5 px-3.5 text-center font-mono font-black text-white text-base">
                    {item.balanceAfter}
                  </td>

                  {/* Mã Đơn Tham Chiếu */}
                  <td className="py-3.5 px-3.5 font-mono text-indigo-300 font-bold text-xs">
                    {item.referenceCode}
                  </td>

                  {/* Nút Xem Chứng Từ */}
                  <td className="py-3.5 px-3.5 text-right">
                    <button
                      onClick={() => onSelectEntry(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 border border-indigo-400/30 transition-all cursor-pointer active:scale-95"
                      title="Xem chi tiết phiếu xuất / nhập kho"
                    >
                      <Eye className="w-3.5 h-3.5 text-cyan-300" />
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
