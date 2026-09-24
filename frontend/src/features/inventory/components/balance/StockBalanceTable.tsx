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
      {/* Thanh tìm kiếm & lọc nhanh sắc sảo */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3.5 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm SKU, tên sản phẩm, mã ô kệ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all font-medium shadow-xs"
          />
        </div>

        <button
          onClick={() => setFilterExpiring(!filterExpiring)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer shadow-xs ${
            filterExpiring
              ? 'bg-rose-50 text-rose-700 border-rose-300 ring-2 ring-rose-200'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <TrendingDown className={`w-4 h-4 ${filterExpiring ? 'text-rose-600' : 'text-slate-500'}`} />
          <span>Chỉ hiện lô cận hạn (FEFO)</span>
        </button>
      </div>

      {/* Bảng Dữ Liệu Tồn Kho Sắc Nét */}
      <div className="bg-white rounded-2xl border border-slate-300 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold text-xs sm:text-sm uppercase tracking-wider">
                <th className="py-4 px-5">Sản Phẩm & SKU</th>
                <th className="py-4 px-5">Vị Trí Ô Kệ</th>
                <th className="py-4 px-5">Lô Hàng & Hạn Dùng</th>
                <th className="py-4 px-5 text-center">Tồn Thực Tế</th>
                <th className="py-4 px-5 text-center">Đang Giữ</th>
                <th className="py-4 px-5 text-center">Khả Dụng</th>
                <th className="py-4 px-5 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800 font-sans">
              {filteredStocks.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="py-4 px-5">
                    <div className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-indigo-700 transition-colors">{item.name}</div>
                    <div className="text-indigo-700 font-mono text-xs sm:text-sm font-bold mt-0.5">{item.sku}</div>
                  </td>
                  <td className="py-4 px-5 font-mono text-xs sm:text-sm">
                    <span className="bg-slate-100 text-slate-900 font-black px-3 py-1 rounded-lg border border-slate-300 shadow-2xs">
                      {item.locationBarcode}
                    </span>
                  </td>
                  <td className="py-4 px-5">
                    <div className="font-mono text-slate-900 font-bold text-xs sm:text-sm">{item.batchNumber}</div>
                    <div className="text-xs sm:text-sm text-slate-700 flex items-center gap-1.5 mt-0.5 font-medium">
                      <span>HSD: <strong className="text-slate-900 font-bold">{item.expiryDate}</strong></span>
                      {item.isExpiringSoon && (
                        <span className="text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded flex items-center gap-1 shadow-2xs">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> CẬN HẠN
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-5 text-center font-mono font-black text-slate-900 text-lg">
                    {item.onHandQty}
                  </td>
                  <td className="py-4 px-5 text-center font-mono font-black text-amber-700 text-lg">
                    {item.reservedQty > 0 ? `+${item.reservedQty}` : '0'}
                  </td>
                  <td className="py-4 px-5 text-center font-mono font-black text-emerald-700 text-lg">
                    {item.availableQty}
                  </td>
                  <td className="py-4 px-5 text-right">
                    <div className="flex items-center justify-end gap-2.5">
                      {onViewLedger && (
                        <button
                          onClick={() => onViewLedger(item)}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 hover:text-slate-900 border border-slate-300 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs"
                          title="Xem chi tiết phiếu nhập kho"
                        >
                          <FileText className="w-4 h-4 text-indigo-600" />
                          <span>Xem Phiếu</span>
                        </button>
                      )}
                      {onTransfer && (
                        <button
                          onClick={() => onTransfer(item)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                          title="Lập lệnh điều chuyển sang ô kệ khác"
                        >
                          <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
                          <span>Chuyển Kệ</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setReserveModalItem(item);
                          setReserveQty(5);
                        }}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                      >
                        Giữ Hàng
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
