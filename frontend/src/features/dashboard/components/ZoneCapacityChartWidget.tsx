import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Layers, Warehouse, AlertCircle, CheckCircle2 } from 'lucide-react';

interface ZoneData {
  code: string;
  name: string;
  occupied: number;
  total: number;
  weightTons: number;
  color: string;
}

const zoneList: ZoneData[] = [
  { code: 'ZONE A', name: 'Hàng Tiêu Dùng Nhanh', occupied: 140, total: 160, weightTons: 14.5, color: '#6366f1' },
  { code: 'ZONE B', name: 'Hóa Mỹ Phẩm & Nước Giặt', occupied: 90, total: 120, weightTons: 9.2, color: '#3b82f6' },
  { code: 'ZONE C', name: 'Hàng Điện Tử / Giá Trị Cao', occupied: 52, total: 80, weightTons: 4.1, color: '#10b981' },
  { code: 'ZONE D', name: 'Kho Mát & Hàng Nhiệt Độ', occupied: 32, total: 40, weightTons: 3.0, color: '#f59e0b' },
];

const pieData = [
  { name: 'Đang chứa hàng', value: 314, color: '#6366f1' },
  { name: 'Đang giữ cho đơn xuất', value: 24, color: '#f59e0b' },
  { name: 'Ô kệ còn trống', value: 62, color: '#cbd5e1' },
];

export const ZoneCapacityChartWidget: React.FC = () => {
  const totalBins = 400;
  const occupiedBins = 314;
  const overallPercent = ((occupiedBins / totalBins) * 100).toFixed(1);

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
              <Layers className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
              Phân Bổ Sức Chứa Theo Phân Khu
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Tỷ lệ lấp đầy ô kệ và tải trọng lưu trữ tại 4 khu vực vận hành
          </p>
        </div>

        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
          <Warehouse className="w-3.5 h-3.5" />
          400 Ô KỆ
        </span>
      </div>

      {/* Main Grid: Left Donut + Right Zone List */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center pt-2">
        {/* Left Donut */}
        <div className="md:col-span-5 flex flex-col items-center justify-center relative">
          <div className="w-40 h-40 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0];
                      return (
                        <div className="bg-slate-900/95 text-white p-2.5 rounded-xl shadow-lg text-xs space-y-1 border border-slate-700">
                          <p className="font-bold text-slate-300">{data.name}</p>
                          <p className="font-mono text-indigo-400 font-bold">{data.value} ô kệ ({(((data.value as number) / totalBins) * 100).toFixed(1)}%)</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-slate-900 tracking-tight font-mono">{overallPercent}%</span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Tổng Tải</span>
            </div>
          </div>

          {/* Quick Legend under donut */}
          <div className="flex items-center gap-3 text-[11px] font-medium text-slate-600 mt-1 flex-wrap justify-center">
            {pieData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                <span>{item.name}: <b className="font-mono text-slate-800">{item.value}</b></span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Zone Progress List */}
        <div className="md:col-span-7 space-y-2.5">
          {zoneList.map((z) => {
            const pct = Math.round((z.occupied / z.total) * 100);
            return (
              <div key={z.code} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-800 text-[11px] px-1.5 py-0.5 rounded bg-white border border-slate-200">
                      {z.code}
                    </span>
                    <span className="font-semibold text-slate-700">{z.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-500">{z.weightTons} tấn</span>
                    <span className="font-mono font-bold text-slate-900">{pct}%</span>
                  </div>
                </div>

                <div className="w-full h-2 bg-slate-200/70 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: z.color,
                    }}
                  ></div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Sức chứa: {z.occupied} / {z.total} ô</span>
                  <span>{z.total - z.occupied} ô còn trống</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Info */}
      <div className="pt-3 border-t border-slate-100 mt-2 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Tất cả các khu vực hoạt động dưới ngưỡng an toàn tải trọng (Tối đa 25 tấn/dãy).
        </span>
        <span className="font-mono text-slate-600 text-[11px]">Cập nhật: Trực tiếp</span>
      </div>
    </div>
  );
};
