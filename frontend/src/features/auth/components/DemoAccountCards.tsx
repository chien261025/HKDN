import React from 'react';
import { Shield, User, Smartphone, ArrowRight, Sparkles } from 'lucide-react';
import { DemoAccount } from '../types';

interface DemoAccountCardsProps {
  onSelectDemo: (account: DemoAccount) => void;
  isLoading?: boolean;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: 'ROLE_ADMIN',
    roleTitle: 'Quản Trị Viên (Admin)',
    badge: 'TOÀN QUYỀN',
    color: 'from-purple-600/30 via-indigo-600/20 to-slate-900 border-purple-500/50 text-purple-300',
    username: 'admin',
    fullName: 'Nguyễn Quản Trị',
    targetRoute: '/',
    deviceType: 'Desktop PC / Command Center',
    description: 'Truy cập toàn quyền: Phân quyền RBAC, Sơ đồ kho, Báo cáo & Kiểm toán hệ thống',
  },
  {
    role: 'ROLE_WAREHOUSE_MANAGER',
    roleTitle: 'Trưởng Kho (Manager)',
    badge: 'ĐIỀU HÀNH KHO',
    color: 'from-blue-600/30 via-cyan-600/20 to-slate-900 border-blue-500/50 text-cyan-300',
    username: 'manager01',
    fullName: 'Trần Trưởng Kho',
    targetRoute: '/',
    deviceType: 'Desktop PC / Dashboard',
    description: 'Điều phối xuất nhập kho, Phân bổ lô FEFO, Cân đối tồn kho & Báo cáo ngầm RabbitMQ',
  },
  {
    role: 'ROLE_OPERATOR',
    roleTitle: 'Thủ Kho Hiện Trường (Operator)',
    badge: 'PDA MOBILE',
    color: 'from-cyan-600/30 via-emerald-600/20 to-slate-900 border-emerald-500/50 text-emerald-300',
    username: 'operator01',
    fullName: 'Lê Thủ Kho',
    targetRoute: '/operator',
    deviceType: 'Mobile PDA / Máy Quét Cầm Tay',
    description: 'Giao diện Mobile/PDA: Quét Barcode nhận hàng, Gợi ý cất hàng, Lộ trình nhặt FEFO',
  },
];

export const DemoAccountCards: React.FC<DemoAccountCardsProps> = ({ onSelectDemo, isLoading }) => {
  return (
    <div className="space-y-3 pt-3 border-t border-slate-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>Tài Khoản Demo Hội Đồng Phản Biện (1 Chạm Vào Ngay)</span>
        </div>
        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
          Pass: 123456
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {DEMO_ACCOUNTS.map((acc) => {
          const Icon = acc.role === 'ROLE_ADMIN' ? Shield : acc.role === 'ROLE_OPERATOR' ? Smartphone : User;

          return (
            <button
              key={acc.role}
              type="button"
              disabled={isLoading}
              onClick={() => onSelectDemo(acc)}
              className={`p-3.5 rounded-2xl bg-gradient-to-b ${acc.color} border text-left hover:scale-[1.02] active:scale-[0.98] transition-all group relative overflow-hidden shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-black/40 text-white">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-extrabold text-xs text-white">{acc.roleTitle.split(' ')[0]}</span>
                </div>
                <span className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded bg-black/60 border border-white/20 text-slate-200">
                  {acc.badge}
                </span>
              </div>

              <div className="font-mono text-xs text-white font-black flex items-center gap-1">
                <span>@{acc.username}</span>
                <span className="text-slate-400 font-normal">({acc.fullName})</span>
              </div>
              <div className="text-[11px] text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                {acc.description}
              </div>

              <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-300 font-mono">
                <span className="text-slate-400">{acc.deviceType}</span>
                <span className="flex items-center gap-1 font-bold text-cyan-300 group-hover:translate-x-1 transition-transform">
                  <span>Đăng Nhập</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
