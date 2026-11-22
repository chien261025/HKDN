import React, { useState, useEffect } from 'react';
import { Loader2, AlertTriangle, CheckCircle2, AlertCircle, X, RefreshCw, Users, Smartphone, ShieldCheck } from 'lucide-react';
import { UsersHeader, UserKpiFilter } from '../components/UsersHeader';
import { UserListTable } from '../components/UserListTable';
import { CreateUserModal } from '../components/CreateUserModal';
import { EditUserModal } from '../components/EditUserModal';
import { ResetPasswordModal } from '../components/ResetPasswordModal';
import { LockUserModal } from '../components/LockUserModal';
import { UserSecurityAuditModal } from '../components/UserSecurityAuditModal';
import { RbacMatrixModal } from '../components/RbacMatrixModal';
import { UserDetailModal } from '../components/UserDetailModal';
import { PdaDeviceManagerTab } from '../components/PdaDeviceManagerTab';
import { UserAccount, UpdateUserPayload } from '../types';
import { userService, setStoredLockInfo, removeStoredLockInfo } from '../services/userService';
import { authService } from '../../auth/services/authService';

interface ToastState {
  type: 'success' | 'error' | 'info';
  message: string;
}

export const UsersManagementPage: React.FC = () => {
  const session = authService.getCurrentSession();
  const isAdmin = session?.role === 'ROLE_ADMIN';

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
  const [viewingDetailUser, setViewingDetailUser] = useState<UserAccount | null>(null);
  const [isRbacMatrixOpen, setIsRbacMatrixOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'USERS' | 'DEVICES'>('USERS');
  const [kpiFilter, setKpiFilter] = useState<UserKpiFilter>('ALL');

  const handleSelectKpiFilter = (filter: UserKpiFilter) => {
    setKpiFilter((prev) => (prev === filter ? 'ALL' : filter));
  };

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
      message: `Tạo tài khoản @${newUser.username} thành công!`,
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

  const handleConfirmReset = async (userId: string, newPass: string, forceChangeOnLogin: boolean) => {
    await userService.resetPassword(userId, newPass, forceChangeOnLogin);
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

    if (!nextActive) {
      setStoredLockInfo(userId, reason);
    } else {
      removeStoredLockInfo(userId);
    }

    const updatedAccountFields = {
      status: updated.status,
      lockReason: !nextActive ? reason : undefined,
      lockedAt: !nextActive ? new Date().toLocaleString('vi-VN') : undefined,
      lockedBy: !nextActive ? 'Nguyễn Quản Trị (@admin)' : undefined,
    };

    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, ...updatedAccountFields } : u))
    );
    setViewingDetailUser((prev) =>
      prev && prev.id === userId ? { ...prev, ...updatedAccountFields } : prev
    );

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
      message: 'Đã đăng xuất toàn bộ phiên hoạt động của tài khoản!',
    });
  };

  const handleBulkStatus = async (selectedIds: string[], isActive: boolean) => {
    try {
      const msg = await userService.bulkUpdateStatus(selectedIds, isActive);
      const targetIds = new Set(selectedIds);

      if (!isActive) {
        selectedIds.forEach((id) => setStoredLockInfo(id, 'Khóa hàng loạt bởi quản trị viên'));
      } else {
        selectedIds.forEach((id) => removeStoredLockInfo(id));
      }

      setUsers((prev) =>
        prev.map((u) => {
          if (targetIds.has(u.id)) {
            return {
              ...u,
              status: isActive ? 'ACTIVE' : 'LOCKED',
              lockReason: !isActive ? 'Khóa hàng loạt bởi quản trị viên' : undefined,
              lockedAt: !isActive ? new Date().toLocaleString('vi-VN') : undefined,
              lockedBy: !isActive ? 'Nguyễn Quản Trị (@admin)' : undefined,
            };
          }
          return u;
        })
      );
      setToast({
        type: 'success',
        message: msg || `Đã ${isActive ? 'mở khóa' : 'khóa'} thành công ${selectedIds.length} tài khoản!`,
      });
    } catch (err: any) {
      console.error('Lỗi thao tác hàng loạt:', err);
      setToast({
        type: 'error',
        message: err.message || 'Không thể cập nhật trạng thái hàng loạt!',
      });
    }
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
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-700 p-1 rounded transition-colors cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Banner & Personnel KPI Cards */}
      <UsersHeader
        users={users}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        selectedFilter={kpiFilter}
        onSelectFilter={handleSelectKpiFilter}
        isAdmin={isAdmin}
      />

      {/* Navigation Tab Bar: Tài Khoản & Máy Quét PDA Tin Cậy */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 bg-white px-4 rounded-2xl shadow-xs gap-3 py-1">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('USERS')}
            className={`py-3 px-3.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'USERS'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Tài Khoản Nhân Sự ({users.length})</span>
          </button>
          <button
            data-testid="tab-pda-devices"
            onClick={() => setActiveTab('DEVICES')}
            className={`py-3 px-3.5 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'DEVICES'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Máy Quét PDA & Thiết Bị Tin Cậy</span>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          </button>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsRbacMatrixOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 self-start sm:self-auto bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Ma Trận Phân Quyền Hệ Thống</span>
          </button>
        )}
      </div>

      {/* Nội dung Tab */}
      {activeTab === 'DEVICES' ? (
        <PdaDeviceManagerTab />
      ) : loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 flex flex-col items-center justify-center gap-3 shadow-xs">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Đang tải danh sách tài khoản...</p>
        </div>
      ) : fetchError ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
          <p className="text-sm font-semibold text-rose-800">{fetchError}</p>
          <button
            onClick={fetchUsers}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Thử lại</span>
          </button>
        </div>
      ) : (
        <UserListTable
          users={users}
          onToggleStatus={(u) => setLockingUser(u)}
          onResetPassword={(u) => setResettingUser(u)}
          onEditUser={(u) => setEditingUser(u)}
          onViewSecurityLog={(u) => setAuditUser(u)}
          onViewDetail={(u) => setViewingDetailUser(u)}
          onBulkStatus={handleBulkStatus}
          onOpenRbacMatrix={isAdmin ? () => setIsRbacMatrixOpen(true) : undefined}
          kpiFilter={kpiFilter}
          onClearKpiFilter={() => setKpiFilter('ALL')}
          isAdmin={isAdmin}
        />
      )}

      {/* Modals */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onAddUser={handleAddUser}
        existingUsers={users}
        isAdmin={isAdmin}
      />

      <EditUserModal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        user={editingUser}
        onUpdateUser={handleUpdateUser}
        isAdmin={isAdmin}
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

      <RbacMatrixModal
        isOpen={isRbacMatrixOpen}
        onClose={() => setIsRbacMatrixOpen(false)}
      />

      <UserDetailModal
        isOpen={!!viewingDetailUser}
        onClose={() => setViewingDetailUser(null)}
        user={viewingDetailUser}
        onEditUser={(u) => setEditingUser(u)}
        onResetPassword={(u) => setResettingUser(u)}
        onToggleStatus={(u) => setLockingUser(u)}
        onViewSecurityLog={(u) => setAuditUser(u)}
        isAdmin={isAdmin}
      />
    </div>
  );
};
