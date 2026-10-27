import React from 'react';
import { Pencil, KeyRound, ShieldCheck, Lock, Unlock, MapPin, Clock } from 'lucide-react';
import { UserAccount } from '../types';
import { getRoleBadge, getStatusBadge } from '../utils/userBadges';

interface UserMobileCardsProps {
  users: UserAccount[];
  onToggleStatus: (user: UserAccount) => void;
  onResetPassword: (user: UserAccount) => void;
  onEditUser: (user: UserAccount) => void;
  onViewSecurityLog: (user: UserAccount) => void;
}

export const UserMobileCards: React.FC<UserMobileCardsProps> = ({
  users,
  onToggleStatus,
  onResetPassword,
  onEditUser,
  onViewSecurityLog,
}) => {
  if (users.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 italic text-sm bg-white rounded-xl">
        Không tìm thấy tài khoản nào khớp với điều kiện lọc.
      </div>
    );
  }

  return (
    <div className="p-3 space-y-3 bg-slate-50/70">
      {users.map((u) => {
        const initials = u.fullName
          .split(' ')
          .map((n) => n[0])
          .slice(-2)
          .join('');

        return (
          <div
            key={u.id}
            className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3"
          >
            {/* User Identity Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold flex items-center justify-center text-sm shrink-0 shadow-2xs">
                  {initials}
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">{u.fullName}</div>
                  <div className="font-mono text-xs text-slate-500">
                    @{u.username} • {u.phone}
                  </div>
                </div>
              </div>

              {getStatusBadge(u.status)}
            </div>

            {/* Badges: Role & Warehouse */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
              <div>{getRoleBadge(u.role)}</div>
              {u.assignedWarehouse && (
                <div className="flex items-center gap-1 font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  <MapPin className="w-3 h-3 text-indigo-600" />
                  <span>{u.assignedWarehouse}</span>
                </div>
              )}
            </div>

            {/* Login audit detail */}
            <div className="text-[11px] font-mono text-slate-500 flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-200/60">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-sky-600" />
                {u.lastLoginAt}
              </span>
              <span>IP: {u.lastLoginIp}</span>
            </div>

            {/* Security Actions Bar */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-1.5">
              <button
                onClick={() => onEditUser(u)}
                title="Chỉnh sửa tài khoản"
                className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors border border-indigo-200 cursor-pointer"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => onResetPassword(u)}
                title="Cấp lại mật khẩu"
                className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition-colors border border-amber-200 cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
              </button>
              <button
                onClick={() => onViewSecurityLog(u)}
                title="Xem nhật ký an ninh"
                className="p-2 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg transition-colors border border-sky-200 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
              </button>
              {u.username === 'admin' ? (
                <span
                  title="Tài khoản Quản trị viên tối cao"
                  className="p-2 bg-slate-100 text-slate-400 rounded-lg border border-slate-200 cursor-not-allowed inline-flex"
                >
                  <Lock className="w-4 h-4" />
                </span>
              ) : (
                <button
                  onClick={() => onToggleStatus(u)}
                  title={u.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                  className={`p-2 rounded-lg transition-colors border cursor-pointer ${
                    u.status === 'ACTIVE'
                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {u.status === 'ACTIVE' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
