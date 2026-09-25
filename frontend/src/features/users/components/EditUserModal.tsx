import React, { useState, useEffect } from 'react';
import { X, UserCheck, Shield, AlertTriangle, Building2, Phone, Mail, User, Loader2 } from 'lucide-react';
import { UserAccount, UserRole, UpdateUserPayload } from '../types';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserAccount | null;
  onUpdateUser: (userId: string, payload: UpdateUserPayload) => Promise<void>;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateUser,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('ROLE_OPERATOR');
  const [assignedWarehouse, setAssignedWarehouse] = useState('Kho Tổng Tân Bình (ZONE A & B)');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user && isOpen) {
      setFullName(user.fullName);
      setEmail(user.email);
      setPhone(user.phone || '');
      setRole(user.role);
      setAssignedWarehouse(user.assignedWarehouse || 'Kho Tổng Tân Bình (ZONE A & B)');
      setErrorMsg(null);
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const isRootAdmin = user.username.toLowerCase() === 'admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      setErrorMsg('Họ tên và Email không được để trống!');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      await onUpdateUser(user.id, {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        role: role,
        assignedWarehouse: assignedWarehouse,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi khi cập nhật thông tin người dùng!');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Chỉnh Sửa Hồ Sơ & Vai Trò RBAC</h3>
              <p className="text-xs text-slate-500 font-mono">Tài khoản: @{user.username}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 flex items-center gap-1.5">
              <User className="w-4 h-4 text-slate-400" />
              <span>Họ và Tên Nhân Sự:</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 font-medium"
            />
          </div>

          {/* Email & Phone Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-slate-400" />
                <span>Email Công Vụ:</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-slate-400" />
                <span>Số Điện Thoại:</span>
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09xxxxxxxx"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 font-mono"
              />
            </div>
          </div>

          {/* RBAC Role */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-indigo-600" />
                <span>Vai Trò Hệ Thống (RBAC):</span>
              </span>
              {isRootAdmin && (
                <span className="text-2xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                  Root Admin Bất Biến
                </span>
              )}
            </label>
            <select
              value={role}
              disabled={isRootAdmin}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 font-medium disabled:bg-slate-100 cursor-pointer"
            >
              <option value="ROLE_OPERATOR">THỦ KHO (PDA Mobile - Vận hành hiện trường)</option>
              <option value="ROLE_WAREHOUSE_MANAGER">QUẢN LÝ KHO (Manager - Điều hành toàn diện)</option>
              <option value="ROLE_ADMIN">ADMIN (Quản trị viên toàn hệ thống)</option>
            </select>
          </div>

          {/* Warehouse */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-slate-400" />
              <span>Kho Phụ Trách:</span>
            </label>
            <select
              value={assignedWarehouse}
              onChange={(e) => setAssignedWarehouse(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 font-medium cursor-pointer"
            >
              <option value="Kho Tổng Tân Bình (ZONE A & B)">Kho Tổng Tân Bình (ZONE A & B - TP.HCM)</option>
              <option value="Kho Phân Phối VSIP Bắc Ninh">Kho Phân Phối VSIP Bắc Ninh (Miền Bắc)</option>
            </select>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold transition-colors cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
              <span>Lưu Thay Đổi</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
