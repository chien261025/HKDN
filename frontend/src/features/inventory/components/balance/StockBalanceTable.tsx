import React, { useState } from 'react';
import { Search, TrendingDown, Lock } from 'lucide-react';
import { StockItem } from '../../types';

interface StockBalanceTableProps {
  stocks: StockItem[];
  onReserveItem: (item: StockItem, qty: number) => void;
}

export const StockBalanceTable: React.FC<StockBalanceTableProps> = ({
  stocks,
  onReserveItem,
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
    <div className="space-y-3">
      {/* Thanh tìm kiếm & lọc nhanh */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm SKU, tên sản phẩm, mã ô kệ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <button
          onClick={() => setFilterExpiring(!filterExpiring)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            filterExpiring
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
          }`}
        >
          <TrendingDown className="w-3.5 h-3.5" />
          <span>Chỉ hiện lô cận date (FEFO)</span>
        </button>
      </div>

      {/* Bảng Dữ Liệu Tồn Kho */}
      <div className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold text-[11px]">
                <th className="py-3 px-4">Sản Phẩm & SKU</th>
                <th className="py-3 px-4">Vị Trí Ô Kệ</th>
                <th className="py-3 px-4">Lô Hàng & Hạn Dùng</th>
                <th className="py-3 px-4 text-center">Vật Lý (On-Hand)</th>
                <th className="py-3 px-4 text-center">Đang Giữ (Reserved)</th>
                <th className="py-3 px-4 text-center">Khả Dụng (Available)</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-slate-200">
              {filteredStocks.map((item) => (
                <tr key={item.id} className="hover:bg-slate-850/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">{item.name}</div>
                    <div className="text-slate-400 font-mono text-[11px]">{item.sku}</div>
                  </td>
                  <td className="py-3 px-4 font-mono">
                    <span className="bg-slate-950 text-cyan-300 px-2 py-0.5 rounded border border-slate-800 text-[11px]">
                      {item.locationBarcode}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-mono text-slate-300 font-medium">{item.batchNumber}</div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <span>Hạn: {item.expiryDate}</span>
                      {item.isExpiringSoon && (
                        <span className="text-[9px] font-bold bg-rose-500/20 text-rose-300 px-1 rounded">
                          CẬN DATE
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-white">
                    {item.onHandQty}
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-semibold text-amber-400">
                    {item.reservedQty > 0 ? `+${item.reservedQty}` : '0'}
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-emerald-400">
                    {item.availableQty}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => {
                        setReserveModalItem(item);
                        setReserveQty(5);
                      }}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition-colors"
                    >
                      Giữ Hàng
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Giữ Hàng Nhỏ Gọn */}
      {reserveModalItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0f172a] rounded-2xl p-5 max-w-sm w-full border border-slate-700 shadow-xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                Khóa Giữ Hàng (SELECT FOR UPDATE)
              </h3>
              <button onClick={() => setReserveModalItem(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Mặt hàng: <strong className="text-white">{reserveModalItem.name}</strong> ({reserveModalItem.locationBarcode})
            </p>

            <div className="bg-slate-900 p-2.5 rounded-lg text-xs space-y-1 font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Tồn khả dụng:</span>
                <span className="text-emerald-400 font-bold">{reserveModalItem.availableQty}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Mã lô hàng:</span>
                <span className="text-slate-200">{reserveModalItem.batchNumber}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Số lượng cần giữ:</label>
              <input
                type="number"
                min="1"
                value={reserveQty}
                onChange={(e) => setReserveQty(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-sm font-mono text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setReserveModalItem(null)}
                className="flex-1 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-xs font-medium hover:bg-slate-750"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmReserve}
                className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-sm"
              >
                Xác Nhận Khóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
