import React from 'react';
import { Shield, User, Smartphone, ArrowRight } from 'lucide-react';
import { DemoAccount } from '../types';

interface DemoAccountCardsProps {
  onSelectDemo: (account: DemoAccount) => void;
  isLoading?: boolean;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: 'ROLE_ADMIN',
    roleTitle: 'Quản Trị Viên',
    badge: 'ADMIN',
    color: 'bg-slate-800/60 hover:bg-slate-800 text-slate-200 border-slate-700 hover:border-indigo-500/60',
    username: 'admin',
    fullName: 'Nguyễn Quản Trị',
    targetRoute: '/',
    deviceType: 'Desktop / Trung Tâm Điều Hành',
    description: 'Toàn quyền cấu hình: Quản lý người dùng, phân quyền RBAC, sơ đồ kho Digital Twin',
  },
  {
    role: 'ROLE_WAREHOUSE_MANAGER',
    roleTitle: 'Trưởng Kho',
    badge: 'MANAGER',
    color: 'bg-slate-800/60 hover:bg-slate-800 text-slate-200 border-slate-700 hover:border-indigo-500/60',
    username: 'manager01',
    fullName: 'Trần Trưởng Kho',
    targetRoute: '/',
    deviceType: 'Desktop / Quản Lý Nghiệp Vụ',
    description: 'Điều phối xuất nhập PO/SO, phân bổ lô FEFO, kiểm soát cân đối tồn kho & sổ cái',
  },
  {
    role: 'ROLE_OPERATOR',
    roleTitle: 'Thủ Kho Hiện Trường',
    badge: 'OPERATOR',
    color: 'bg-slate-800/60 hover:bg-slate-800 text-slate-200 border-slate-700 hover:border-emerald-500/60',
    username: 'operator01',
    fullName: 'Lê Thủ Kho',
    targetRoute: '/operator',
    deviceType: 'Thiết Bị Cầm Tay / Mobile PDA',
    description: 'Cổng quét mã: Quét nhận hàng Staging, cất kệ Put-away, bốc hàng FEFO & chuyển ô',
  },
];

export const DemoAccountCards: React.FC<DemoAccountCardsProps> = ({ onSelectDemo, isLoading }) => {
  return (
    <div className="space-y-2.5 pt-3 border-t border-slate-800">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-300">
          Chọn nhanh tài khoản phân quyền (RBAC)
        </span>
        <span className="text-[11px] font-mono text-slate-400">
          Mật khẩu chung: <code className="text-indigo-300 font-bold">123456</code>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {DEMO_ACCOUNTS.map((acc) => {
          const Icon = acc.role === 'ROLE_ADMIN' ? Shield : acc.role === 'ROLE_OPERATOR' ? Smartphone : User;

          return (
            <button
              key={acc.role}
              type="button"
              disabled={isLoading}
              onClick={() => onSelectDemo(acc)}
              className={`p-3 rounded-xl border text-left transition-all group relative cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${acc.color}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="font-bold text-xs text-white">{acc.roleTitle}</span>
                </div>
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-750">
                  {acc.badge}
                </span>
              </div>

              <div className="font-mono text-xs text-indigo-300 font-medium">
                @{acc.username}
              </div>

              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                {acc.description}
              </p>

              <div className="mt-2 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400">
                <span className="truncate max-w-[120px]">{acc.deviceType}</span>
                <span className="flex items-center gap-0.5 text-indigo-400 font-medium group-hover:translate-x-0.5 transition-transform flex-shrink-0">
                  <span>Chọn</span>
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
