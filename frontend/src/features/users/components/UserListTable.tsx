import React, { useState } from 'react';
import { Search, Filter, Shield, User, Smartphone, Lock, Unlock, KeyRound, CheckCircle2, AlertCircle, Clock, MapPin } from 'lucide-react';
import { UserAccount, UserRole, UserStatus } from '../types';

interface UserListTableProps {
  users: UserAccount[];
  onToggleStatus: (userId: string) => void;
  onResetPassword: (user: UserAccount) => void;
}

export const UserListTable: React.FC<UserListTableProps> = ({
  users,
  onToggleStatus,
  onResetPassword,
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
      u.phone.includes(term) ||
      u.assignedWarehouse.toLowerCase().includes(term);

    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchStatus = statusFilter === 'ALL' || u.status === statusFilter;

    return matchSearch && matchRole && matchStatus;
  });

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ROLE_ADMIN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 font-mono">
            <Shield className="w-3.5 h-3.5 text-purple-600" />
            ADMIN (Toàn quyền)
          </span>
        );
      case 'ROLE_WAREHOUSE_MANAGER':
      case 'ROLE_MANAGER':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
            <User className="w-3.5 h-3.5 text-blue-600" />
            QUẢN LÝ KHO (Manager)
          </span>
        );
      case 'ROLE_OPERATOR':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-cyan-50 text-cyan-800 border border-cyan-200 font-mono">
            <Smartphone className="w-3.5 h-3.5 text-cyan-600" />
            THỦ KHO (PDA Mobile)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 font-mono">
            {role}
          </span>
        );
    }
  };

  const getStatusBadge = (status: UserStatus) => {
    if (status === 'ACTIVE') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Hoạt Động
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
        <Lock className="w-3.5 h-3.5" />
        Đã Khóa
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Search & Filter Bar */}
      <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo username, họ tên, email, SĐT, kho phụ trách..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-sm">
          {/* Role Filter */}
          <div className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-xl border border-slate-300">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-transparent text-slate-700 focus:outline-none cursor-pointer text-sm font-medium"
            >
              <option value="ALL">Tất cả vai trò</option>
              <option value="ROLE_ADMIN">ADMIN (Quản trị viên)</option>
              <option value="ROLE_MANAGER">MANAGER (Quản lý kho)</option>
              <option value="ROLE_OPERATOR">OPERATOR (Thủ kho PDA)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-xl border border-slate-300">
            <Shield className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-700 focus:outline-none cursor-pointer text-sm font-medium"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="LOCKED">Bị tạm khóa</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-100 text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3.5 px-4">Tài Khoản & Thông Tin</th>
              <th className="py-3.5 px-4">Vai Trò Hệ Thống (RBAC)</th>
              <th className="py-3.5 px-4">Kho Phụ Trách</th>
              <th className="py-3.5 px-4">Đăng Nhập Cuối & IP</th>
              <th className="py-3.5 px-4 text-center">Trạng Thái</th>
              <th className="py-3.5 px-4 text-right">Thao Tác Bảo Mật</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-sans">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-slate-500 italic">
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
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* User info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold flex items-center justify-center text-sm flex-shrink-0 shadow-sm">
                          {initials}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                            {u.fullName}
                          </div>
                          <div className="font-mono text-xs text-slate-500 mt-0.5">
                            @{u.username} • {u.email}
                          </div>
                          <div className="text-xs text-slate-500 font-mono">SĐT: {u.phone}</div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4">{getRoleBadge(u.role)}</td>

                    {/* Assigned Warehouse */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800">
                        <MapPin className="w-4 h-4 text-indigo-600" />
                        <span>{u.assignedWarehouse}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 font-mono">
                        Tạo ngày: {u.createdAt}
                      </div>
                    </td>

                    {/* Last login */}
                    <td className="py-3.5 px-4 font-mono text-xs">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Clock className="w-3.5 h-3.5 text-sky-600" />
                        <span>{u.lastLoginAt}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">IP: {u.lastLoginIp}</div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">{getStatusBadge(u.status)}</td>

                    {/* Security Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onResetPassword(u)}
                          title="Reset mật khẩu người dùng"
                          className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition-colors border border-amber-200"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onToggleStatus(u.id)}
                          title={u.status === 'ACTIVE' ? 'Khóa tài khoản này' : 'Mở khóa tài khoản'}
                          className={`p-2 rounded-lg transition-colors border ${
                            u.status === 'ACTIVE'
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {u.status === 'ACTIVE' ? (
                            <Lock className="w-4 h-4" />
                          ) : (
                            <Unlock className="w-4 h-4" />
                          )}
                        </button>
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
      <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 flex items-center justify-between">
        <div>
          Hiển thị <span className="text-slate-900 font-bold">{filteredUsers.length}</span> / {users.length} tài khoản
        </div>
      </div>
    </div>
  );
};
