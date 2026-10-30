import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertOctagon,
  AlertTriangle,
  ShoppingCart,
  CheckCircle2,
  Package,
  ArrowUpDown,
  Filter,
  TrendingDown
} from 'lucide-react';
import { SafetyStockAlert } from '../services/inventoryService';

interface SafetyStockAlertsPanelProps {
  alerts: SafetyStockAlert[];
  onCreatePo?: (alert: SafetyStockAlert) => void;
}

export const SafetyStockAlertsPanel: React.FC<SafetyStockAlertsPanelProps> = ({
  alerts,
  onCreatePo,
}) => {
  const [filterLevel, setFilterLevel] = useState<'ALL' | 'CRITICAL' | 'WARNING'>('ALL');

  const criticalCount = alerts.filter(
    (a) => a.alertLevel === 'CRITICAL' || a.alertLevel === 'OUT_OF_STOCK'
  ).length;
  const warningCount = alerts.filter((a) => a.alertLevel === 'WARNING').length;

  const filteredAlerts = alerts.filter((item) => {
    if (filterLevel === 'CRITICAL') {
      return item.alertLevel === 'CRITICAL' || item.alertLevel === 'OUT_OF_STOCK';
    }
    if (filterLevel === 'WARNING') {
      return item.alertLevel === 'WARNING';
    }
    return true;
  });

  if (alerts.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-200/90 shadow-xs text-center py-16">
        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 border border-emerald-200">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900">Mức Tồn Kho Ổn Định</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Tất cả sản phẩm đều đảm bảo lượng tồn khả dụng trên ngưỡng an toàn (Safety Stock). Chưa cần lập lệnh nhập bổ sung.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 1. Executive Summary Cards (3 KPI nhẹ nhàng, chuẩn Enterprise) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-medium">Tổng mặt hàng cần bổ sung</div>
            <div className="text-2xl font-bold text-slate-900 font-mono mt-1">
              {alerts.length} <span className="text-xs font-sans font-normal text-slate-500">mặt hàng</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Kiểm soát theo mô hình Min-Max</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-rose-700 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span> Cận tồn nguy hiểm (Critical)
            </div>
            <div className="text-2xl font-bold text-rose-600 font-mono mt-1">
              {criticalCount} <span className="text-xs font-sans font-normal text-slate-500">mặt hàng</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Tồn khả dụng &le; Tồn an toàn</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
            <AlertOctagon className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-amber-700 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> Chạm điểm đặt hàng (ROP)
            </div>
            <div className="text-2xl font-bold text-amber-700 font-mono mt-1">
              {warningCount} <span className="text-xs font-sans font-normal text-slate-500">mặt hàng</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Cần lên kế hoạch mua sắm</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2. Replenishment Table (Bảng Quản Trị Tái Đặt Hàng Chuyên Nghiệp) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Header Filter */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-slate-700" />
              Danh Sách Mặt Hàng Cần Đặt Bổ Sung (Reorder List)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Được tự động tính toán từ Định mức tồn an toàn (Safety Stock) và Điểm đặt hàng lại (ROP)
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200 self-start sm:self-auto text-xs font-medium">
            <button
              onClick={() => setFilterLevel('ALL')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterLevel === 'ALL'
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({alerts.length})
            </button>
            <button
              onClick={() => setFilterLevel('CRITICAL')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterLevel === 'CRITICAL'
                  ? 'bg-rose-600 text-white font-semibold'
                  : 'text-slate-600 hover:text-rose-700'
              }`}
            >
              Cận tồn ({criticalCount})
            </button>
            <button
              onClick={() => setFilterLevel('WARNING')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                filterLevel === 'WARNING'
                  ? 'bg-amber-600 text-white font-semibold'
                  : 'text-slate-600 hover:text-amber-800'
              }`}
            >
              Điểm ROP ({warningCount})
            </button>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100/70 text-slate-600 font-bold text-xs uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Sản Phẩm / Mã SKU</th>
                <th className="py-3 px-4">Tồn Khả Dụng</th>
                <th className="py-3 px-4">Mức An Toàn (Min)</th>
                <th className="py-3 px-4">Điểm Đặt Hàng (ROP)</th>
                <th className="py-3 px-4">Gợi Ý Nhập Thêm</th>
                <th className="py-3 px-4">Mức Độ Rủi Ro</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-sans">
              {filteredAlerts.map((item) => {
                const isCritical =
                  item.alertLevel === 'CRITICAL' || item.alertLevel === 'OUT_OF_STOCK';
                const ratioPct = Math.min(
                  100,
                  Math.round((item.currentAvailable / (item.safetyStock || 1)) * 100)
                );

                return (
                  <tr key={item.productId} className="hover:bg-slate-50/70 transition-colors">
                    {/* Sản phẩm */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">
                        {item.productName}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 font-mono">
                        <span className="font-semibold text-slate-600">{item.sku}</span>
                        <span>•</span>
                        <span>Barcode: {item.barcode}</span>
                      </div>
                    </td>

                    {/* Tồn khả dụng */}
                    <td className="py-3.5 px-4 font-mono text-xs">
                      <div className="flex items-baseline gap-1.5">
                        <span
                          className={`text-sm font-extrabold ${
                            isCritical ? 'text-rose-600' : 'text-amber-700'
                          }`}
                        >
                          {item.currentAvailable}
                        </span>
                        <span className="text-slate-500 font-sans">{item.unit}</span>
                      </div>
                      {/* Mini Bar */}
                      <div className="w-24 bg-slate-200 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isCritical ? 'bg-rose-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.max(8, ratioPct)}%` }}
                        ></div>
                      </div>
                    </td>

                    {/* Định mức an toàn */}
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-700">
                      <span className="font-semibold">{item.safetyStock}</span> {item.unit}
                    </td>

                    {/* Điểm ROP */}
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-700">
                      <span className="font-semibold">{item.reorderPoint}</span> {item.unit}
                    </td>

                    {/* Gợi ý nhập */}
                    <td className="py-3.5 px-4 font-mono text-xs">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        +{item.suggestedReorderQty} {item.unit}
                      </span>
                    </td>

                    {/* Mức độ rủi ro */}
                    <td className="py-3.5 px-4">
                      {isCritical ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
                          <span>Cận Tồn Nguy Hiểm</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Chạm Điểm ROP</span>
                        </span>
                      )}
                    </td>

                    {/* Thao tác */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          onCreatePo
                            ? onCreatePo(item)
                            : (window.location.href = '/inbound')
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-indigo-600 active:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                        title="Tạo đơn mua hàng nhập kho PO để bù tồn"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Tạo Đơn PO</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
