import React, { useState } from 'react';
import {
  X,
  User,
  Shield,
  KeyRound,
  Mail,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Smartphone,
  LogOut,
  Calendar,
  Sparkles
} from 'lucide-react';
import { userService } from '../services/userService';
import { authService } from '../../auth/services/authService';
import { AuthSession } from '../../auth/types';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: AuthSession;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  session,
}) => {
  const [activeTab, setActiveTab] = useState<'INFO' | 'CHANGE_PASSWORD'>('INFO');

  // Form states for password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleResetForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleClose = () => {
    handleResetForm();
    onClose();
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!currentPassword.trim()) {
      setErrorMessage('Vui lòng nhập mật khẩu hiện tại!');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('Mật khẩu mới phải có ít nhất 6 ký tự!');
      return;
    }

    if (newPassword === currentPassword) {
      setErrorMessage('Mật khẩu mới không được trùng với mật khẩu hiện tại!');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Xác nhận mật khẩu mới không khớp!');
      return;
    }

    setIsSubmitting(true);
    try {
      const msg = await userService.changePassword({
        username: session.username,
        currentPassword,
        newPassword,
      });

      setSuccessMessage(msg || 'Đổi mật khẩu thành công! Hãy ghi nhớ mật khẩu mới.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Lỗi khi đổi mật khẩu:', err);
      setErrorMessage(err.message || 'Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu cũ!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ROLE_ADMIN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-purple-50 text-purple-700 border border-purple-200 font-mono">
            <Shield className="w-3.5 h-3.5 text-purple-600" />
            ADMIN (Toàn Quyền Quản Trị)
          </span>
        );
      case 'ROLE_WAREHOUSE_MANAGER':
      case 'ROLE_MANAGER':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
            <User className="w-3.5 h-3.5 text-blue-600" />
            QUẢN LÝ KHO (Điều Phối Vận Hành)
          </span>
        );
      case 'ROLE_OPERATOR':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-cyan-50 text-cyan-800 border border-cyan-200 font-mono">
            <Smartphone className="w-3.5 h-3.5 text-cyan-600" />
            THỦ KHO (Mobile Barcode PDA)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono bg-slate-100 text-slate-700 border border-slate-200">
            {role}
          </span>
        );
    }
  };

  const initials = session.fullName
    ? session.fullName
        .split(' ')
        .map((n) => n[0])
        .slice(-2)
        .join('')
    : 'TK';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-8 relative">
        {/* Top Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 font-black flex items-center justify-center text-sm shadow-sm border border-indigo-200">
                {initials}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900 tracking-wide">{session.fullName || 'Người dùng WMS'}</h2>
                <span className="text-xs font-mono px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold">
                  ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                @{session.username} • {session.email || `${session.username}@smartwms.vn`}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-sm font-bold px-5 pt-2">
          <button
            onClick={() => {
              setActiveTab('INFO');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`pb-3 px-4 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'INFO'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Hồ Sơ Cá Nhân</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('CHANGE_PASSWORD');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`pb-3 px-4 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'CHANGE_PASSWORD'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Đổi Mật Khẩu</span>
          </button>
        </div>

        {/* Tab 1: INFO */}
        {activeTab === 'INFO' && (
          <div className="p-6 space-y-4 text-sm">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Vai Trò Hệ Thống (RBAC):</span>
                {getRoleBadge(session.role)}
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-2.5">
                <span className="text-slate-500 font-medium">Kho Gán Phụ Trách:</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-indigo-600" />
                  Kho Tổng Tân Bình (ZONE A & B)
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-2.5">
                <span className="text-slate-500 font-medium">Email Công Vụ:</span>
                <span className="font-mono text-slate-700">{session.email || `${session.username}@smartwms.vn`}</span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-2.5">
                <span className="text-slate-500 font-medium">Thời Gian Đăng Nhập:</span>
                <span className="font-mono text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-sky-600" />
                  {session.loginAt ? new Date(session.loginAt).toLocaleString('vi-VN') : 'Phiên hiện tại'}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-2.5">
                <span className="text-slate-500 font-medium">Hạn Chót Phiên JWT:</span>
                <span className="font-mono text-slate-600">
                  {session.expiresAt ? new Date(session.expiresAt).toLocaleTimeString('vi-VN') : '8 Giờ'} (Auto-refresh)
                </span>
              </div>
            </div>

            {/* Security Notice */}
            <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 flex items-start gap-3 text-slate-700">
              <Shield className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
              <div className="space-y-0.5 text-xs">
                <p className="font-semibold text-indigo-900">Chính Sách An Ninh & Truy Cập</p>
                <p className="text-slate-600">
                  Mật khẩu được lưu trữ dưới dạng hàm băm BCrypt một chiều. Nếu bạn nghi ngờ tài khoản bị lộ, hãy tiến hành đổi mật khẩu ngay lập tức tại tab bên cạnh.
                </p>
              </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => authService.logout()}
                className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold transition-all text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng Xuất Khỏi Thiết Bị</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('CHANGE_PASSWORD')}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md shadow-indigo-600/20 text-sm"
              >
                <KeyRound className="w-4 h-4" />
                <span>Đổi Mật Khẩu Ngay</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: CHANGE_PASSWORD */}
        {activeTab === 'CHANGE_PASSWORD' && (
          <form onSubmit={handleChangePasswordSubmit} className="p-6 space-y-4 text-sm">
            {/* Feedback Alerts */}
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-rose-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-700 text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Current Password */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Mật Khẩu Hiện Tại <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  required
                  placeholder="Nhập mật khẩu bạn đang dùng để đăng nhập"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 pr-10 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-700 font-semibold">
                  Mật Khẩu Mới <span className="text-rose-500">*</span>
                </label>
                <span className="text-xs text-slate-500 font-mono">Tối thiểu 6 ký tự</span>
              </div>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="Nhập mật khẩu mới an toàn"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 pr-10 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Xác Nhận Mật Khẩu Mới <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="Nhập lại mật khẩu mới vừa gõ"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 pr-10 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('INFO')}
                disabled={isSubmitting}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors text-sm"
              >
                Quay Lại
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang Cập Nhật...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Cập Nhật Mật Khẩu</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
