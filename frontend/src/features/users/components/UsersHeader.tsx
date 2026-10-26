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
  const managerCount = users.filter((u) => u.role === 'ROLE_MANAGER' || u.role === 'ROLE_WAREHOUSE_MANAGER').length;
  const operatorCount = users.filter((u) => u.role === 'ROLE_OPERATOR').length;
  const lockedCount = users.filter((u) => u.status === 'LOCKED').length;

  return (
    <div className="space-y-4">
      {/* Top Banner Row */}
      <div className="group relative bg-white rounded-2xl p-5 md:p-6 border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500" />
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-indigo-600/20 ring-4 ring-indigo-50 flex-shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                Quản Lý Tài Khoản & Phân Quyền
              </h1>
              <span className="text-[11px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200 font-bold uppercase">
                RBAC SECURITY
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
              Phân quyền truy cập theo vai trò (RBAC) • Bảo mật tài khoản kho • Theo dõi phiên đăng nhập
            </p>
          </div>
        </div>

        {/* Tab switchers & Create user button */}
        <div className="flex items-center gap-3 self-stretch md:self-auto justify-between md:justify-end flex-wrap">
          <div className="flex items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200/80 gap-1">
            <button
              onClick={() => setActiveTab('ACCOUNTS')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'ACCOUNTS'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 border border-transparent'
              }`}
            >
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Tài Khoản ({users.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('RBAC_MATRIX')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'RBAC_MATRIX'
                  ? 'bg-white text-indigo-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 border border-transparent'
              }`}
            >
              <KeyRound className="w-4 h-4 text-indigo-600" />
              <span>Ma Trận Quyền Hạn (12 Màn Hình)</span>
            </button>
          </div>

          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/20 transition-all flex-shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Tài Khoản</span>
          </button>
        </div>
      </div>

      {/* 4 Security KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Users */}
        <div className="group relative bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-md transition-all overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-400 to-slate-600 opacity-80" />
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Tổng Tài Khoản</span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono mt-1.5">{users.length}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 group-hover:scale-105 transition-transform">
              <Users className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 font-medium">Toàn bộ nhân sự hệ thống</div>
        </div>

        {/* Admins & Managers */}
        <div className="group relative bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-md transition-all overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-600 opacity-90" />
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-purple-700 uppercase tracking-wider block">Admin & Quản Lý Kho</span>
              <div className="text-2xl sm:text-3xl font-black text-purple-900 font-mono mt-1.5">
                {adminCount + managerCount}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 group-hover:scale-105 transition-transform">
              <Shield className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-2 text-[11px] text-purple-700 font-bold">
            {adminCount} Quản Trị • {managerCount} Trưởng Kho
          </div>
        </div>

        {/* Operators */}
        <div className="group relative bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-md transition-all overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-90" />
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block">Thủ Kho Hiện Trường</span>
              <div className="text-2xl sm:text-3xl font-black text-blue-900 font-mono mt-1.5">{operatorCount}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 group-hover:scale-105 transition-transform">
              <Smartphone className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-2 text-[11px] text-blue-700 font-bold">
            Trực tiếp quét mã Barcode / PDA
          </div>
        </div>

        {/* Locked / Security status */}
        <div className="group relative bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-md transition-all overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-rose-600 opacity-90" />
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-rose-700 uppercase tracking-wider block">Tài Khoản Đang Khóa</span>
              <div className="text-2xl sm:text-3xl font-black text-rose-700 font-mono mt-1.5">{lockedCount}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 group-hover:scale-105 transition-transform">
              <Lock className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-2 text-[11px] text-rose-700 font-bold">
            {lockedCount > 0 ? `${lockedCount} tài khoản bị vô hiệu hóa` : 'Không có tài khoản bị khóa'}
          </div>
        </div>
      </div>
    </div>
  );
};
