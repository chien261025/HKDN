import React, { useState } from 'react';
import { X, Plus, Shield, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { UserAccount, UserRole } from '../types';
import { userService } from '../services/userService';

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
  const [tempPassword, setTempPassword] = useState('123456');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setTempPassword(result);
  };

  const resetForm = () => {
    setUsername('');
    setFullName('');
    setEmail('');
    setPhone('');
    setRole('ROLE_OPERATOR');
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
      });

      // Bổ sung kho phụ trách nếu có
      createdUser.assignedWarehouse = assignedWarehouse;
      if (phone.trim()) {
        createdUser.phone = phone.trim();
      }

      onAddUser(createdUser);
      handleClose();
    } catch (err: any) {
      console.error('Lỗi khởi tạo tài khoản:', err);
      setErrorMessage(err.message || 'Không thể khởi tạo tài khoản. Vui lòng thử lại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#0e1626] border border-slate-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Thêm Tài Khoản Người Dùng Mới</h2>
              <p className="text-xs text-slate-400 mt-0.5">Khởi tạo định danh xác thực vào cơ sở dữ liệu PostgreSQL</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="m-4 mb-0 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2.5 text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Tên Đăng Nhập (Username) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="VD: operator_pda2"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-purple-500 transition-all"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Họ Và Tên Đầy Đủ <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="VD: Lê Văn An"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-all"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Email Công Vụ</label>
              <input
                type="email"
                placeholder="VD: an.le@smartwms.vn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-all"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Số Điện Thoại</label>
              <input
                type="text"
                placeholder="VD: 0988 123 456"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-purple-500 transition-all"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Vai Trò Hệ Thống (RBAC)</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500 cursor-pointer transition-all"
                disabled={isSubmitting}
              >
                <option value="ROLE_OPERATOR">ROLE_OPERATOR (Thủ kho Mobile/PDA)</option>
                <option value="ROLE_WAREHOUSE_MANAGER">ROLE_WAREHOUSE_MANAGER (Quản lý kho Desktop)</option>
                <option value="ROLE_ADMIN">ROLE_ADMIN (Quản trị viên tối cao)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Kho Phụ Trách</label>
              <select
                value={assignedWarehouse}
                onChange={(e) => setAssignedWarehouse(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500 cursor-pointer transition-all"
                disabled={isSubmitting}
              >
                <option value="Kho Tổng Tân Bình (ZONE A & B)">Kho Tổng Tân Bình (ZONE A & B)</option>
                <option value="Kho Mát 2-8°C (ZONE B)">Kho Mát 2-8°C (ZONE B)</option>
                <option value="Kho Khô & Điện Tử (ZONE A)">Kho Khô & Điện Tử (ZONE A)</option>
              </select>
            </div>
          </div>

          {/* Temporary Password */}
          <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-semibold text-[11px]">
                Mật Khẩu Khởi Tạo Ban Đầu
              </label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                disabled={isSubmitting}
                className="text-[10px] text-cyan-400 hover:underline font-mono"
              >
                + Tự động tạo ngẫu nhiên
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                value={tempPassword}
                onChange={(e) => setTempPassword(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-amber-300 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
            <p className="text-[10px] text-slate-500">
              Mật khẩu mặc định là <span className="font-mono text-amber-400">123456</span> hoặc mật khẩu bạn chỉ định trên. Mật khẩu được mã hóa BCrypt an toàn trong DB.
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors font-medium"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-purple-900/40 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
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
