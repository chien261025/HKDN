import React, { useState } from 'react';
import { Search, Filter, Shield, Lock, Unlock, KeyRound, Pencil, ShieldCheck, Download, Clock, MapPin } from 'lucide-react';
import { UserAccount } from '../types';
import { UserMobileCards } from './UserMobileCards';
import { getRoleBadge, getStatusBadge } from '../utils/userBadges';

interface UserListTableProps {
  users: UserAccount[];
  onToggleStatus: (user: UserAccount) => void;
  onResetPassword: (user: UserAccount) => void;
  onEditUser: (user: UserAccount) => void;
  onViewSecurityLog: (user: UserAccount) => void;
}

export const UserListTable: React.FC<UserListTableProps> = ({
  users,
  onToggleStatus,
  onResetPassword,
  onEditUser,
  onViewSecurityLog,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      u.username.toLowerCase().includes(term) ||
      u.fullName.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      (u.phone ? u.phone.includes(term) : false) ||
      (u.assignedWarehouse ? u.assignedWarehouse.toLowerCase().includes(term) : false);

    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchStatus = statusFilter === 'ALL' || u.status === statusFilter;

    return matchSearch && matchRole && matchStatus;
  });

  const handleExportCsv = () => {
    const headers = ['ID', 'Tên Đăng Nhập', 'Họ Và Tên', 'Email', 'Số Điện Thoại', 'Vai Trò', 'Kho Phụ Trách', 'Trạng Thái', 'Đăng Nhập Cuối', 'IP'];
    const rows = filteredUsers.map((u) => [
      u.id,
      u.username,
      `"${u.fullName.replace(/"/g, '""')}"`,
      u.email,
      u.phone || '',
      u.role,
      `"${(u.assignedWarehouse || '').replace(/"/g, '""')}"`,
      u.status,
      `"${u.lastLoginAt}"`,
      u.lastLoginIp,
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `WMS_User_Access_Audit_${new Date().toISOString().slice(0, 10)}.csv`);
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
            placeholder="Tìm theo username, họ tên, email, kho..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Role Filter */}
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-transparent text-slate-700 focus:outline-none cursor-pointer font-medium"
            >
              <option value="ALL">Tất cả vai trò</option>
              <option value="ROLE_ADMIN">ADMIN (Quản trị viên)</option>
              <option value="ROLE_MANAGER">MANAGER (Quản lý kho)</option>
              <option value="ROLE_OPERATOR">OPERATOR (Thủ kho PDA)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
            <Shield className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-700 focus:outline-none cursor-pointer font-medium"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="LOCKED">Bị tạm khóa</option>
            </select>
          </div>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCsv}
            title="Xuất danh sách người dùng ra CSV"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-medium shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Xuất CSV</span>
          </button>
        </div>
      </div>

      {/* Mobile Card Feed (< md) */}
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
              <th className="py-3 px-4">Tài Khoản & Thông Tin</th>
              <th className="py-3 px-4">Vai Trò (RBAC)</th>
              <th className="py-3 px-4">Kho Phụ Trách</th>
              <th className="py-3 px-4">Đăng Nhập Cuối</th>
              <th className="py-3 px-4 text-center">Trạng Thái</th>
              <th className="py-3 px-4 text-right">Thao Tác Bảo Mật</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-slate-400 italic">
                  Không tìm thấy tài khoản nào khớp với điều kiện lọc.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const initials = u.fullName
                  .split(' ')
                  .map((n) => n[0])
                  .slice(-2)
                  .join('');

                return (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                          {initials}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 text-sm">
                            {u.fullName}
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
                          title="Chỉnh sửa thông tin & vai trò"
                          className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors border border-indigo-200 cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onResetPassword(u)}
                          title="Cấp lại mật khẩu"
                          className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition-colors border border-amber-200 cursor-pointer"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onViewSecurityLog(u)}
                          title="Xem nhật ký an ninh"
                          className="p-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg transition-colors border border-sky-200 cursor-pointer"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </button>
                        {u.username === 'admin' ? (
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
      </div>
    </div>
  );
};
