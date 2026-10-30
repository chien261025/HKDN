import { apiClient } from '../../../services/api';
import { UserAccount, UserRole, UserStatus, BackendUserResponse } from '../types';

export interface CreateUserPayload {
  username: string;
  password: string;
  fullName: string;
  email: string;
  role: string;
  expiresAt?: string | null;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

/** Helper map từ backend user model sang frontend user account view model */
export const mapBackendUserToAccount = (
  u: BackendUserResponse,
  overrides?: Partial<UserAccount>
): UserAccount => ({
  id: String(u.id),
  username: u.username,
  fullName: overrides?.fullName || u.fullName,
  email: overrides?.email || u.email,
  phone: overrides?.phone || ('09' + String(u.id).padStart(8, '0')),
  role: (overrides?.role as UserRole) || (u.role as UserRole) || 'ROLE_OPERATOR',
  assignedWarehouse: overrides?.assignedWarehouse || u.assignedWarehouse || 'Kho Tổng Tân Bình (ZONE A & B)',
  status: (overrides?.status as UserStatus) || (u.status as UserStatus) || (u.isExpired ? 'EXPIRED' : (u.isActive ? 'ACTIVE' : 'LOCKED')),
  expiresAt: u.expiresAt ? new Date(u.expiresAt).toLocaleDateString('vi-VN') : null,
  rawExpiresAt: u.expiresAt || null,
  isExpired: Boolean(u.isExpired),
  lastLoginAt: u.updatedAt ? new Date(u.updatedAt).toLocaleString('vi-VN') : 'Vừa cập nhật',
  lastLoginIp: '192.168.1.10' + (u.id % 10),
  createdAt: u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : 'Hôm nay',
});

export const userService = {
  /**
   * Lấy danh sách tất cả tài khoản từ cơ sở dữ liệu
   */
  async getAllUsers(): Promise<UserAccount[]> {
    const res = await apiClient.get<ApiResponse<BackendUserResponse[]>>('/users');
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Không thể tải danh sách tài khoản');
    }

    return res.data.data.map(u => mapBackendUserToAccount(u));
  },

  /**
   * Admin tạo người dùng mới
   */
  async createUser(payload: CreateUserPayload): Promise<UserAccount> {
    const res = await apiClient.post<ApiResponse<BackendUserResponse>>('/users', payload);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Không thể tạo người dùng mới');
    }

