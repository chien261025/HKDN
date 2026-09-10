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
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30 font-mono">
            <Shield className="w-3 h-3 text-purple-400" />
            ADMIN (Toàn quyền)
          </span>
        );
      case 'ROLE_MANAGER':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/10 text-blue-300 border border-blue-500/30 font-mono">
            <User className="w-3 h-3 text-blue-400" />
            QUẢN LÝ KHO (Manager)
          </span>
        );
      case 'ROLE_OPERATOR':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-mono">
            <Smartphone className="w-3 h-3 text-cyan-400" />
            THỦ KHO (PDA Mobile)
          </span>
        );
    }
  };

  const getStatusBadge = (status: UserStatus) => {
    if (status === 'ACTIVE') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3 h-3" />
          Hoạt Động
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
        <Lock className="w-3 h-3" />
        Đã Khóa
      </span>
    );
  };

  return (
    <div className="bg-[#0b101d]/90 backdrop-blur-xl rounded-2xl border border-slate-800/80 shadow-xl overflow-hidden">
      {/* Search & Filter Bar */}
      <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-900/40">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo username, họ tên, email, SĐT, kho phụ trách..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950/70 border border-slate-700/70 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Role Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950/70 px-2.5 py-1.5 rounded-xl border border-slate-700/70">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-transparent text-slate-300 focus:outline-none cursor-pointer text-xs"
            >
              <option value="ALL" className="bg-slate-900 text-white">Tất cả vai trò</option>
              <option value="ROLE_ADMIN" className="bg-slate-900 text-purple-300">ADMIN (Quản trị viên)</option>
              <option value="ROLE_MANAGER" className="bg-slate-900 text-blue-300">MANAGER (Quản lý kho)</option>
              <option value="ROLE_OPERATOR" className="bg-slate-900 text-cyan-300">OPERATOR (Thủ kho PDA)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950/70 px-2.5 py-1.5 rounded-xl border border-slate-700/70">
            <Shield className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-300 focus:outline-none cursor-pointer text-xs"
            >
              <option value="ALL" className="bg-slate-900 text-white">Tất cả trạng thái</option>
              <option value="ACTIVE" className="bg-slate-900 text-emerald-300">Đang hoạt động</option>
              <option value="LOCKED" className="bg-slate-900 text-rose-300">Bị tạm khóa</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/80 text-[11px] font-mono text-slate-400 uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Tài Khoản & Thông Tin</th>
              <th className="py-3 px-4">Vai Trò Hệ Thống (RBAC)</th>
              <th className="py-3 px-4">Kho Phụ Trách</th>
              <th className="py-3 px-4">Đăng Nhập Cuối & IP</th>
              <th className="py-3 px-4 text-center">Trạng Thái</th>
              <th className="py-3 px-4 text-right">Thao Tác Bảo Mật</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
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
                  <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                    {/* User info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-700 to-indigo-600 text-white font-extrabold flex items-center justify-center text-xs flex-shrink-0 shadow-md">
                          {initials}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm flex items-center gap-1.5">
                            {u.fullName}
                          </div>
                          <div className="font-mono text-[11px] text-slate-400 mt-0.5">
                            @{u.username} • {u.email}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">SĐT: {u.phone}</div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4">{getRoleBadge(u.role)}</td>

                    {/* Assigned Warehouse */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-medium text-slate-200">
                        <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{u.assignedWarehouse}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                        Tạo ngày: {u.createdAt}
                      </div>
                    </td>

                    {/* Last login */}
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      <div className="flex items-center gap-1 text-slate-300">
                        <Clock className="w-3 h-3 text-cyan-400" />
                        <span>{u.lastLoginAt}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">IP: {u.lastLoginIp}</div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">{getStatusBadge(u.status)}</td>

                    {/* Security Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onResetPassword(u)}
                          title="Reset mật khẩu người dùng"
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg transition-colors border border-slate-700"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onToggleStatus(u.id)}
                          title={u.status === 'ACTIVE' ? 'Khóa tài khoản này' : 'Mở khóa tài khoản'}
                          className={`p-1.5 rounded-lg transition-colors border ${
                            u.status === 'ACTIVE'
                              ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
                              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          }`}
                        >
                          {u.status === 'ACTIVE' ? (
                            <Lock className="w-3.5 h-3.5" />
                          ) : (
                            <Unlock className="w-3.5 h-3.5" />
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
      <div className="p-3 bg-slate-900/60 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between font-mono">
        <div>
          Hiển thị <span className="text-white font-bold">{filteredUsers.length}</span> / {users.length} tài khoản
        </div>
        <div className="text-[11px] text-slate-500">
          Chính sách mật khẩu: BCrypt Hash + JWT Access Token Expired 8h
        </div>
      </div>
    </div>
  );
};
