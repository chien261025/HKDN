import React, { useState } from 'react';
import { Search, TrendingDown, Lock, FileText, AlertTriangle, ArrowRightLeft } from 'lucide-react';
import { StockItem } from '../../types';

interface StockBalanceTableProps {
  stocks: StockItem[];
  onReserveItem: (item: StockItem, qty: number) => void;
  onViewLedger?: (item: StockItem) => void;
  onTransfer?: (item: StockItem) => void;
}

export const StockBalanceTable: React.FC<StockBalanceTableProps> = ({
  stocks,
  onReserveItem,
  onViewLedger,
  onTransfer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterExpiring, setFilterExpiring] = useState(false);
  const [reserveModalItem, setReserveModalItem] = useState<StockItem | null>(null);
  const [reserveQty, setReserveQty] = useState(5);

  const filteredStocks = stocks.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.locationBarcode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterExpiring ? s.isExpiringSoon : true;
    return matchesSearch && matchesFilter;
  });

  const handleConfirmReserve = () => {
    if (!reserveModalItem) return;
    onReserveItem(reserveModalItem, reserveQty);
    setReserveModalItem(null);
  };

  return (
    <div className="space-y-4">
      {/* Thanh tìm kiếm & lọc nhanh */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm SKU, tên sản phẩm, mã ô kệ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-normal"
          />
        </div>

        <button
          onClick={() => setFilterExpiring(!filterExpiring)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium border transition-colors cursor-pointer ${
            filterExpiring
              ? 'bg-rose-50 text-rose-700 border-rose-200 ring-2 ring-rose-100'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <TrendingDown className={`w-4 h-4 ${filterExpiring ? 'text-rose-600' : 'text-slate-400'}`} />
          <span>Chỉ hiện lô cận hạn (FEFO)</span>
        </button>
      </div>

      {/* Bảng Dữ Liệu Tồn Kho Doanh Nghiệp Chuẩn */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                <th className="py-3 px-4 min-w-[240px]">Sản Phẩm & SKU</th>
                <th className="py-3 px-4 min-w-[190px] whitespace-nowrap">Vị Trí Ô Kệ</th>
                <th className="py-3 px-4 min-w-[220px] whitespace-nowrap">Lô Hàng & Hạn Dùng</th>
                <th className="py-3 px-4 text-center w-28 whitespace-nowrap">Tồn Thực Tế</th>
                <th className="py-3 px-4 text-center w-28 whitespace-nowrap">Đang Giữ</th>
                <th className="py-3 px-4 text-center w-28 whitespace-nowrap">Khả Dụng</th>
                <th className="py-3 px-4 text-right min-w-[260px] whitespace-nowrap">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredStocks.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors group">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                      {item.name}
                    </div>
                    <div className="text-slate-500 font-mono text-xs mt-0.5 font-medium">
                      {item.sku}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100/90 text-slate-700 font-mono text-xs font-semibold border border-slate-200/80">
                      {item.locationBarcode}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="font-mono text-slate-800 font-semibold text-xs">
                      {item.batchNumber}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <span>HSD: <span className="font-medium text-slate-700 tabular-nums">{item.expiryDate}</span></span>
                      {item.isExpiringSoon && (
                        <span className="text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.2 rounded inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-rose-500" /> Cận Hạn
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center font-semibold text-slate-900 tabular-nums text-sm">
                    {item.onHandQty.toLocaleString('vi-VN')}
                  </td>
                  <td className="py-3.5 px-4 text-center text-sm tabular-nums">
                    {item.reservedQty > 0 ? (
                      <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/70">
                        {item.reservedQty.toLocaleString('vi-VN')}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-normal">0</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center text-sm tabular-nums">
                    <span className="font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200/70">
                      {item.availableQty.toLocaleString('vi-VN')}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      {onViewLedger && (
                        <button
                          onClick={() => onViewLedger(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium transition-colors cursor-pointer"
                          title="Xem chi tiết phiếu nhập kho"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-500" />
                          <span>Phiếu</span>
                        </button>
                      )}
                      {onTransfer && (
                        <button
                          onClick={() => onTransfer(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium transition-colors cursor-pointer"
                          title="Lập lệnh điều chuyển sang ô kệ khác"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5 text-slate-500" />
                          <span>Chuyển Kệ</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setReserveModalItem(item);
                          setReserveQty(5);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-colors cursor-pointer shadow-2xs"
                      >
                        <Lock className="w-3 h-3" />
                        <span>Giữ Hàng</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Giữ Hàng Nhỏ Gọn & Sắc Nét */}
      {reserveModalItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-600" />
                <span>Giữ Hàng Cho Đơn Xuất</span>
              </h3>
              <button onClick={() => setReserveModalItem(null)} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg">
                ✕
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
              Mặt hàng: <strong className="text-slate-900 font-bold">{reserveModalItem.name}</strong> ({reserveModalItem.locationBarcode})
            </p>

            <div className="bg-slate-50 p-3.5 rounded-xl text-xs sm:text-sm space-y-2 font-mono border border-slate-200">
              <div className="flex justify-between text-slate-700">
                <span>Tồn khả dụng:</span>
                <span className="text-emerald-700 font-bold text-base">{reserveModalItem.availableQty} SP</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Mã lô hàng:</span>
                <span className="text-indigo-700 font-bold">{reserveModalItem.batchNumber}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-700 mb-1.5">Số lượng cần giữ:</label>
              <input
                type="number"
                min="1"
                value={reserveQty}
                onChange={(e) => setReserveQty(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 shadow-xs"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setReserveModalItem(null)}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs sm:text-sm font-bold hover:bg-slate-200 transition-colors border border-slate-200"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmReserve}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-200 transition-all cursor-pointer"
              >
                Xác Nhận Giữ Hàng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