    return mapBackendUserToAccount(res.data.data, {
      fullName: payload.fullName,
      email: payload.email,
      role: payload.role as UserRole,
    });
  },

  /**
   * Khóa hoặc Mở khóa tài khoản
   */
  /**
   * Khóa hoặc Mở khóa hàng loạt tài khoản (Bulk Inactivation / Activation)
   */
  async bulkUpdateStatus(userIds: string[], isActive: boolean): Promise<string> {
    const res = await apiClient.put<ApiResponse<string>>('/users/bulk-status', {
      userIds: userIds.map(Number),
      isActive,
    });
    if (!res.data.success) {
      throw new Error(res.data.message || 'Không thể cập nhật trạng thái hàng loạt');
    }
    return res.data.message;
  },

  async updateUserStatus(id: string, isActive: boolean): Promise<UserAccount> {
    const res = await apiClient.put<ApiResponse<BackendUserResponse>>(`/users/${id}/status`, { isActive });
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Không thể cập nhật trạng thái');
    }

    return mapBackendUserToAccount(res.data.data, {
      status: isActive ? 'ACTIVE' : 'LOCKED',
    });
  },

  /**
   * Cập nhật vai trò RBAC
   */
  async updateUserRole(id: string, role: string): Promise<UserAccount> {
    const res = await apiClient.put<ApiResponse<BackendUserResponse>>(`/users/${id}/role`, { role });
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Không thể cập nhật vai trò');
    }

    return mapBackendUserToAccount(res.data.data, {
      role: role as UserRole,
    });
  },

  /**
   * Đặt lại mật khẩu tài khoản
   */
  async resetPassword(id: string, newPassword?: string, mustChangePassword: boolean = false): Promise<string> {
    const res = await apiClient.put<ApiResponse<string>>(`/users/${id}/reset-password`, {
      newPassword: newPassword || '123456',
      mustChangePassword,
    });
    if (!res.data.success) {
      throw new Error(res.data.message || 'Không thể khôi phục mật khẩu');
    }
    return res.data.message;
  },

  /**
   * Người dùng tự đổi mật khẩu cá nhân
   */
  async changePassword(payload: { username: string; currentPassword: string; newPassword: string }): Promise<string> {
    const res = await apiClient.put<ApiResponse<void>>('/users/change-password', payload);
    if (!res.data.success) {
      throw new Error(res.data.message || 'Không thể đổi mật khẩu');
    }
    return res.data.message;
  },

  /**
   * Admin cập nhật thông tin và vai trò người dùng
   */
  async updateUser(id: string, payload: import('../types').UpdateUserPayload): Promise<UserAccount> {
    const res = await apiClient.put<ApiResponse<BackendUserResponse>>(`/users/${id}`, payload);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Không thể cập nhật thông tin người dùng');
    }

    return mapBackendUserToAccount(res.data.data, {
      fullName: payload.fullName,
      email: payload.email,
      phone: payload.phone,
      assignedWarehouse: payload.assignedWarehouse,
      role: payload.role as UserRole,
    });
  },

  /**
   * Cưỡng chế hủy phiên đăng nhập (Force Logout)
   */
  async forceLogout(id: string): Promise<string> {
    const res = await apiClient.post<ApiResponse<string>>(`/users/${id}/force-logout`);
    if (!res.data.success) {
      throw new Error(res.data.message || 'Không thể cưỡng chế đăng xuất');
    }
    return res.data.message;
  },

  /**
   * Lấy lịch sử an ninh và nhật ký đăng nhập
   */
  async getUserSecurityLog(id: string): Promise<import('../types').UserSecurityLog> {
    const res = await apiClient.get<ApiResponse<import('../types').UserSecurityLog>>(`/users/${id}/security-log`);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Không thể tải nhật ký an ninh');
    }
    return res.data.data;
  },

  /**
   * Lấy danh sách thiết bị đang đăng nhập của tài khoản
   */
  async getUserSessions(userId: string): Promise<import('../types').UserDeviceSession[]> {
    const res = await apiClient.get<ApiResponse<import('../types').UserDeviceSession[]>>(`/users/${userId}/sessions`);
    if (!res.data.success || !res.data.data) {
      return [];
    }
    return res.data.data;
  },

  /**
   * Đăng xuất từ xa một thiết bị cụ thể
   */
  async revokeDeviceSession(userId: string, sessionId: string): Promise<void> {
    const res = await apiClient.delete<ApiResponse<string>>(`/users/${userId}/sessions/${sessionId}`);
    if (!res.data.success) {
      throw new Error(res.data.message || 'Không thể đăng xuất thiết bị');
    }
  },

  /**
   * Đăng xuất khỏi tất cả các thiết bị khác
   */
  async revokeOtherDeviceSessions(userId: string): Promise<void> {
    const res = await apiClient.delete<ApiResponse<string>>(`/users/${userId}/sessions/others`);
    if (!res.data.success) {
      throw new Error(res.data.message || 'Không thể đăng xuất các thiết bị khác');
    }
  },

  /**
   * Lấy danh sách thiết bị của phiên đăng nhập hiện tại
   */
  async getMySessions(): Promise<import('../types').UserDeviceSession[]> {
    const res = await apiClient.get<ApiResponse<import('../types').UserDeviceSession[]>>('/users/me/sessions');
    if (!res.data.success || !res.data.data) {
      return [];
    }
    return res.data.data;
  },

  /**
   * Đăng xuất phiên làm việc của một thiết bị cá nhân
   */
  async revokeMySession(sessionId: string): Promise<void> {
    const res = await apiClient.delete<ApiResponse<string>>(`/users/me/sessions/${sessionId}`);
    if (!res.data.success) {
      throw new Error(res.data.message || 'Không thể đăng xuất thiết bị');
    }
  },

  /**
   * Đăng xuất khỏi tất cả các thiết bị khác của chính mình
   */
  async revokeMyOtherSessions(): Promise<void> {
    const res = await apiClient.delete<ApiResponse<string>>('/users/me/sessions/others');
    if (!res.data.success) {
      throw new Error(res.data.message || 'Không thể đăng xuất các thiết bị khác');
    }
  },

  /**
   * Cập nhật vị trí GPS/IP thực tế của phiên hiện tại
   */
  async updateCurrentLocation(payload: { location: string; ip: string }): Promise<void> {
    await apiClient.put('/users/me/sessions/current-location', payload);
  },
};


