import React, { useState } from 'react';
import { X, Plus, Shield, Loader2, AlertCircle, Clock } from 'lucide-react';
import { UserAccount, UserRole } from '../types';
import { userService } from '../services/userService';
import { TempPasswordGenerator } from './TempPasswordGenerator';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddUser: (user: UserAccount) => void;
}

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onAddUser,
}) => {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('ROLE_OPERATOR');
  const [assignedWarehouse, setAssignedWarehouse] = useState('Kho Tổng Tân Bình (ZONE A & B)');
  const [expiresAt, setExpiresAt] = useState('');
  const [tempPassword, setTempPassword] = useState('123456');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setUsername('');
    setFullName('');
    setEmail('');
    setPhone('');
    setRole('ROLE_OPERATOR');
    setExpiresAt('');
    setTempPassword('123456');
    setErrorMessage(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !fullName.trim()) {
      setErrorMessage('Vui lòng nhập đầy đủ Tên đăng nhập và Họ tên!');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const createdUser = await userService.createUser({
        username: username.trim().toLowerCase(),
        password: tempPassword || '123456',
        fullName: fullName.trim(),
        email: email.trim() || `${username.trim().toLowerCase()}@smartwms.vn`,
        role: role,
        expiresAt: expiresAt ? new Date(expiresAt + 'T23:59:59Z').toISOString() : undefined,
      });

      createdUser.assignedWarehouse = assignedWarehouse;
      if (phone.trim()) {
        createdUser.phone = phone.trim();
      }

      onAddUser(createdUser);
      handleClose();
    } catch (err: unknown) {
      console.error('Lỗi khởi tạo tài khoản:', err);
      const msg = err instanceof Error ? err.message : 'Không thể khởi tạo tài khoản. Vui lòng thử lại!';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Thêm Tài Khoản Người Dùng Mới</h2>
              <p className="text-xs text-slate-500">Khởi tạo tài khoản nhân sự mới vào hệ thống Smart WMS</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Tên Đăng Nhập <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="VD: operator_pda2"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                disabled={isSubmitting}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Họ và Tên Nhân Viên <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="VD: Nguyễn Văn Vận Hành"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Địa Chỉ Email</label>
              <input
                type="email"
                placeholder="VD: pda2@smartwms.vn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Số Điện Thoại</label>
              <input
                type="text"
                placeholder="VD: 0988 123 456"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Vai Trò Hệ Thống</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 cursor-pointer transition-all"
                disabled={isSubmitting}
              >
                <option value="ROLE_OPERATOR">Thủ kho (Vận hành thực địa)</option>
                <option value="ROLE_WAREHOUSE_MANAGER">Quản lý trưởng kho</option>
                <option value="ROLE_ADMIN">Quản trị viên (Admin)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Kho Phụ Trách</label>
              <select
                value={assignedWarehouse}
                onChange={(e) => setAssignedWarehouse(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 cursor-pointer transition-all"
                disabled={isSubmitting}
              >
                <option value="Kho Tổng Tân Bình (ZONE A & B)">Kho Tổng Tân Bình (ZONE A & B)</option>
                <option value="Kho Mát 2-8°C (ZONE B)">Kho Mát 2-8°C (ZONE B)</option>
                <option value="Kho Khô & Điện Tử (ZONE A)">Kho Khô & Điện Tử (ZONE A)</option>
              </select>
            </div>
          </div>

          {/* Expiry Date */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-700 font-semibold flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Ngày Hết Hạn Tài Khoản (Tùy chọn)</span>
              </label>
              {expiresAt && (
                <button
                  type="button"
                  onClick={() => setExpiresAt('')}
                  className="text-2xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  Không đặt hạn
                </button>
              )}
            </div>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all cursor-pointer"
              disabled={isSubmitting}
            />
          </div>

          {/* Temporary Password Component */}
          <TempPasswordGenerator
            value={tempPassword}
            onChange={setTempPassword}
            disabled={isSubmitting}
          />

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors font-semibold text-sm cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-sm cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang Khởi Tạo...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Khởi Tạo Tài Khoản</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
