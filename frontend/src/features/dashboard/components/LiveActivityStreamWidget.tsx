import React, { useState } from 'react';
import {
  Activity,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  AlertTriangle,
  Smartphone,
  ShieldCheck,
  Clock,
  Filter,
} from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'INBOUND' | 'OUTBOUND' | 'TRANSFER' | 'ALERT' | 'PDA';
  title: string;
  description: string;
  sku: string;
  binLocation: string;
  timestamp: string;
  actor: string;
}

const mockActivities: ActivityItem[] = [
  {
    id: 'ACT-01',
    type: 'OUTBOUND',
    title: 'Xuất kho đơn #OUT-2026-089',
    description: 'Đã hoàn tất bốc dỡ 25 kiện Samsung Galaxy S24 Ultra',
    sku: 'SKU-SAMS-S24',
    binLocation: 'ZA-A01-R01',
    timestamp: '2 phút trước',
    actor: 'Nguyễn Văn A (PDA #01)',
  },
  {
    id: 'ACT-02',
    type: 'INBOUND',
    title: 'Tiếp nhận hàng nhập #IN-2026-042',
    description: 'Smart Put-away gợi ý ô kệ thành công 60 thùng OMO Matic',
    sku: 'SKU-OMO-MATIC',
    binLocation: 'ZA-A01-R02',
    timestamp: '5 phút trước',
    actor: 'Trần Văn B (Xe nâng #02)',
  },
  {
    id: 'ACT-03',
    type: 'ALERT',
    title: 'Cảnh báo hạn dùng FEFO',
    description: 'Lô BATCH-MILK-26A còn 25 ngày sử dụng, tự động ưu tiên xuất',
    sku: 'SKU-MILK-100',
    binLocation: 'ZB-B01-R01',
    timestamp: '14 phút trước',
    actor: 'Hệ thống FEFO Engine',
  },
  {
    id: 'ACT-04',
    type: 'PDA',
    title: 'Quét mã vạch Pick-pack',
    description: 'Thủ kho xác nhận vị trí lấy hàng đơn #OUT-2026-088',
    sku: 'SKU-OMO-MATIC',
    binLocation: 'ZA-A02-R01',
    timestamp: '22 phút trước',
    actor: 'Lê Thị C (PDA #04)',
  },
  {
    id: 'ACT-05',
    type: 'TRANSFER',
    title: 'Điều chuyển ô kệ nội bộ',
    description: 'Di dời 15 kiện hàng để giải phóng mặt bằng lối đi A02',
    sku: 'SKU-OMO-MATIC',
    binLocation: 'A02-R01 → B02-R01',
    timestamp: '35 phút trước',
    actor: 'Đặng Văn D (Thủ kho)',
  },
  {
    id: 'ACT-06',
    type: 'OUTBOUND',
    title: 'Xuất hàng xe tải đối tác Express',
    description: 'Bàn giao 100 kiện Sữa Vinamilk 100% cho đối tác vận chuyển',
    sku: 'SKU-MILK-100',
    binLocation: 'Cổng Outbound 02',
    timestamp: '48 phút trước',
    actor: 'Tài xế giao nhận',
  },
];

export const LiveActivityStreamWidget: React.FC = () => {
  const [filter, setFilter] = useState<'ALL' | 'INBOUND' | 'OUTBOUND' | 'ALERT'>('ALL');

  const filtered = mockActivities.filter((item) => {
    if (filter === 'ALL') return true;
    if (filter === 'ALERT') return item.type === 'ALERT';
    return item.type === filter;
  });

  const getTypeBadge = (type: ActivityItem['type']) => {
    switch (type) {
      case 'INBOUND':
        return (
          <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 shrink-0">
            <ArrowDownLeft className="w-4 h-4" />
          </span>
        );
      case 'OUTBOUND':
        return (
          <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 shrink-0">
            <ArrowUpRight className="w-4 h-4" />
          </span>
        );
      case 'ALERT':
        return (
          <span className="p-1.5 rounded-lg bg-rose-50 text-rose-600 shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </span>
        );
      case 'PDA':
        return (
          <span className="p-1.5 rounded-lg bg-cyan-50 text-cyan-700 shrink-0">
            <Smartphone className="w-4 h-4" />
          </span>
        );
      default:
        return (
          <span className="p-1.5 rounded-lg bg-purple-50 text-purple-700 shrink-0">
            <RefreshCw className="w-4 h-4" />
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex flex-col justify-between space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <Activity className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
              Biến Động Kho Vận Thời Gian Thực
            </h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-600"></span>
              </span>
              TRỰC TIẾP
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Dòng sự kiện xuất nhập hàng và thao tác thủ kho được ghi vết liên tục
          </p>
        </div>

        {/* Filter pills */}
        <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-xs font-bold">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
              filter === 'ALL' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setFilter('INBOUND')}
            className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
              filter === 'INBOUND' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Nhập
          </button>
          <button
            onClick={() => setFilter('OUTBOUND')}
            className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
              filter === 'OUTBOUND' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Xuất
          </button>
          <button
            onClick={() => setFilter('ALERT')}
            className={`px-2 py-1 rounded-md transition-all cursor-pointer ${
              filter === 'ALERT' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Cảnh báo
          </button>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-2.5 max-h-[310px] overflow-y-auto pr-1">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 transition-all flex items-start justify-between gap-3 text-xs"
          >
            <div className="flex items-start gap-3 min-w-0">
              {getTypeBadge(item.type)}
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-slate-800 truncate">{item.title}</span>
                  <span className="font-mono text-[11px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                    {item.binLocation}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed truncate">{item.description}</p>
                <p className="text-[10px] text-slate-400 font-medium">Bởi: {item.actor}</p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                {item.timestamp}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
