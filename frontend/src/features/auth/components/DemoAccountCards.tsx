import React from 'react';
import { Shield, User, Smartphone, ArrowRight, Sparkles } from 'lucide-react';
import { DemoAccount } from '../types';

interface DemoAccountCardsProps {
  onSelectDemo: (account: DemoAccount) => void;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: 'ROLE_ADMIN',
    roleTitle: 'Quản Trị Viên (Admin)',
    badge: 'TOÀN QUYỀN',
    color: 'from-purple-600/30 to-indigo-600/30 border-purple-500/40 text-purple-300',
    username: 'admin',
    fullName: 'Trần Trưởng Kho',
    targetRoute: '/',
    deviceType: 'Desktop PC / Laptop',
    description: 'Truy cập toàn bộ 11 màn hình văn phòng, phân quyền RBAC & audit',
  },
  {
    role: 'ROLE_MANAGER',
    roleTitle: 'Quản Lý Kho (Manager)',
    badge: 'ĐIỀU HÀNH',
    color: 'from-blue-600/30 to-cyan-600/30 border-blue-500/40 text-blue-300',
    username: 'manager_kien',
    fullName: 'Nguyễn Văn Kiên',
    targetRoute: '/',
    deviceType: 'Desktop PC / Laptop',
    description: 'Điều phối Inbound PO, Outbound SO, Cân đối tồn kho, Báo cáo SXSSF',
  },
  {
    role: 'ROLE_OPERATOR',
    roleTitle: 'Thủ Kho Hiện Trường (Operator)',
    badge: 'PDA MOBILE',
    color: 'from-cyan-600/30 to-emerald-600/30 border-cyan-500/40 text-cyan-300',
    username: 'operator_nam',
    fullName: 'Lê Hoàng Nam',
    targetRoute: '/operator',
    deviceType: 'Mobile PDA / Smartphone',
    description: 'Giao diện tối ưu Mobile PDA: Nhận hàng, Cất kho, Nhặt FEFO, Blind Count',
  },
];

export const DemoAccountCards: React.FC<DemoAccountCardsProps> = ({ onSelectDemo }) => {
  return (
    <div className="space-y-3 pt-3 border-t border-slate-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Tài Khoản Demo Hội Đồng Phản Biện (1 Chạm Vào Ngay)</span>
        </div>
        <span className="text-[10px] font-mono text-slate-500">Auto-Fill & Sign-In</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {DEMO_ACCOUNTS.map((acc) => {
          const Icon = acc.role === 'ROLE_ADMIN' ? Shield : acc.role === 'ROLE_MANAGER' ? User : Smartphone;

          return (
            <button
              key={acc.role}
              type="button"
              onClick={() => onSelectDemo(acc)}
              className={`p-3 rounded-xl bg-gradient-to-b ${acc.color} border text-left hover:scale-[1.02] active:scale-[0.98] transition-all group relative overflow-hidden`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Icon className="w-4 h-4" />
                  <span className="font-bold text-xs text-white">{acc.roleTitle.split(' ')[0]}</span>
                </div>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/40 border border-white/10">
                  {acc.badge}
                </span>
              </div>

              <div className="font-mono text-[11px] text-white font-bold truncate">
                @{acc.username}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-2 leading-tight">
                {acc.description}
              </div>

              <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-300 font-mono">
                <span>{acc.deviceType}</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
