import React from 'react';
import { Shield, ShieldAlert, UserCheck, Users, Plus, KeyRound, Lock, Smartphone } from 'lucide-react';
import { UserAccount } from '../types';

interface UsersHeaderProps {
  activeTab: 'ACCOUNTS' | 'RBAC_MATRIX';
  setActiveTab: (tab: 'ACCOUNTS' | 'RBAC_MATRIX') => void;
  users: UserAccount[];
  onOpenCreateModal: () => void;
}

export const UsersHeader: React.FC<UsersHeaderProps> = ({
  activeTab,
  setActiveTab,
  users,
  onOpenCreateModal,
}) => {
  const adminCount = users.filter((u) => u.role === 'ROLE_ADMIN').length;
  const managerCount = users.filter((u) => u.role === 'ROLE_MANAGER').length;
  const operatorCount = users.filter((u) => u.role === 'ROLE_OPERATOR').length;
  const lockedCount = users.filter((u) => u.status === 'LOCKED').length;

  return (
    <div className="space-y-4">
      {/* Top Banner Row */}
      <div className="bg-[#0b101d]/90 backdrop-blur-xl rounded-2xl p-4 md:p-5 border border-slate-800/80 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-purple-600/30 flex-shrink-0 ring-1 ring-white/20">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base md:text-lg font-extrabold text-white tracking-tight">
                Quản Lý Tài Khoản & Phân Quyền (RBAC)
              </h1>
              <span className="text-[10px] font-mono bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30 font-bold">
                ADMIN ONLY
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Role-Based Access Control 3 cấp: Quản trị viên (Admin) • Quản lý kho (Manager) • Thủ kho PDA (Operator)
            </p>
          </div>
        </div>

        {/* Tab switchers & Create user button */}
        <div className="flex items-center gap-3 self-stretch md:self-auto justify-between md:justify-end">
          <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('ACCOUNTS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'ACCOUNTS'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Tài Khoản ({users.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('RBAC_MATRIX')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'RBAC_MATRIX'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Ma Trận Quyền Hạn (12 Màn Hình)</span>
            </button>
          </div>

          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-900/30 transition-all active:scale-95 flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Tài Khoản</span>
          </button>
        </div>
      </div>

      {/* 4 Security KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Users */}
        <div className="bg-[#0d1322]/80 rounded-xl p-3.5 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase">Tổng Tài Khoản</div>
            <div className="text-lg font-extrabold text-white font-mono mt-0.5">{users.length} Người Dùng</div>
          </div>
          <div className="p-2 rounded-lg bg-slate-800 text-slate-300">
            <Users className="w-4 h-4" />
          </div>
        </div>

        {/* Admins & Managers */}
        <div className="bg-[#0d1322]/80 rounded-xl p-3.5 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono text-purple-400 uppercase">Admin & Quản Lý Kho</div>
            <div className="text-lg font-extrabold text-purple-300 font-mono mt-0.5">
              {adminCount} Admin • {managerCount} Mgr
            </div>
          </div>
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Shield className="w-4 h-4" />
          </div>
        </div>

        {/* Operators */}
        <div className="bg-[#0d1322]/80 rounded-xl p-3.5 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono text-cyan-400 uppercase">Thủ Kho Hiện Trường (PDA)</div>
            <div className="text-lg font-extrabold text-cyan-300 font-mono mt-0.5">{operatorCount} Nhân Viên</div>
          </div>
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Smartphone className="w-4 h-4" />
          </div>
        </div>

        {/* Locked / Security status */}
        <div className="bg-[#0d1322]/80 rounded-xl p-3.5 border border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono text-rose-400 uppercase">Tài Khoản Đang Khóa</div>
            <div className="text-lg font-extrabold text-rose-300 font-mono mt-0.5">{lockedCount} Tài Khoản</div>
          </div>
          <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Lock className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};
