import React, { useState, useEffect } from 'react';
import { Loader2, AlertTriangle, CheckCircle2, AlertCircle, X, RefreshCw } from 'lucide-react';
import { UsersHeader } from '../components/UsersHeader';
import { UserListTable } from '../components/UserListTable';
import { RbacMatrixTable } from '../components/RbacMatrixTable';
import { CreateUserModal } from '../components/CreateUserModal';
import { EditUserModal } from '../components/EditUserModal';
import { ResetPasswordModal } from '../components/ResetPasswordModal';
import { LockUserModal } from '../components/LockUserModal';
import { UserSecurityAuditModal } from '../components/UserSecurityAuditModal';
import { UserAccount, UpdateUserPayload } from '../types';
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
  const [toast, setToast] = useState<ToastState | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [resettingUser, setResettingUser] = useState<UserAccount | null>(null);
  const [lockingUser, setLockingUser] = useState<UserAccount | null>(null);
  const [auditUser, setAuditUser] = useState<UserAccount | null>(null);

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

  const handleAddUser = (newUser: UserAccount) => {
    setUsers((prev) => [newUser, ...prev]);
    setToast({
      type: 'success',
      message: `Khởi tạo tài khoản @${newUser.username} thành công vào PostgreSQL!`,
    });
  };

  const handleUpdateUser = async (userId: string, payload: UpdateUserPayload) => {
    const updated = await userService.updateUser(userId, payload);
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...updated } : u)));
    setToast({
      type: 'success',
      message: `Cập nhật thông tin tài khoản @${updated.username} thành công!`,
    });
  };

  const handleConfirmReset = async (userId: string, newPass: string) => {
    await userService.resetPassword(userId, newPass);
    setToast({
      type: 'success',
      message: `Đã cấp lại mật khẩu thành công! Mật khẩu mới: ${newPass}`,
    });
  };

  const handleConfirmToggleLock = async (userId: string, reason: string, forceLogout: boolean) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return;
    const nextActive = target.status !== 'ACTIVE';

    const updated = await userService.updateUserStatus(userId, nextActive);
    if (forceLogout && !nextActive) {
      try {
        await userService.forceLogout(userId);
      } catch (e) {
        console.warn('Force logout warning:', e);
      }
    }

    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: updated.status } : u)));
    setToast({
      type: 'success',
      message: nextActive
        ? `Đã kích hoạt mở khóa tài khoản @${target.username}.`
        : `Đã khóa tài khoản @${target.username} (${reason}).`,
    });
  };

  const handleForceLogoutFromAudit = async (userId: string) => {
    await userService.forceLogout(userId);
    setToast({
      type: 'success',
      message: 'Đã cưỡng chế đăng xuất (Force Logout) và thu hồi toàn bộ token của tài khoản!',
    });
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-medium shadow-md animate-in slide-in-from-top duration-200 ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : toast.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-indigo-50 border-indigo-200 text-indigo-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
            {toast.type === 'info' && <CheckCircle2 className="w-4 h-4 shrink-0 text-indigo-600" />}
            <span>{toast.message}</span>
          </div>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-700 p-1 rounded transition-colors">
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

      {/* Body Tab */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 flex flex-col items-center justify-center gap-3 shadow-xs">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-xs text-slate-500 font-mono">Đang đồng bộ danh sách tài khoản từ PostgreSQL database...</p>
        </div>
      ) : fetchError ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
          <p className="text-sm font-semibold text-rose-800">{fetchError}</p>
          <button
            onClick={fetchUsers}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Thử lại</span>
          </button>
        </div>
      ) : activeTab === 'ACCOUNTS' ? (
        <UserListTable
          users={users}
          onToggleStatus={(u) => setLockingUser(u)}
          onResetPassword={(u) => setResettingUser(u)}
          onEditUser={(u) => setEditingUser(u)}
          onViewSecurityLog={(u) => setAuditUser(u)}
        />
      ) : (
        <RbacMatrixTable />
      )}

      {/* Modals */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onAddUser={handleAddUser}
      />

      <EditUserModal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        user={editingUser}
        onUpdateUser={handleUpdateUser}
      />

      <ResetPasswordModal
        isOpen={!!resettingUser}
        onClose={() => setResettingUser(null)}
        user={resettingUser}
        onConfirmReset={handleConfirmReset}
      />

      <LockUserModal
        isOpen={!!lockingUser}
        onClose={() => setLockingUser(null)}
        user={lockingUser}
        onConfirmToggle={handleConfirmToggleLock}
      />

      <UserSecurityAuditModal
        isOpen={!!auditUser}
        onClose={() => setAuditUser(null)}
        user={auditUser}
        onForceLogout={handleForceLogoutFromAudit}
      />
    </div>
  );
};
