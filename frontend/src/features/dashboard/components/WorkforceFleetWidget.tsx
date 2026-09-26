import React, { useState } from 'react';
import {
  Users,
  Smartphone,
  Zap,
  BatteryCharging,
  Wifi,
  WifiOff,
  CheckCircle2,
  TrendingUp,
  MapPin,
  Clock,
} from 'lucide-react';

interface DeviceItem {
  id: string;
  code: string;
  assignee: string;
  zone: string;
  battery: number;
  status: 'ONLINE' | 'CHARGING' | 'OFFLINE';
  picksCompleted: number;
}

const pdaFleet: DeviceItem[] = [
  { id: '1', code: 'PDA-01', assignee: 'Nguyễn Văn A', zone: 'Zone A', battery: 92, status: 'ONLINE', picksCompleted: 64 },
  { id: '2', code: 'PDA-02', assignee: 'Trần Văn B', zone: 'Zone A', battery: 85, status: 'ONLINE', picksCompleted: 58 },
  { id: '3', code: 'PDA-03', assignee: 'Lê Thị C', zone: 'Zone B', battery: 78, status: 'ONLINE', picksCompleted: 51 },
  { id: '4', code: 'PDA-04', assignee: 'Phạm Văn D', zone: 'Zone C', battery: 64, status: 'ONLINE', picksCompleted: 44 },
  { id: '5', code: 'PDA-05', assignee: 'Trạm Sạc Dock 01', zone: 'Khu Sạc', battery: 100, status: 'CHARGING', picksCompleted: 0 },
  { id: '6', code: 'PDA-06', assignee: 'Dự Phòng Sàn', zone: 'Khu Sạc', battery: 18, status: 'OFFLINE', picksCompleted: 12 },
];

export const WorkforceFleetWidget: React.FC = () => {
  const [selectedZone, setSelectedZone] = useState<string>('ALL');

  const filteredFleet = pdaFleet.filter((d) => {
    if (selectedZone === 'ALL') return true;
    return d.zone === selectedZone;
  });

  const onlineCount = pdaFleet.filter((d) => d.status === 'ONLINE').length;
  const chargingCount = pdaFleet.filter((d) => d.status === 'CHARGING').length;
  const offlineCount = pdaFleet.filter((d) => d.status === 'OFFLINE').length;

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-50 text-cyan-700">
              <Users className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
              Nhân Lực & Thiết Bị Sàn Kho (PDA Fleet)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi năng suất lấy hàng và kết nối của máy quét mã vạch
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
            14 NHÂN SỰ
          </span>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 font-mono">
            {onlineCount} PDA ONLINE
          </span>
        </div>
      </div>

      {/* Top Velocity Metrics Strip */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-[11px]">
            <span>Tốc độ lấy hàng trung bình</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-extrabold text-slate-900 font-mono">86.4</span>
            <span className="text-[11px] text-slate-500 font-medium">picks/giờ/người</span>
          </div>
          <p className="text-[10px] text-emerald-700 font-semibold">+8.5% so với ca trước</p>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-[11px]">
            <span>Tình trạng máy quét</span>
            <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <div className="flex items-center gap-3 pt-1 text-[11px] font-bold">
            <span className="flex items-center gap-1 text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {onlineCount} Online
            </span>
            <span className="flex items-center gap-1 text-blue-700">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              {chargingCount} Sạc
            </span>
            <span className="flex items-center gap-1 text-amber-700">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              {offlineCount} Chờ
            </span>
          </div>
          <p className="text-[10px] text-slate-500 font-medium">Pin trung bình fleet: 82%</p>
        </div>
      </div>

      {/* PDA List with Scanner Telemetry */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-600 px-1">
          <span>Danh sách thiết bị quét & Thủ kho trực ca</span>
          <span className="text-[11px] text-slate-400 font-normal">Tự động đồng bộ</span>
        </div>

        <div className="space-y-2 max-h-[195px] overflow-y-auto pr-1 text-xs">
          {filteredFleet.map((pda) => (
            <div
              key={pda.id}
              className="p-2.5 rounded-xl border border-slate-100 bg-white hover:border-slate-200 transition-all flex items-center justify-between gap-3 shadow-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`p-1.5 rounded-lg shrink-0 ${
                    pda.status === 'ONLINE'
                      ? 'bg-emerald-50 text-emerald-700'
                      : pda.status === 'CHARGING'
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-800 text-[11px]">{pda.code}</span>
                    <span className="text-slate-600 font-medium truncate">{pda.assignee}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                    <span className="flex items-center gap-0.5">
                      <MapPin className="w-2.5 h-2.5" />
                      {pda.zone}
                    </span>
                    <span>•</span>
                    <span className="font-mono">{pda.picksCompleted} lượt pick</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  <span className="font-mono font-bold text-slate-800 text-[11px]">{pda.battery}%</span>
                  <p className="text-[9px] text-slate-400 uppercase">{pda.status}</p>
                </div>
                {pda.status === 'ONLINE' && <Wifi className="w-3.5 h-3.5 text-emerald-600" />}
                {pda.status === 'CHARGING' && <BatteryCharging className="w-3.5 h-3.5 text-blue-600" />}
                {pda.status === 'OFFLINE' && <WifiOff className="w-3.5 h-3.5 text-amber-500" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
