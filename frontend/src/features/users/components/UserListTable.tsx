import React, { useState } from 'react';
import { Search, Filter, Shield, Lock, Unlock, KeyRound, Pencil, ShieldCheck, Download, Clock, MapPin, CheckSquare, Square, Check } from 'lucide-react';
import { UserAccount } from '../types';
import { UserMobileCards } from './UserMobileCards';
import { getRoleBadge, getStatusBadge } from '../utils/userBadges';

interface UserListTableProps {
  users: UserAccount[];
  onToggleStatus: (user: UserAccount) => void;
  onResetPassword: (user: UserAccount) => void;
  onEditUser: (user: UserAccount) => void;
  onViewSecurityLog: (user: UserAccount) => void;
  onBulkStatus?: (selectedIds: string[], isActive: boolean) => Promise<void>;
}

export const UserListTable: React.FC<UserListTableProps> = ({
  users,
  onToggleStatus,
  onResetPassword,
  onEditUser,
  onViewSecurityLog,
  onBulkStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      u.username.toLowerCase().includes(term) ||
      u.fullName.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      (u.phone ? u.phone.includes(term) : false) ||
      (u.assignedWarehouse ? u.assignedWarehouse.toLowerCase().includes(term) : false);

    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'EXPIRED'
        ? u.isExpired
        : u.status === statusFilter;

    return matchSearch && matchRole && matchStatus;
  });

  // Tài khoản có thể chọn (loại trừ root admin)
  const selectableUsers = filteredUsers.filter((u) => u.username.toLowerCase() !== 'admin');
  const allSelectableChosen =
    selectableUsers.length > 0 && selectableUsers.every((u) => selectedIds.has(u.id));

  const toggleSelectAll = () => {
    if (allSelectableChosen) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableUsers.map((u) => u.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleBulkAction = async (isActive: boolean) => {
    if (selectedIds.size === 0 || !onBulkStatus) return;
    const count = selectedIds.size;
    const actionText = isActive ? 'mở khóa hoạt động' : 'tạm khóa tài khoản & thu hồi phiên làm việc';
    const confirmed = window.confirm(
      `Xác nhận ${actionText} cho ${count} tài khoản nhân sự đã chọn?`
    );
    if (!confirmed) return;

    setIsBulkLoading(true);
    try {
      await onBulkStatus(Array.from(selectedIds), isActive);
      setSelectedIds(new Set());
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handleExportCsv = () => {
    const headers = ['ID', 'Tên Đăng Nhập', 'Họ Và Tên', 'Email', 'Số Điện Thoại', 'Vai Trò', 'Kho Phụ Trách', 'Hạn Dùng', 'Trạng Thái', 'Đăng Nhập Cuối', 'IP'];
    const rows = filteredUsers.map((u) => [
      u.id,
      u.username,
      `"${u.fullName.replace(/"/g, '""')}"`,
      u.email,
      u.phone || '',
      u.role,
      `"${(u.assignedWarehouse || '').replace(/"/g, '""')}"`,
      u.expiresAt || 'Vô thời hạn',
      u.isExpired ? 'HẾT HẠN' : u.status,
      `"${u.lastLoginAt}"`,
      u.lastLoginIp,
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Danh_sach_nhan_su_kho_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Search & Filter Bar */}
      <div className="p-3 sm:p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên đăng nhập, họ tên, email, kho..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Role Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả vai trò</option>
              <option value="ROLE_ADMIN">Quản trị viên (Admin)</option>
              <option value="ROLE_WAREHOUSE_MANAGER">Quản lý trưởng kho</option>
              <option value="ROLE_OPERATOR">Thủ kho (Vận hành thực địa)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="LOCKED">Bị tạm khóa</option>
              <option value="EXPIRED">Đã hết hạn hợp đồng</option>
            </select>
          </div>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCsv}
            title="Xuất dữ liệu nhân sự ra file CSV"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Xuất CSV</span>
          </button>
        </div>
      </div>

      {/* Floating Bulk Action Bar (Hiển thị khi chọn ít nhất 1 tài khoản) */}
      {selectedIds.size > 0 && (
        <div className="p-3 bg-indigo-50/90 border-b border-indigo-200 flex flex-wrap items-center justify-between gap-3 text-xs animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-indigo-950 flex items-center gap-1.5">
              <Check className="w-4 h-4 text-indigo-600" />
              Đã chọn <span className="px-2 py-0.5 bg-indigo-600 text-white rounded-full font-bold">{selectedIds.size}</span> tài khoản
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleBulkAction(false)}
              disabled={isBulkLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Khóa toàn bộ tài khoản đã chọn"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Khóa Hàng Loạt</span>
            </button>
            <button
              onClick={() => handleBulkAction(true)}
              disabled={isBulkLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Mở khóa toàn bộ tài khoản đã chọn"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Mở Khóa Hàng Loạt</span>
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              disabled={isBulkLoading}
              className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl font-medium transition-colors cursor-pointer"
            >
              Bỏ chọn
            </button>
          </div>
        </div>
      )}

      {/* Mobile Cards View (< md) */}
      <div className="block md:hidden">
        <UserMobileCards
          users={filteredUsers}
          onToggleStatus={onToggleStatus}
          onResetPassword={onResetPassword}
          onEditUser={onEditUser}
          onViewSecurityLog={onViewSecurityLog}
        />
      </div>

      {/* Desktop Table View (>= md) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-100 text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3 px-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={allSelectableChosen}
                  onChange={toggleSelectAll}
                  disabled={selectableUsers.length === 0}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  title="Chọn tất cả nhân sự hiển thị"
                />
              </th>
              <th className="py-3 px-4">Tài Khoản & Thông Tin</th>
              <th className="py-3 px-4">Vai Trò</th>
              <th className="py-3 px-4">Kho Phụ Trách</th>
              <th className="py-3 px-4">Đăng Nhập Cuối</th>
              <th className="py-3 px-4 text-center">Trạng Thái</th>
              <th className="py-3 px-4 text-right">Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-slate-400 italic">
                  Không tìm thấy nhân viên nào khớp với điều kiện lọc.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const initials = u.fullName
                  .split(' ')
                  .map((n) => n[0])
                  .slice(-2)
                  .join('');

                const isRootAdmin = u.username.toLowerCase() === 'admin';
                const isSelected = selectedIds.has(u.id);

                return (
                  <tr
                    key={u.id}
                    className={`transition-colors ${
                      isSelected ? 'bg-indigo-50/50 hover:bg-indigo-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3.5 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(u.id)}
                        disabled={isRootAdmin}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                        title={isRootAdmin ? 'Không thể thao tác hàng loạt trên Quản trị viên tối cao' : 'Chọn nhân sự này'}
                      />
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                          {initials}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                            <span>{u.fullName}</span>
                            {/* Expiry Badge */}
                            {u.isExpired ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                                <Clock className="w-3 h-3 text-rose-600" /> Đã hết hạn
                              </span>
                            ) : u.expiresAt ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                <Clock className="w-3 h-3 text-amber-600" /> Hạn: {u.expiresAt}
                              </span>
                            ) : null}
                          </div>
                          <div className="font-mono text-xs text-slate-500">
                            @{u.username} • {u.email}
                          </div>
                          <div className="text-xs text-slate-400 font-mono">SĐT: {u.phone}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">{getRoleBadge(u.role)}</td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800 text-xs">
                        <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{u.assignedWarehouse}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                        Tạo: {u.createdAt}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-xs">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Clock className="w-3.5 h-3.5 text-sky-600" />
                        <span>{u.lastLoginAt}</span>
                      </div>
                      <div className="text-slate-400 mt-0.5">IP: {u.lastLoginIp}</div>
                    </td>

                    <td className="py-3.5 px-4 text-center">{getStatusBadge(u.status)}</td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onEditUser(u)}
                          title="Chỉnh sửa thông tin nhân viên, vai trò & thời hạn"
                          className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors border border-indigo-200 cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        {isRootAdmin ? (
                          <span
                            title="Quản trị viên đổi mật khẩu tại trang Hồ sơ cá nhân"
                            className="p-1.5 bg-slate-100 text-slate-400 rounded-lg border border-slate-200 cursor-not-allowed inline-flex"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <button
                            onClick={() => onResetPassword(u)}
                            title="Cấp lại mật khẩu mặc định"
                            className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition-colors border border-amber-200 cursor-pointer"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => onViewSecurityLog(u)}
                          title="Xem phiên làm việc & đăng xuất thiết bị"
                          className="p-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg transition-colors border border-sky-200 cursor-pointer"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </button>
                        {isRootAdmin ? (
                          <span
                            title="Tài khoản Quản trị viên tối cao"
                            className="p-1.5 bg-slate-100 text-slate-400 rounded-lg border border-slate-200 cursor-not-allowed inline-flex"
                          >
                            <Lock className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <button
                            onClick={() => onToggleStatus(u)}
                            title={u.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                            className={`p-1.5 rounded-lg transition-colors border cursor-pointer ${
                              u.status === 'ACTIVE'
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {u.status === 'ACTIVE' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 flex items-center justify-between font-mono">
        <div>
          Hiển thị <span className="text-slate-900 font-bold">{filteredUsers.length}</span> / {users.length} tài khoản
        </div>
        {selectedIds.size > 0 && (
          <div className="text-indigo-600 font-bold">
            Đang chọn {selectedIds.size} tài khoản
          </div>
        )}
      </div>
    </div>
  );
};
