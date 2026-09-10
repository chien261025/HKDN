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
        message: `Số lượng yêu cầu (${reserveQty}) vượt quá tồn khả dụng (${reserveModalItem.availableQty})!`,
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
      message: `Đã khóa giữ ${reserveQty} sản phẩm an toàn với khóa bi quan (SELECT FOR UPDATE)!`,
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
    <div className="space-y-4 max-w-[1600px] mx-auto pb-10">
      {/* Header Gọn Gàng & Thanh Lịch Chuẩn Enterprise SaaS */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">Quản Lý Tồn Kho & Xuất Hàng</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Cân đối tồn kho ba trạng thái (On-Hand, Reserved, Available) và xuất kho theo chiến lược FEFO.
          </p>
        </div>

        {/* Tab Gạt Tinh Gọn (Segmented Control) */}
        <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('outbound')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'outbound'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Xuất Kho FEFO</span>
          </button>

          <button
            onClick={() => setActiveTab('balance')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'balance'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Bảng Tồn Kho Thực Tế</span>
          </button>
        </div>
      </div>

      {/* Thông Báo Nhỏ Gọn (Nếu có) */}
      {notification && (
        <div
          className={`p-3 rounded-xl text-xs font-medium flex items-center justify-between transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
              : 'bg-rose-950/40 text-rose-300 border border-rose-500/30'
          }`}
        >
          <div className="flex items-center gap-2">
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

      {/* Nội Dung Phân Hệ Theo Tab */}
      {activeTab === 'outbound' ? (
        <OutboundFefoWorkbench />
      ) : (
        /* Tab 2: Bảng Tồn Kho Thực Tế */
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

          {/* Bảng Dữ Liệu Tồn Kho Sạch Sẽ */}
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
                    onClick={handleReserve}
                    className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-sm"
                  >
                    Xác Nhận Khóa
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
