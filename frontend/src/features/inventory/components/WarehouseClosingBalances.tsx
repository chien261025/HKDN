import React, { useState } from 'react';
import { OutboundStock } from '../../outbound/types';
import { Lock, CheckCircle2, Info, Ban, ShieldCheck, AlertTriangle, ChevronDown, ChevronUp, Layers } from 'lucide-react';

interface WarehouseClosingBalancesProps {
  balances: OutboundStock[];
  selectedWarehouseId?: string | number;
  warehouseName?: string;
  defaultExpanded?: boolean;
}

export const WarehouseClosingBalances: React.FC<WarehouseClosingBalancesProps> = ({
  balances,
  selectedWarehouseId = 'ALL',
  warehouseName,
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const getCleanWhId = (wId?: string | number) => {
    if (!wId || wId === 'ALL') return null;
    const m = String(wId).match(/\d+/);
    return m ? parseInt(m[0], 10) : null;
  };

  const activeWhNum = getCleanWhId(selectedWarehouseId);

  const products = balances.filter((p) => {
    if (!activeWhNum) return p.onHandQty > 0;
    return p.warehouseId === activeWhNum && p.onHandQty > 0;
  });

  const scopeLabel =
    !activeWhNum
      ? 'Toàn bộ chi nhánh kho'
      : warehouseName || (activeWhNum === 2 ? 'Kho Phân Phối VSIP Bắc Ninh' : 'Kho Tổng Tân Bình - TP.HCM');

  const totalOnHand = products.reduce((sum, p) => sum + p.onHandQty, 0);
  const totalReserved = products.reduce((sum, p) => sum + (p.reservedQty || 0), 0);
  const totalUnavailable = products.reduce((sum, p) => sum + (p.unavailableQty || 0), 0);
  const totalAvailable = products.reduce((sum, p) => sum + p.availableQty, 0);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden transition-all duration-200">
      {/* Top Header / Collapsible Control Bar */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 hover:bg-slate-50 transition-colors cursor-pointer select-none border-b border-slate-200/80"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-bold text-slate-900 text-sm sm:text-base">
                Kiểm Soát Tồn Kho & Giữ Chỗ (Stock Reservation Balance)
              </h2>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                {products.length} Mặt Hàng
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                {scopeLabel}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Bóc tách minh bạch: Tồn vật lý · Đã giữ cho đơn (Reserved) · Hàng không được xuất · Tồn khả dụng thực tế.
            </p>
          </div>
        </div>

        {/* Right side: Mini summary badges & Expand toggle */}
        <div className="flex items-center gap-3 self-end sm:self-center">
          <div className="hidden lg:flex items-center gap-2 text-xs font-mono">
            <span className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold" title="Tổng tồn vật lý trên kệ">
              Vật lý: {totalOnHand.toLocaleString('vi-VN')}
            </span>
            <span className="px-2 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-bold" title="Đã giữ cho các đơn SO">
              Đã giữ: {totalReserved.toLocaleString('vi-VN')}
            </span>
            <span className="px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold" title="Khả dụng xuất ngay">
              Khả dụng: {totalAvailable.toLocaleString('vi-VN')}
            </span>
          </div>

          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 shadow-2xs transition-all cursor-pointer"
          >
            <span>{isExpanded ? 'Thu Gọn Ma Trận' : 'Chi Tiết Tồn Kho'}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>
        </div>
      </div>

      {/* Expanded Content Body */}
      {isExpanded && (
        <div className="p-5 space-y-4 animate-in fade-in duration-200">
          {/* Table */}
          <div className="max-h-80 overflow-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase sticky top-0 border-b border-slate-200 z-10">
                <tr>
                  <th className="py-2.5 px-3">Chi Nhánh Kho</th>
                  <th className="py-2.5 px-3">Mã SKU</th>
                  <th className="py-2.5 px-3 min-w-[180px]">Tên Sản Phẩm</th>
                  <th className="py-2.5 px-3">Đơn Vị</th>
                  <th className="py-2.5 px-3 text-right">Tồn Vật Lý (On-Hand)</th>
                  <th className="py-2.5 px-3 text-right">Đã Giữ Cho Đơn (Reserved)</th>
                  <th className="py-2.5 px-3 text-right">Hết Hạn / Khóa (Unavailable)</th>
                  <th className="py-2.5 px-3 text-right">Khả Dụng Xuất (Available)</th>
                  <th className="py-2.5 px-3 text-center">Trạng Thái Phân Bổ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                {products.map((p) => {
                  const reserved = p.reservedQty ?? 0;
                  const unavailable = p.unavailableQty ?? 0;
                  const available = p.availableQty;
                  const isFullyReserved = available === 0 && reserved > 0;
                  const isQuarantined = available === 0 && reserved === 0 && unavailable > 0;

                  return (
                    <tr key={`${p.warehouseId || 1}-${p.productId}`} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          p.warehouseId === 2
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {p.warehouseId === 2 ? 'VSIP Bắc Ninh' : 'Tân Bình'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{p.sku}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{p.name}</td>
                      <td className="py-2.5 px-3 text-slate-600 font-semibold">{p.unit}</td>
                      <td className="py-2.5 px-3 text-right font-bold tabular-nums text-slate-900">
                        {p.onHandQty.toLocaleString('vi-VN')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold tabular-nums text-amber-700">
                        {reserved > 0 ? (
                          <span className="inline-flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <Lock className="w-3 h-3 text-amber-600" />
                            {reserved.toLocaleString('vi-VN')}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">0</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold tabular-nums text-rose-700">
                        {unavailable > 0 ? (
                          <span className="inline-flex items-center gap-1 bg-rose-50 px-2 py-0.5 rounded border border-rose-200" title="Hàng hết hạn, cách ly hoặc ô kệ ngưng hoạt động">
                            <Ban className="w-3 h-3 text-rose-600" />
                            {unavailable.toLocaleString('vi-VN')}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">0</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-black tabular-nums text-emerald-700 text-sm">
                        {available.toLocaleString('vi-VN')}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {available > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3" /> SẴN SÀNG XUẤT
                          </span>
                        ) : isFullyReserved ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                            <Lock className="w-3 h-3" /> ĐÃ GIỮ HẾT TỒN
                          </span>
                        ) : isQuarantined ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                            <AlertTriangle className="w-3 h-3" /> CÁCH LY / HẾT HẠN
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-500 text-[10px] font-bold">
                            HẾT HÀNG
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {products.length === 0 && (
              <p className="p-4 text-xs text-slate-500 text-center">Chưa có sản phẩm còn tồn trong phạm vi kho đã chọn.</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
