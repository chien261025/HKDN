import React, { useState } from 'react';
import { Search, TrendingDown, Lock, FileText, AlertTriangle } from 'lucide-react';
import { StockItem } from '../../types';

interface StockBalanceTableProps {
  stocks: StockItem[];
  onReserveItem: (item: StockItem, qty: number) => void;
  onViewLedger?: (item: StockItem) => void;
}

export const StockBalanceTable: React.FC<StockBalanceTableProps> = ({
  stocks,
  onReserveItem,
  onViewLedger,
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
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-[#0b1222] p-4 rounded-2xl border border-slate-700/80 shadow-xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm SKU, tên sản phẩm, mã ô kệ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all font-medium shadow-inner"
          />
        </div>

        <button
          onClick={() => setFilterExpiring(!filterExpiring)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
            filterExpiring
              ? 'bg-rose-500/25 text-rose-300 border-rose-400/80 shadow-md shadow-rose-950/40'
              : 'bg-slate-950 text-slate-300 border-slate-700 hover:border-slate-600 hover:text-white'
          }`}
        >
          <TrendingDown className={`w-4 h-4 ${filterExpiring ? 'text-rose-300' : 'text-slate-400'}`} />
          <span>Chỉ hiện lô cận hạn (FEFO)</span>
        </button>
      </div>

      {/* Bảng Dữ Liệu Tồn Kho Sắc Nét */}
      <div className="bg-[#0b1222] rounded-2xl border border-slate-700/80 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto px-4 py-2">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#0e1628] border-b-2 border-slate-700 text-slate-200 font-black text-xs uppercase tracking-wider">
                <th className="py-3 px-3.5">Sản Phẩm & SKU</th>
                <th className="py-3 px-3.5">Vị Trí Ô Kệ</th>
                <th className="py-3 px-3.5">Lô Hàng & Hạn Dùng</th>
                <th className="py-3 px-3.5 text-center">Tồn Thực Tế</th>
                <th className="py-3 px-3.5 text-center">Đang Giữ</th>
                <th className="py-3 px-3.5 text-center">Khả Dụng</th>
                <th className="py-3 px-3.5 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200 font-sans">
              {filteredStocks.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/50 transition-colors group">
                  <td className="py-3.5 px-3.5">
                    <div className="font-bold text-white text-sm group-hover:text-cyan-300 transition-colors">{item.name}</div>
                    <div className="text-cyan-400 font-mono text-xs font-bold mt-0.5">{item.sku}</div>
                  </td>
                  <td className="py-3.5 px-3.5 font-mono text-xs">
                    <span className="bg-slate-900 text-slate-100 font-bold px-2.5 py-1 rounded-lg border border-slate-700 shadow-sm">
                      {item.locationBarcode}
                    </span>
                  </td>
                  <td className="py-3.5 px-3.5">
                    <div className="font-mono text-amber-300 font-bold text-xs">{item.batchNumber}</div>
                    <div className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5 font-medium">
                      <span>HSD: <strong className="text-white">{item.expiryDate}</strong></span>
                      {item.isExpiringSoon && (
                        <span className="text-[10px] font-black bg-rose-500/25 text-rose-300 border border-rose-500/60 px-2 py-0.5 rounded flex items-center gap-1 shadow-sm">
                          <AlertTriangle className="w-3 h-3 text-rose-400" /> CẬN HẠN
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-3.5 text-center font-mono font-black text-white text-base">
                    {item.onHandQty}
                  </td>
                  <td className="py-3.5 px-3.5 text-center font-mono font-black text-amber-300 text-base">
                    {item.reservedQty > 0 ? `+${item.reservedQty}` : '0'}
                  </td>
                  <td className="py-3.5 px-3.5 text-center font-mono font-black text-emerald-400 text-base">
                    {item.availableQty}
                  </td>
                  <td className="py-3.5 px-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {onViewLedger && (
                        <button
                          onClick={() => onViewLedger(item)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-cyan-300 hover:text-white border border-slate-700 text-xs font-bold transition-all cursor-pointer shadow-sm"
                          title="Xem chi tiết phiếu nhập kho"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Xem Phiếu</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setReserveModalItem(item);
                          setReserveQty(5);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black transition-all cursor-pointer shadow-md shadow-amber-500/30 active:scale-95"
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0b1222] rounded-2xl p-6 max-w-sm w-full border border-slate-700 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-700">
              <h3 className="font-black text-white text-base flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>Giữ Hàng Cho Đơn Xuất</span>
              </h3>
              <button onClick={() => setReserveModalItem(null)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 font-medium leading-relaxed">
              Mặt hàng: <strong className="text-white font-bold">{reserveModalItem.name}</strong> ({reserveModalItem.locationBarcode})
            </p>

            <div className="bg-[#111c33] p-3 rounded-xl text-xs space-y-1.5 font-mono border border-slate-700/80 shadow-inner">
              <div className="flex justify-between text-slate-300">
                <span>Tồn khả dụng:</span>
                <span className="text-emerald-400 font-black text-sm">{reserveModalItem.availableQty} SP</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Mã lô hàng:</span>
                <span className="text-amber-300 font-bold">{reserveModalItem.batchNumber}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5">Số lượng cần giữ:</label>
              <input
                type="number"
                min="1"
                value={reserveQty}
                onChange={(e) => setReserveQty(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono font-bold text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 shadow-inner"
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setReserveModalItem(null)}
                className="flex-1 py-2.5 bg-slate-800 text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-700 transition-colors border border-slate-700"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmReserve}
                className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-amber-500/30 transition-all cursor-pointer"
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
