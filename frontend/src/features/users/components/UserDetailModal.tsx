import React from 'react';
import {
  X,
  User,
  Shield,
  Building2,
  Phone,
  Mail,
  Clock,
  Laptop,
  Smartphone,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  KeyRound,
  Pencil,
  ShieldCheck,
  AlertTriangle,
  Calendar
} from 'lucide-react';
import { UserAccount } from '../types';
import { getRoleBadge, getStatusBadge } from '../utils/userBadges';

interface UserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserAccount | null;
  onEditUser?: (user: UserAccount) => void;
  onResetPassword?: (user: UserAccount) => void;
  onToggleStatus?: (user: UserAccount) => void;
  onViewSecurityLog?: (user: UserAccount) => void;
  isAdmin?: boolean;
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({
  isOpen,
  onClose,
  user,
  onEditUser,
  onResetPassword,
  onToggleStatus,
  onViewSecurityLog,
  isAdmin = true,
}) => {
  if (!isOpen || !user) return null;

  const isLocked = user.status === 'LOCKED' || user.status === 'SUSPENDED';
  const isRootAdmin = user.username.toLowerCase() === 'admin';

  const initials = user.fullName
    ? user.fullName
        .split(' ')
        .map((n) => n[0])
        .slice(-2)
        .join('')
    : 'NV';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden my-4 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md shadow-blue-200 ring-4 ring-blue-50">
                {initials}
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-2 border-white rounded-full ${
                  isLocked ? 'bg-rose-500' : 'bg-emerald-500'
                }`}
              ></span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">{user.fullName}</h2>
                {getStatusBadge(user.status)}
                {getRoleBadge(user.role)}
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                @{user.username} • {user.email}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
          {/* Cảnh báo và chi tiết khi tài khoản đang bị khóa */}
          {isLocked && (
            <div className="p-4 bg-rose-50/90 border border-rose-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-rose-100 text-rose-700 border border-rose-200 shrink-0 mt-0.5">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-rose-950 text-sm">Tài Khoản Đang Bị Tạm Khóa</span>
                    <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-rose-600 text-white">
                      Vô hiệu hóa
                    </span>
                  </div>
                  <div className="text-xs text-rose-900 font-medium mt-1">
                    Lý do khóa:{' '}
                    <strong className="font-bold text-rose-950 underline">
                      {user.lockReason || 'Tạm khóa theo yêu cầu quản trị viên / An toàn bảo mật'}
                    </strong>
                  </div>
                  <div className="text-[11px] text-rose-600 mt-0.5">
                    Thời gian khóa: {user.lockedAt || 'Gần đây'} • Người thực hiện: {user.lockedBy || 'Quản trị viên (@admin)'}
                  </div>
                </div>
              </div>

              {onToggleStatus && !isRootAdmin && isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onToggleStatus(user);
                  }}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Mở Khóa Ngay</span>
                </button>
              )}
            </div>
          )}

          {/* Khối thông tin liên hệ & định danh */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <User className="w-4 h-4 text-blue-600" />
                <span>Thông Tin Định Danh</span>
              </span>
              <div className="space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Tên đăng nhập:</span>
                  <span className="font-mono font-bold text-slate-900">@{user.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Họ và tên:</span>
                  <span className="font-semibold text-slate-900">{user.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Số điện thoại:</span>
                  <span className="font-mono text-slate-800">{user.phone || 'Chưa cập nhật'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Hạn dùng hợp đồng:</span>
                  <span className="text-slate-800 font-semibold">{user.expiresAt || 'Vô thời hạn'}</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>Hoạt Động & Đăng Nhập</span>
              </span>
              <div className="space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Đăng nhập cuối:</span>
                  <span className="font-medium text-slate-900">{user.lastLoginAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Địa chỉ IP:</span>
                  <span className="font-mono text-slate-800">{user.lastLoginIp}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Ngày tạo tài khoản:</span>
                  <span className="text-slate-800">{user.createdAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Loại tài khoản:</span>
                  <span className="text-slate-800">{user.isTestAccount ? 'Tài khoản thử nghiệm' : 'Chính thức'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Phân quyền chi nhánh kho */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Phân Quyền Chi Nhánh Kho Hàng</span>
              </span>
              <span className="text-2xs text-slate-500 font-medium">
                Kho chính: <strong className="text-blue-700">{user.primaryWarehouse || user.assignedWarehouse}</strong>
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {user.assignedWarehouses && user.assignedWarehouses.length > 0 ? (
                user.assignedWarehouses.map((whName, idx) => {
                  const isPrimary = whName === user.primaryWarehouse;
                  return (
                    <span
                      key={idx}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 ${
                        isPrimary
                          ? 'bg-blue-50 border-blue-300 text-blue-800 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>{whName}</span>
                      {isPrimary && (
                        <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.2 rounded-md font-bold">
                          Mặc định
                        </span>
                      )}
                    </span>
                  );
                })
              ) : (
                <span className="text-slate-500 italic">Chưa gán chi nhánh kho cụ thể</span>
              )}
            </div>
          </div>

          {/* Chính sách bảo mật & Quyền thao tác */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
            <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
              <Shield className="w-4 h-4 text-purple-600" />
              <span>Chính Sách An Toàn & Bảo Mật Dữ Liệu</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                  {user.role === 'ROLE_ADMIN' || user.role === 'ROLE_WAREHOUSE_MANAGER' ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-2xs">Xem Giá Vốn</div>
                  <div className="text-[11px] text-slate-500">
                    {user.role === 'ROLE_ADMIN' || user.role === 'ROLE_WAREHOUSE_MANAGER'
                      ? 'Được phép xem giá'
                      : 'Bị che giấu (***)'}
                  </div>
                </div>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-2xs">Thiết Bị PDA</div>
                  <div className="text-[11px] text-slate-500">
                    {user.role === 'ROLE_OPERATOR' || user.role === 'ROLE_WAREHOUSE_MANAGER'
                      ? 'Cho phép quét mã'
                      : 'Chỉ giao diện Web'}
                  </div>
                </div>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-2xs">Duyệt Chứng Từ</div>
                  <div className="text-[11px] text-slate-500">
                    {user.role === 'ROLE_ADMIN' || user.role === 'ROLE_WAREHOUSE_MANAGER'
                      ? 'Có thẩm quyền duyệt'
                      : 'Chỉ thực hiện thao tác'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2">
            {onViewSecurityLog && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onViewSecurityLog(user);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Nhật ký an ninh</span>
              </button>
            )}

            {onResetPassword && !isRootAdmin && isAdmin && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onResetPassword(user);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                <span>Cấp lại mật khẩu</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onEditUser && isAdmin && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditUser(user);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Chỉnh sửa hồ sơ</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

