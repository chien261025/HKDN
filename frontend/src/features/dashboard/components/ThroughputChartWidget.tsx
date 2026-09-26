import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ArrowUpRight, ArrowDownLeft, Calendar, Zap } from 'lucide-react';

interface DataPoint {
  time: string;
  inbound: number;
  outbound: number;
}

const hourlyData: DataPoint[] = [
  { time: '06:00', inbound: 45, outbound: 28 },
  { time: '08:00', inbound: 120, outbound: 85 },
  { time: '10:00', inbound: 185, outbound: 210 },
  { time: '12:00', inbound: 95, outbound: 160 },
  { time: '14:00', inbound: 245, outbound: 330 },
  { time: '16:00', inbound: 195, outbound: 295 },
  { time: '18:00', inbound: 110, outbound: 220 },
  { time: '20:00', inbound: 65, outbound: 145 },
  { time: '22:00', inbound: 30, outbound: 68 },
];

const weeklyData: DataPoint[] = [
  { time: 'T2', inbound: 650, outbound: 920 },
  { time: 'T3', inbound: 820, outbound: 1150 },
  { time: 'T4', inbound: 740, outbound: 1080 },
  { time: 'T5', inbound: 910, outbound: 1320 },
  { time: 'T6', inbound: 1100, outbound: 1580 },
  { time: 'T7', inbound: 850, outbound: 1240 },
  { time: 'CN', inbound: 420, outbound: 680 },
];

export const ThroughputChartWidget: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'TODAY' | 'WEEK'>('TODAY');
  const activeData = timeRange === 'TODAY' ? hourlyData : weeklyData;

  const totalInbound = activeData.reduce((acc, curr) => acc + curr.inbound, 0);
  const totalOutbound = activeData.reduce((acc, curr) => acc + curr.outbound, 0);

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
              <Zap className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
              Lưu Lượng Xuất - Nhập Kho Theo Thời Gian
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Sản lượng hàng hóa luân chuyển thực tế qua các cổng tiếp nhận và xuất hàng
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {/* Legend */}
          <div className="flex items-center gap-3 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs"></span>
              <span className="text-slate-600">Nhập kho (Inbound)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shadow-xs"></span>
              <span className="text-slate-600">Xuất kho (Outbound)</span>
            </div>
          </div>

          {/* Toggle pills */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-xs font-bold">
            <button
              onClick={() => setTimeRange('TODAY')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                timeRange === 'TODAY' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Hôm nay (24h)
            </button>
            <button
              onClick={() => setTimeRange('WEEK')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                timeRange === 'WEEK' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              7 ngày qua
            </button>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 w-full pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={activeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorOutbound" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorInbound" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="time"
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#64748b', fontSize: 11 }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-slate-900/95 backdrop-blur-sm text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-700">
                      <p className="font-bold text-slate-300 border-b border-slate-700 pb-1 flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-indigo-400" /> Khung giờ: {label}
                      </p>
                      <div className="flex items-center justify-between gap-4 text-emerald-400">
                        <span>Nhập kho (Inbound):</span>
                        <span className="font-mono font-bold">{payload[1]?.value} kiện</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-indigo-300">
                        <span>Xuất kho (Outbound):</span>
                        <span className="font-mono font-bold">{payload[0]?.value} kiện</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="outbound"
              stroke="#6366f1"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorOutbound)"
            />
            <Area
              type="monotone"
              dataKey="inbound"
              stroke="#10b981"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorInbound)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Footer Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 mt-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
            <ArrowDownLeft className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400">Tổng sản lượng nhập</p>
            <p className="font-extrabold text-slate-800 font-mono text-sm">{totalInbound.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">kiện</span></p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400">Tổng sản lượng xuất</p>
            <p className="font-extrabold text-slate-800 font-mono text-sm">{totalOutbound.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">kiện</span></p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
            <Zap className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400">Khung giờ cao điểm</p>
            <p className="font-extrabold text-slate-800 text-sm">14:00 - 16:00</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
            <Calendar className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400">Tốc độ xuất trung bình</p>
            <p className="font-extrabold text-slate-800 font-mono text-sm">9.4 <span className="text-[10px] font-normal text-slate-500">kiện/phút</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};
