import React, { useState } from 'react';
import {
  Package,
  Lock,
  AlertCircle,
  CheckCircle2,
  Search,
  ShieldCheck,
  Zap,
  Layers,
  Sparkles,
  ArrowDownRight,
  Filter,
  TrendingDown
} from 'lucide-react';
import { OutboundFefoWorkbench } from '../components/OutboundFefoWorkbench';

interface StockItem {
  id: number;
  productId: number;
  sku: string;
  name: string;
  locationBarcode: string;
  batchNumber: string;
  expiryDate: string;
  onHandQty: number;
  reservedQty: number;
  availableQty: number;
  isExpiringSoon?: boolean;
}

export const InventoryBalancePage: React.FC = () => {
  // Active Tab: 'outbound' (FEFO Workbench) vs 'balance' (Matrix Table)
  const [activeTab, setActiveTab] = useState<'outbound' | 'balance'>('outbound');

  const [stocks, setStocks] = useState<StockItem[]>([
    {
      id: 1,
      productId: 1,
      sku: 'SKU-MILK-100',
      name: 'Sữa tươi tiệt trùng Vinamilk 100% 1L',
      locationBarcode: 'ZB-B01-R01-S01-B05',
      batchNumber: 'BATCH-MILK-26A',
      expiryDate: '2026-09-25',
      onHandQty: 80,
      reservedQty: 0,
      availableQty: 80,
      isExpiringSoon: true,
    },
    {
      id: 2,
      productId: 1,
      sku: 'SKU-MILK-100',
      name: 'Sữa tươi tiệt trùng Vinamilk 100% 1L',
      locationBarcode: 'ZB-B01-R01-S02-B06',
      batchNumber: 'BATCH-MILK-26B',
      expiryDate: '2026-11-30',
      onHandQty: 200,
      reservedQty: 10,
      availableQty: 190,
      isExpiringSoon: false,
    },
    {
      id: 3,
      productId: 2,
      sku: 'SKU-SAMS-S24',
      name: 'Điện thoại Samsung Galaxy S24 Ultra 256GB',
      locationBarcode: 'ZA-A01-R01-S01-B01',
      batchNumber: 'BATCH-S24-01',
      expiryDate: '2028-01-10',
      onHandQty: 25,
      reservedQty: 5,
      availableQty: 20,
      isExpiringSoon: false,
    },
    {
      id: 4,
      productId: 3,
      sku: 'SKU-OMO-MATIC',
      name: 'Nước giặt OMO Matic Cửa Trên 3.6kg',
      locationBarcode: 'ZA-A01-R02-S01-B03',
      batchNumber: 'BATCH-OMO-01',
      expiryDate: '2027-03-01',
      onHandQty: 60,
      reservedQty: 0,
      availableQty: 60,
      isExpiringSoon: false,
    },
  ]);

  const [reserveModalItem, setReserveModalItem] = useState<StockItem | null>(null);
  const [reserveQty, setReserveQty] = useState<number>(5);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterExpiring, setFilterExpiring] = useState<boolean>(false);

  const handleReserve = () => {
    if (!reserveModalItem) return;

    if (reserveQty > reserveModalItem.availableQty) {
      setNotification({
        type: 'error',
        message: `Khóa dữ liệu chống âm kho: Số lượng yêu cầu (${reserveQty}) vượt quá tồn khả dụng (${reserveModalItem.availableQty})!`,
      });
      return;
    }

    setStocks((prev) =>
      prev.map((item) => {
        if (item.id === reserveModalItem.id) {
          const newReserved = item.reservedQty + reserveQty;
          return {
            ...item,
            reservedQty: newReserved,
            availableQty: item.onHandQty - newReserved,
          };
        }
        return item;
      })
    );

    setNotification({
      type: 'success',
      message: `Giữ hàng thành công ${reserveQty} cái với khóa bi quan (SELECT FOR UPDATE)!`,
    });
    setReserveModalItem(null);
  };

  const filteredStocks = stocks.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.locationBarcode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterExpiring ? s.isExpiringSoon : true;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      {/* Top Header & Tab Navigation Controller */}
      <div className="glass-panel rounded-3xl p-5 md:p-6 border border-slate-800/80 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 ring-1 ring-white/20">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-white tracking-tight">PHÂN HỆ QUẢN TRỊ TỒN KHO & XUẤT HÀNG</h1>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  CONCURRENCY SAFE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Kiến trúc 3 trạng thái số dư: <span className="text-white font-mono font-bold">On-Hand</span> (Vật lý) ={' '}
                <span className="text-amber-400 font-mono font-bold">Reserved</span> (Đang giữ) +{' '}
                <span className="text-emerald-400 font-mono font-bold">Available</span> (Khả dụng)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold whitespace-nowrap shadow-inner">
            <ShieldCheck className="w-4 h-4" />
            <span>Pessimistic Lock (SELECT FOR UPDATE): SẴN SÀNG</span>
          </div>
        </div>

        {/* Tab Switching Navigation */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800/80">
          <button
            onClick={() => setActiveTab('outbound')}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs font-extrabold transition-all relative ${
              activeTab === 'outbound'
                ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-lg shadow-indigo-600/30 border border-cyan-400/40'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800'
            }`}
          >
            <Zap className={`w-4 h-4 ${activeTab === 'outbound' ? 'text-cyan-200' : 'text-indigo-400'}`} />
            <span>⚡ ĐIỀU PHỐI XUẤT KHO FEFO & SỔ CÁI (WORKBENCH)</span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 ml-1">
              ƯU TIÊN #1
            </span>
          </button>

          <button
            onClick={() => setActiveTab('balance')}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl text-xs font-extrabold transition-all relative ${
              activeTab === 'balance'
                ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-lg shadow-indigo-600/30 border border-cyan-400/40'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>📊 BẢNG CÂN ĐỐI TỒN KHO THỰC TẾ (BALANCE MATRIX)</span>
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {notification && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-lg transition-all animate-in fade-in duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
              : 'bg-rose-950/60 text-rose-300 border border-rose-500/40'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Dynamic Tab Body */}
      {activeTab === 'outbound' ? (
        /* TAB 1: Outbound FEFO Workbench */
        <OutboundFefoWorkbench />
      ) : (
        /* TAB 2: Inventory Balance Matrix Table */
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Table Search & Filter Toolbar */}
          <div className="glass-panel rounded-2xl p-4 border border-slate-800/80 flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm theo SKU, tên sản phẩm, mã ô kệ Barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700/60 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-medium"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                onClick={() => setFilterExpiring(!filterExpiring)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                  filterExpiring
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <TrendingDown className="w-3.5 h-3.5" />
                <span>Chỉ Hiện Lô Cận Date (FEFO)</span>
              </button>
            </div>
          </div>

          {/* Matrix Table */}
          <div className="glass-panel rounded-2xl border border-slate-800/80 shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-4 px-5">Sản Phẩm & Mã SKU</th>
                    <th className="py-4 px-5">Vị Trí Ô Kệ</th>
                    <th className="py-4 px-5">Số Lô & Hạn Sử Dụng</th>
                    <th className="py-4 px-5 text-center">Tồn Vật Lý (On-Hand)</th>
                    <th className="py-4 px-5 text-center">Đang Giữ (Reserved)</th>
                    <th className="py-4 px-5 text-center">Khả Dụng (Available)</th>
                    <th className="py-4 px-5 text-right">Khóa Giữ Đơn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-200">
                  {filteredStocks.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-5">
                        <div className="font-bold text-white text-sm tracking-tight">{item.name}</div>
                        <div className="text-slate-400 font-mono text-[11px] mt-0.5">{item.sku}</div>
                      </td>
                      <td className="py-4 px-5 font-mono">
                        <span className="bg-slate-800/80 text-cyan-300 px-2.5 py-1 rounded-lg border border-slate-700/60 text-[11px]">
                          {item.locationBarcode}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <div className="font-mono text-slate-300 font-bold">{item.batchNumber}</div>
                        <div className="mt-1 flex items-center gap-2 font-mono text-[11px]">
                          <span className="text-slate-400">Hạn: {item.expiryDate}</span>
                          {item.isExpiringSoon && (
                            <span className="text-[9px] bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold px-1.5 py-0.5 rounded animate-pulse">
                              CẬN DATE (FEFO)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-5 text-center font-mono font-extrabold text-white text-base">
                        {item.onHandQty}
                      </td>
                      <td className="py-4 px-5 text-center font-mono font-bold text-amber-400 text-sm">
                        {item.reservedQty > 0 ? `+${item.reservedQty}` : '0'}
                      </td>
                      <td className="py-4 px-5 text-center font-mono">
                        <span className="font-extrabold text-emerald-400 text-base bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/30">
                          {item.availableQty}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <button
                          onClick={() => {
                            setReserveModalItem(item);
                            setReserveQty(5);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-indigo-900/30"
                        >
                          <Lock className="w-3 h-3" />
                          <span>Giữ Hàng (Lock)</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal Giữ Hàng Pessimistic Lock */}
          {reserveModalItem && (
            <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50">
              <div className="bg-[#0f172a] rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-700 space-y-4 text-slate-200">
                <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <Lock className="w-4 h-4 text-cyan-400" />
                    Khóa Bi Quan (SELECT FOR UPDATE)
                  </h3>
                  <button onClick={() => setReserveModalItem(null)} className="text-slate-400 hover:text-white font-bold text-sm">
                    ✕
                  </button>
                </div>

                <p className="text-xs text-slate-400">
                  Giả lập 1 đơn hàng khóa giữ mặt hàng <strong className="text-white">{reserveModalItem.name}</strong> tại ô kệ{' '}
                  <span className="font-mono font-bold text-cyan-400">{reserveModalItem.locationBarcode}</span>
                </p>

                <div className="bg-slate-900/80 p-3.5 rounded-xl space-y-2 text-xs font-mono border border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tồn khả dụng hiện tại:</span>
                    <span className="font-bold text-emerald-400 text-sm">{reserveModalItem.availableQty} cái</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Mã lô hàng:</span>
                    <span className="text-cyan-300 font-bold">{reserveModalItem.batchNumber}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Nhập số lượng cần giữ (Reserve Qty):</label>
                  <input
                    type="number"
                    min="1"
                    value={reserveQty}
                    onChange={(e) => setReserveQty(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono font-bold text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setReserveModalItem(null)}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-all border border-slate-700"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleReserve}
                    className="flex-1 py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-indigo-600/30"
                  >
                    Xác Nhận Giữ Chỗ
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

