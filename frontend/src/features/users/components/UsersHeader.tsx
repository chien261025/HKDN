import React from 'react';
import { Shield, Users, Plus, Lock, Smartphone, Check, Sparkles } from 'lucide-react';
import { UserAccount } from '../types';

export type UserKpiFilter = 'ALL' | 'MANAGEMENT' | 'OPERATOR' | 'LOCKED';

interface UsersHeaderProps {
  users: UserAccount[];
  onOpenCreateModal: () => void;
  selectedFilter?: UserKpiFilter;
  onSelectFilter?: (filter: UserKpiFilter) => void;
  isAdmin?: boolean;
}

export const UsersHeader: React.FC<UsersHeaderProps> = ({
  users,
  onOpenCreateModal,
  selectedFilter = 'ALL',
  onSelectFilter,
  isAdmin = true,
}) => {
  const adminCount = users.filter((u) => u.role === 'ROLE_ADMIN').length;
  const managerCount = users.filter((u) => u.role === 'ROLE_MANAGER' || u.role === 'ROLE_WAREHOUSE_MANAGER').length;
  const operatorCount = users.filter((u) => u.role === 'ROLE_OPERATOR').length;
  const lockedCount = users.filter((u) => u.status === 'LOCKED' || u.status === 'EXPIRED' || u.isExpired).length;

  const handleCardClick = (filter: UserKpiFilter) => {
    if (onSelectFilter) {
      onSelectFilter(filter);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner Row */}
      <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-200 ring-4 ring-blue-50 shrink-0">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
                {isAdmin ? 'Quản Lý Tài Khoản & Phân Quyền' : 'Đội Ngũ Nhân Sự Kho Vận'}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Sparkles className="w-3 h-3" />
                {isAdmin ? 'Chuẩn Doanh Nghiệp' : 'Quản Lý Kho Chi Nhánh'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
              {isAdmin
                ? 'Quản trị danh sách nhân sự toàn hệ thống, cấu hình vai trò phân quyền và kiểm soát thiết bị làm việc'
                : 'Theo dõi danh sách thủ kho, nhân viên nhặt hàng và phân công ca trực kho bãi'}
            </p>
          </div>
        </div>

        {/* Action Button / Role Status */}
        <div className="flex items-center gap-3 self-stretch md:self-auto justify-end">
          {isAdmin ? (
            <button
              onClick={onOpenCreateModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm shadow-blue-200 transition-all shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Tài Khoản Mới</span>
            </button>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-slate-100 border border-slate-200/90 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Chế độ Tra Cứu & Điều Phối</span>
              </div>
              <button
                type="button"
                onClick={onOpenCreateModal}
                className="flex items-center gap-2 px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm shadow-blue-200 transition-all shrink-0 cursor-pointer"
                title="Gửi phiếu đề xuất tiếp nhận nhân sự mới cho kho tới cấp quản trị duyệt"
              >
                <Plus className="w-4 h-4" />
                <span>Đề Xuất Nhân Sự Mới</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4 Interactive Personnel KPI Filter Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Users Filter */}
        <button
          type="button"
          onClick={() => handleCardClick('ALL')}
          className={`text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer relative overflow-hidden group active:scale-[0.99] ${
            selectedFilter === 'ALL'
              ? 'bg-blue-50/60 border-blue-600 ring-2 ring-blue-600/30 shadow-md'
              : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">Tổng Nhân Sự</span>
                {selectedFilter === 'ALL' && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white flex items-center gap-0.5">
                    <Check className="w-2.5 h-2.5" /> Đang lọc
                  </span>
                )}
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono mt-1.5 tabular-nums">
                {users.length}
              </div>
            </div>
            <div
              className={`p-2.5 rounded-xl border transition-colors ${
                selectedFilter === 'ALL'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-slate-100 text-slate-700 border-slate-200 group-hover:bg-blue-50 group-hover:text-blue-600'
              }`}
            >
              <Users className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Toàn bộ nhân sự kho vận</span>
            <span
              className={`text-[11px] font-semibold ${
                selectedFilter === 'ALL' ? 'text-blue-700' : 'text-slate-400 group-hover:text-blue-600'
              }`}
            >
              {selectedFilter === 'ALL' ? 'Xem tất cả' : 'Bấm để lọc'}
            </span>
          </div>
        </button>

        {/* Admins & Managers Filter */}
        <button
          type="button"
          onClick={() => handleCardClick('MANAGEMENT')}
          className={`text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer relative overflow-hidden group active:scale-[0.99] ${
            selectedFilter === 'MANAGEMENT'
              ? 'bg-purple-50/60 border-purple-600 ring-2 ring-purple-600/30 shadow-md'
              : 'bg-white border-slate-200 hover:border-purple-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-purple-700 uppercase tracking-wider block">
                  {isAdmin ? 'Quản Trị & Điều Hành' : 'Cán Bộ Quản Lý Kho'}
                </span>
                {selectedFilter === 'MANAGEMENT' && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-600 text-white flex items-center gap-0.5">
                    <Check className="w-2.5 h-2.5" /> Đang lọc
                  </span>
                )}
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-purple-900 font-mono mt-1.5 tabular-nums">
                {isAdmin ? adminCount + managerCount : managerCount}
              </div>
            </div>
            <div
              className={`p-2.5 rounded-xl border transition-colors ${
                selectedFilter === 'MANAGEMENT'
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-purple-50 text-purple-600 border-purple-200 group-hover:bg-purple-100'
              }`}
            >
              <Shield className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-xs">
            <span className="text-purple-700 font-medium">
              {isAdmin
                ? `${adminCount} Quản trị viên • ${managerCount} Trưởng kho`
                : `${managerCount} Trưởng kho điều hành chi nhánh`}
            </span>
            <span
              className={`text-[11px] font-semibold ${
                selectedFilter === 'MANAGEMENT' ? 'text-purple-700' : 'text-slate-400 group-hover:text-purple-600'
              }`}
            >
              {selectedFilter === 'MANAGEMENT' ? 'Đang chọn' : 'Bấm để lọc'}
            </span>
          </div>
        </button>

        {/* Operators Filter */}
        <button
          type="button"
          onClick={() => handleCardClick('OPERATOR')}
          className={`text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer relative overflow-hidden group active:scale-[0.99] ${
            selectedFilter === 'OPERATOR'
              ? 'bg-blue-50/60 border-blue-600 ring-2 ring-blue-600/30 shadow-md'
              : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider block">
                  Nhân Viên Vận Hành
                </span>
                {selectedFilter === 'OPERATOR' && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white flex items-center gap-0.5">
                    <Check className="w-2.5 h-2.5" /> Đang lọc
                  </span>
                )}
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-blue-900 font-mono mt-1.5 tabular-nums">
                {operatorCount}
              </div>
            </div>
            <div
              className={`p-2.5 rounded-xl border transition-colors ${
                selectedFilter === 'OPERATOR'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-blue-50 text-blue-600 border-blue-200 group-hover:bg-blue-100'
              }`}
            >
              <Smartphone className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-xs">
            <span className="text-blue-700 font-medium">Thủ kho thực địa tại lối đi</span>
            <span
              className={`text-[11px] font-semibold ${
                selectedFilter === 'OPERATOR' ? 'text-blue-700' : 'text-slate-400 group-hover:text-blue-600'
              }`}
            >
              {selectedFilter === 'OPERATOR' ? 'Đang chọn' : 'Bấm để lọc'}
            </span>
          </div>
        </button>

        {/* Locked Filter */}
        <button
          type="button"
          onClick={() => handleCardClick('LOCKED')}
          className={`text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer relative overflow-hidden group active:scale-[0.99] ${
            selectedFilter === 'LOCKED'
              ? 'bg-rose-50/60 border-rose-600 ring-2 ring-rose-600/30 shadow-md'
              : 'bg-white border-slate-200 hover:border-rose-300 hover:shadow-sm'
          }`}
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider block">
                  Tài Khoản Tạm Khóa
                </span>
                {selectedFilter === 'LOCKED' && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white flex items-center gap-0.5">
                    <Check className="w-2.5 h-2.5" /> Đang lọc
                  </span>
                )}
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-rose-700 font-mono mt-1.5 tabular-nums">
                {lockedCount}
              </div>
            </div>
            <div
              className={`p-2.5 rounded-xl border transition-colors ${
                selectedFilter === 'LOCKED'
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'bg-rose-50 text-rose-600 border-rose-200 group-hover:bg-rose-100'
              }`}
            >
              <Lock className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-2.5 flex items-center justify-between text-xs">
            <span className="text-rose-700 font-medium">
              {lockedCount > 0 ? `${lockedCount} tài khoản bị vô hiệu hóa` : 'Tất cả tài khoản đang hoạt động'}
            </span>
            <span
              className={`text-[11px] font-semibold ${
                selectedFilter === 'LOCKED' ? 'text-rose-700' : 'text-slate-400 group-hover:text-rose-600'
              }`}
            >
              {selectedFilter === 'LOCKED' ? 'Đang chọn' : 'Bấm để lọc'}
            </span>
          </div>
        </button>
      </div>
    </div>
  );
};
