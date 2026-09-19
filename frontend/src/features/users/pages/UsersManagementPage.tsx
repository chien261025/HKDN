import React, { useState, useEffect } from 'react';
import { Loader2, AlertTriangle, CheckCircle2, AlertCircle, X, RefreshCw } from 'lucide-react';
import { UsersHeader } from '../components/UsersHeader';
import { UserListTable } from '../components/UserListTable';
import { RbacMatrixTable } from '../components/RbacMatrixTable';
import { CreateUserModal } from '../components/CreateUserModal';
import { UserAccount } from '../types';
import { userService } from '../services/userService';

interface ToastState {
  type: 'success' | 'error' | 'info';
  message: string;
}

export const UsersManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ACCOUNTS' | 'RBAC_MATRIX'>('ACCOUNTS');
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  // Auto-hide toast after 5s
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const fetchUsers = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await userService.getAllUsers();
      setUsers(data);
    } catch (err: any) {
      console.error('Lỗi tải danh sách người dùng:', err);
      setFetchError(err.message || 'Không thể tải danh sách tài khoản từ hệ thống!');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (userId: string) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;

    if (targetUser.username === 'admin' && targetUser.status === 'ACTIVE') {
      setToast({
        type: 'error',
        message: 'Không thể khóa tài khoản Quản trị viên tối cao (root admin)!',
      });
      return;
    }

    const nextActive = targetUser.status !== 'ACTIVE';
    try {
      const updatedUser = await userService.updateUserStatus(userId, nextActive);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: updatedUser.status } : u))
      );
      setToast({
        type: 'success',
        message: nextActive
          ? `Đã mở khóa tài khoản @${targetUser.username} thành công.`
          : `Đã tạm khóa tài khoản @${targetUser.username}. Người dùng không thể đăng nhập.`,
      });
    } catch (err: any) {
      console.error('Lỗi đổi trạng thái:', err);
      setToast({
        type: 'error',
        message: err.message || 'Lỗi khi cập nhật trạng thái tài khoản!',
      });
    }
  };

  const handleResetPassword = async (user: UserAccount) => {
    const confirm = window.confirm(
      `Xác nhận đặt lại mật khẩu cho tài khoản @${user.username} (${user.fullName}) về mật khẩu mặc định "123456"?`
    );
    if (!confirm) return;

    try {
      await userService.resetPassword(user.id, '123456');
      setToast({
        type: 'success',
        message: `Đã đặt lại mật khẩu cho @${user.username} thành công! Mật khẩu mới: 123456`,
      });
    } catch (err: any) {
      console.error('Lỗi reset mật khẩu:', err);
      setToast({
        type: 'error',
        message: err.message || 'Lỗi khi khôi phục mật khẩu!',
      });
    }
  };

  const handleAddUser = (newUser: UserAccount) => {
    setUsers((prev) => [newUser, ...prev]);
    setToast({
      type: 'success',
      message: `Khởi tạo tài khoản @${newUser.username} thành công vào PostgreSQL!`,
    });
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-medium shadow-xl animate-in slide-in-from-top duration-200 ${
            toast.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : toast.type === 'error'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />}
            {toast.type === 'info' && <CheckCircle2 className="w-4 h-4 shrink-0 text-cyan-400" />}
            <span>{toast.message}</span>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Banner & Security KPI */}
      <UsersHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        users={users}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
      />

      {/* Loading state */}
      {loading ? (
        <div className="bg-[#0b101d]/90 backdrop-blur-xl rounded-2xl border border-slate-800 p-12 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          <p className="text-xs text-slate-400 font-mono">Đang đồng bộ danh sách tài khoản từ PostgreSQL database...</p>
        </div>
      ) : fetchError ? (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-6 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
          <p className="text-sm font-semibold text-rose-300">{fetchError}</p>
          <button
            onClick={fetchUsers}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Thử lại</span>
          </button>
        </div>
      ) : (
        /* Body Tab */
        activeTab === 'ACCOUNTS' ? (
          <UserListTable
            users={users}
            onToggleStatus={handleToggleStatus}
            onResetPassword={handleResetPassword}
          />
        ) : (
          <RbacMatrixTable />
        )
      )}

      {/* Create Modal */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onAddUser={handleAddUser}
      />
    </div>
  );
};
