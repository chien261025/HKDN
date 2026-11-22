import React from 'react';
import { Pencil, KeyRound, ShieldCheck, Lock, Unlock, MapPin, Clock, Eye } from 'lucide-react';
import { UserAccount } from '../types';
import { getRoleBadge, getStatusBadge } from '../utils/userBadges';

interface UserMobileCardsProps {
  users: UserAccount[];
  onToggleStatus: (user: UserAccount) => void;
  onResetPassword: (user: UserAccount) => void;
  onEditUser: (user: UserAccount) => void;
  onViewSecurityLog: (user: UserAccount) => void;
  onViewDetail?: (user: UserAccount) => void;
  isAdmin?: boolean;
}

export const UserMobileCards: React.FC<UserMobileCardsProps> = ({
  users,
  onToggleStatus,
  onResetPassword,
  onEditUser,
  onViewSecurityLog,
  onViewDetail,
  isAdmin = true,
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

        const isRootAdmin = u.username.toLowerCase() === 'admin';

        return (
          <div
            key={u.id}
            className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3"
          >
            {/* User Identity Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onViewDetail && onViewDetail(u)}
                  className="w-10 h-10 rounded-xl bg-indigo-50 hover:bg-blue-100 border border-indigo-200 text-indigo-700 font-extrabold flex items-center justify-center text-sm shrink-0 shadow-2xs transition-colors cursor-pointer"
                  title="Xem chi tiết hồ sơ"
                >
                  {initials}
                </button>
                <div>
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => onViewDetail && onViewDetail(u)}
                      className="font-bold text-slate-900 hover:text-blue-600 transition-colors text-left cursor-pointer"
                    >
                      {u.fullName}
                    </button>
                    {u.isTestAccount && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-300 px-1.5 py-0.2 rounded-full">
                        🧪 Test Lab
                      </span>
                    )}
                    {u.isExpired ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded-full">
                        Đã hết hạn
                      </span>
                    ) : u.expiresAt ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded-full">
                        Hạn: {u.expiresAt}
                      </span>
                    ) : null}
                  </div>
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

            {/* Hiển thị lý do khóa nếu tài khoản đang bị khóa */}
            {u.status === 'LOCKED' && u.lockReason && (
              <div
                onClick={() => onViewDetail && onViewDetail(u)}
                className="text-xs text-rose-800 bg-rose-50 border border-rose-200 p-2.5 rounded-xl cursor-pointer hover:bg-rose-100/70 transition-colors"
              >
                <span className="font-bold text-rose-950">Lý do khóa:</span> {u.lockReason}
              </div>
            )}

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
              {onViewDetail && (
                <button
                  onClick={() => onViewDetail(u)}
                  title="Xem chi tiết hồ sơ nhân sự"
                  className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors border border-blue-200 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>Chi tiết</span>
                </button>
              )}
              <button
                onClick={() => onViewSecurityLog(u)}
                title="Lịch sử an ninh"
                className="p-2 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg transition-colors border border-sky-200 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
              </button>

              {isAdmin && (
                <>
                  <button
                    onClick={() => onEditUser(u)}
                    title="Chỉnh sửa tài khoản & hạn dùng"
                    className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors border border-indigo-200 cursor-pointer"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  {isRootAdmin ? (
                    <span
                      title="Quản trị viên đổi mật khẩu tại trang Hồ sơ cá nhân"
                      className="p-2 bg-slate-100 text-slate-400 rounded-lg border border-slate-200 cursor-not-allowed inline-flex"
                    >
                      <KeyRound className="w-4 h-4" />
                    </span>
                  ) : (
                    <button
                      onClick={() => onResetPassword(u)}
                      title="Đặt lại mật khẩu"
                      className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition-colors border border-amber-200 cursor-pointer"
                    >
                      <KeyRound className="w-4 h-4" />
                    </button>
                  )}
                  {isRootAdmin ? (
                    <span className="p-2 bg-slate-100 text-slate-400 rounded-lg border border-slate-200 cursor-not-allowed inline-flex">
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
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
