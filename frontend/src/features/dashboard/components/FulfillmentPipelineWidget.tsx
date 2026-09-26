import React from 'react';
import {
  Truck,
  PackageCheck,
  Boxes,
  CheckCircle2,
  Clock,
  Send,
  Smartphone,
  ChevronRight,
} from 'lucide-react';

interface Stage {
  title: string;
  count: number;
  sub: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  badgeColor: string;
}

const stages: Stage[] = [
  {
    title: 'Tiếp Nhận Đơn',
    count: 32,
    sub: 'Chờ cấp phát lô',
    icon: <Clock className="w-4 h-4 text-blue-600" />,
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    badgeColor: 'bg-blue-100 text-blue-800',
  },
  {
    title: 'Đang Lấy Hàng (Pick)',
    count: 18,
    sub: '6 thủ kho PDA active',
    icon: <Smartphone className="w-4 h-4 text-indigo-600" />,
    color: 'text-indigo-700',
    bg: 'bg-indigo-50',
    badgeColor: 'bg-indigo-100 text-indigo-800',
  },
  {
    title: 'Đang Đóng Gói (Pack)',
    count: 14,
    sub: 'Tại bàn kiểm hàng',
    icon: <Boxes className="w-4 h-4 text-purple-600" />,
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    badgeColor: 'bg-purple-100 text-purple-800',
  },
  {
    title: 'Sẵn Sàng Xuất (Staged)',
    count: 25,
    sub: 'Tại cửa Dock 01 & 02',
    icon: <PackageCheck className="w-4 h-4 text-amber-600" />,
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    badgeColor: 'bg-amber-100 text-amber-800',
  },
  {
    title: 'Đã Bàn Giao Xe',
    count: 126,
    sub: 'Hoàn tất SLA 2h',
    icon: <Truck className="w-4 h-4 text-emerald-600" />,
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    badgeColor: 'bg-emerald-100 text-emerald-800',
  },
];

export const FulfillmentPipelineWidget: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-purple-50 text-purple-700">
              <Truck className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
              Quy Trình Hoàn Tất Đơn Hàng (Fulfillment Pipeline)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Tiến độ luân chuyển đơn hàng từ khi tạo phiếu đến khi bàn giao đối tác vận chuyển
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 font-mono">
            SLA: 98.2% KỊP HẠN
          </span>
        </div>
      </div>

      {/* 5-Step Pipeline Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {stages.map((st, idx) => (
          <div
            key={idx}
            className={`p-3.5 rounded-xl border border-slate-200/80 ${st.bg}/30 hover:border-slate-300 transition-all space-y-2 relative`}
          >
            <div className="flex items-center justify-between">
              <span className={`p-2 rounded-lg ${st.bg} shrink-0`}>{st.icon}</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold font-mono ${st.badgeColor}`}>
                {st.count} đơn
              </span>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-800 line-clamp-1">{st.title}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{st.sub}</p>
            </div>

            {/* Step progress line indicator */}
            <div className="w-full h-1.5 bg-slate-200/70 rounded-full overflow-hidden mt-1">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all"
                style={{ width: `${Math.min(100, Math.max(20, (st.count / 150) * 100))}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* Dock Status & Fleet Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
        {/* Inbound Docks */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs"></span>
            <div>
              <p className="font-bold text-slate-800">Cổng Tiếp Nhận (Inbound Dock 01)</p>
              <p className="text-[11px] text-slate-500">Xe container #51C-982.11 • Đang bốc dỡ 40 pallet sữa Vinamilk</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-semibold font-mono text-[10px]">
            ĐANG HOẠT ĐỘNG
          </span>
        </div>

        {/* Outbound Docks */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-xs"></span>
            <div>
              <p className="font-bold text-slate-800">Cổng Xuất Hàng (Outbound Dock 02)</p>
              <p className="text-[11px] text-slate-500">Xe đối tác vận tải Express • Đã bốc 65 kiện (80%)</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 font-semibold font-mono text-[10px]">
            ĐANG XẾP XE
          </span>
        </div>
      </div>
    </div>
  );
};
