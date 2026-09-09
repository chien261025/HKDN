import React from 'react';
import { Package, AlertTriangle, Layers, Clock, TrendingUp, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const stats = [
    { title: 'Tổng Mã SKU', value: '1,248', change: '+12% tháng này', icon: Package, color: 'bg-blue-500' },
    { title: 'Tỷ Lệ Lấp Đầy Kho', value: '78.5%', change: 'Khu A: 85%, Khu B: 62%', icon: Layers, color: 'bg-indigo-500' },
    { title: 'Lô Cận Date (<30 ngày)', value: '4 lô', change: 'Cần thanh lý gấp', icon: Clock, color: 'bg-rose-500' },
    { title: 'Đơn Chờ Nhặt Hàng', value: '18 đơn', change: '5 đơn ưu tiên cao', icon: AlertTriangle, color: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex justify-between items-center bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl text-white shadow-xl">
        <div>
          <h1 className="text-2xl font-bold">Tổng Quan Vận Hành Smart WMS</h1>
          <p className="text-slate-300 text-sm mt-1">Hệ thống đang kiểm soát thời gian thực 6 phân khu lưu trữ và 1,248 mã hàng</p>
        </div>
        <Link
          to="/smartquery"
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 rounded-xl text-sm font-semibold transition-all shadow-md shadow-indigo-900/50"
        >
          <span>Hỏi Trợ lý AI</span>
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
              <div className={`p-3 rounded-xl text-white ${s.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-slate-500">{s.title}</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-1">{s.value}</h3>
                <p className="text-xs text-slate-400 mt-1">{s.change}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2 Cột: Tỷ lệ lấp đầy Kho & Cảnh báo Cận Date */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Widget 1: Tỷ lệ lấp đầy kệ theo Zone */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            Tỷ Lệ Lấp Đầy Các Phân Khu (Warehouse Occupancy)
          </h3>
          <div className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span>Khu A: Hàng Khô & Điện tử (Zone A)</span>
                <span className="text-indigo-600 font-bold">85% (170/200 ô)</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span>Khu B: Hàng Mát & Sữa (Zone B)</span>
                <span className="text-emerald-600 font-bold">62% (62/100 ô)</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '62%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span>Khu C: Hóa Mỹ Phẩm (Zone C)</span>
                <span className="text-amber-500 font-bold">45% (45/100 ô)</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Widget 2: Cảnh báo Lô cận Date (FEFO Alert) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-rose-500" />
              Lô Hàng Cận Hạn Sử Dụng (FEFO Priority)
            </h3>
            <span className="text-xs bg-rose-50 text-rose-600 font-semibold px-2.5 py-1 rounded-full border border-rose-100">
              Ưu tiên xuất
            </span>
          </div>

          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between p-3 bg-rose-50/60 rounded-xl border border-rose-100">
              <div>
                <p className="text-xs font-bold text-slate-800">Sữa tươi tiệt trùng Vinamilk 100% 1L</p>
                <p className="text-xs text-slate-500">Lô: BATCH-MILK-26A • Vị trí: ZA-A01-R01-S01-B05</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-rose-600">Còn 16 ngày (2026-09-25)</span>
                <p className="text-xs text-slate-600">Tồn: 80 hộp</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-amber-50/60 rounded-xl border border-amber-100">
              <div>
                <p className="text-xs font-bold text-slate-800">Nước giặt OMO Matic Cửa Trên 3.6kg</p>
                <p className="text-xs text-slate-500">Lô: BATCH-OMO-01 • Vị trí: ZA-A01-R02-S01-B03</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-amber-600">Còn 28 ngày (2026-10-07)</span>
                <p className="text-xs text-slate-600">Tồn: 60 túi</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
