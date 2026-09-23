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
      <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-sm flex-shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              Quản Lý Tài Khoản & Phân Quyền
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Quản lý danh sách nhân sự và phân quyền truy cập hệ thống kho
            </p>
          </div>
        </div>

        {/* Tab switchers & Create user button */}
        <div className="flex items-center gap-3 self-stretch md:self-auto justify-between md:justify-end">
          <div className="flex items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('ACCOUNTS')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'ACCOUNTS'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 font-semibold'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Tài Khoản ({users.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('RBAC_MATRIX')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'RBAC_MATRIX'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 font-semibold'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>Ma Trận Quyền Hạn (12 Màn Hình)</span>
            </button>
          </div>

          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-600/20 transition-all active:scale-95 flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Tài Khoản</span>
          </button>
        </div>
      </div>

      {/* 4 Security KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Users */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng Tài Khoản</div>
            <div className="text-2xl font-black text-slate-900 font-mono mt-1">{users.length} Người Dùng</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-100 text-slate-700">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Admins & Managers */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-purple-700 uppercase tracking-wider">Admin & Quản Lý Kho</div>
            <div className="text-2xl font-black text-purple-900 font-mono mt-1">
              {adminCount} Admin • {managerCount} Mgr
            </div>
          </div>
          <div className="p-3 rounded-xl bg-purple-50 text-purple-600 border border-purple-200">
            <Shield className="w-5 h-5" />
          </div>
        </div>

        {/* Operators */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-blue-700 uppercase tracking-wider">Thủ Kho Hiện Trường (PDA)</div>
            <div className="text-2xl font-black text-blue-900 font-mono mt-1">{operatorCount} Nhân Viên</div>
          </div>
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
            <Smartphone className="w-5 h-5" />
          </div>
        </div>

        {/* Locked / Security status */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-rose-700 uppercase tracking-wider">Tài Khoản Đang Khóa</div>
            <div className="text-2xl font-black text-rose-700 font-mono mt-1">{lockedCount} Tài Khoản</div>
          </div>
          <div className="p-3 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
            <Lock className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
};
