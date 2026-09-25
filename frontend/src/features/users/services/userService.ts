import { apiClient } from '../../../services/api';
import { UserAccount, UserRole, UserStatus, BackendUserResponse } from '../types';

export interface CreateUserPayload {
  username: string;
  password: string;
  fullName: string;
  email: string;
  role: string;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export const userService = {
  /**
   * Lấy danh sách tất cả tài khoản từ cơ sở dữ liệu
   */
  async getAllUsers(): Promise<UserAccount[]> {
    const res = await apiClient.get<ApiResponse<BackendUserResponse[]>>('/users');
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Không thể tải danh sách tài khoản');
    }

    return res.data.data.map((u) => ({
      id: String(u.id),
      username: u.username,
      fullName: u.fullName,
      email: u.email,
      phone: '09' + String(u.id).padStart(8, '0'),
      role: (u.role as UserRole) || 'ROLE_OPERATOR',
      assignedWarehouse: u.assignedWarehouse || 'Kho Tổng Tân Bình (ZONE A & B)',
      status: (u.status as UserStatus) || (u.isActive ? 'ACTIVE' : 'LOCKED'),
      lastLoginAt: u.updatedAt ? new Date(u.updatedAt).toLocaleString('vi-VN') : 'Mới khởi tạo',
      lastLoginIp: '192.168.1.10' + (u.id % 10),
      createdAt: u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : 'Hôm nay',
    }));
  },

  /**
   * Admin tạo người dùng mới
   */
  async createUser(payload: CreateUserPayload): Promise<UserAccount> {
    const res = await apiClient.post<ApiResponse<BackendUserResponse>>('/users', payload);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Không thể tạo người dùng mới');
    }

    const u = res.data.data;
    return {
      id: String(u.id),
      username: u.username,
      fullName: u.fullName,
      email: u.email,
      phone: '09' + String(u.id).padStart(8, '0'),
      role: (u.role as UserRole) || 'ROLE_OPERATOR',
      assignedWarehouse: u.assignedWarehouse || 'Kho Tổng Tân Bình (ZONE A & B)',
      status: (u.status as UserStatus) || 'ACTIVE',
      lastLoginAt: 'Vừa tạo mới',
      lastLoginIp: '192.168.1.100',
      createdAt: new Date().toLocaleDateString('vi-VN'),
    };
  },

  /**
   * Khóa hoặc Mở khóa tài khoản
   */
  async updateUserStatus(id: string, isActive: boolean): Promise<UserAccount> {
    const res = await apiClient.put<ApiResponse<BackendUserResponse>>(`/users/${id}/status`, { isActive });
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Không thể cập nhật trạng thái');
    }

    const u = res.data.data;
    return {
      id: String(u.id),
      username: u.username,
      fullName: u.fullName,
      email: u.email,
      phone: '09' + String(u.id).padStart(8, '0'),
      role: (u.role as UserRole) || 'ROLE_OPERATOR',
      assignedWarehouse: u.assignedWarehouse || 'Kho Tổng Tân Bình (ZONE A & B)',
      status: u.isActive ? 'ACTIVE' : 'LOCKED',
      lastLoginAt: u.updatedAt ? new Date(u.updatedAt).toLocaleString('vi-VN') : 'Vừa cập nhật',
      lastLoginIp: '192.168.1.10' + (u.id % 10),
      createdAt: u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : 'Hôm nay',
    };
  },

  /**
   * Cập nhật vai trò RBAC
   */
  async updateUserRole(id: string, role: string): Promise<UserAccount> {
    const res = await apiClient.put<ApiResponse<BackendUserResponse>>(`/users/${id}/role`, { role });
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Không thể cập nhật vai trò');
    }

    const u = res.data.data;
    return {
      id: String(u.id),
      username: u.username,
      fullName: u.fullName,
      email: u.email,
      phone: '09' + String(u.id).padStart(8, '0'),
      role: (u.role as UserRole) || 'ROLE_OPERATOR',
      assignedWarehouse: u.assignedWarehouse || 'Kho Tổng Tân Bình (ZONE A & B)',
      status: u.isActive ? 'ACTIVE' : 'LOCKED',
      lastLoginAt: u.updatedAt ? new Date(u.updatedAt).toLocaleString('vi-VN') : 'Vừa cập nhật',
      lastLoginIp: '192.168.1.10' + (u.id % 10),
      createdAt: u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : 'Hôm nay',
    };
  },

  /**
   * Đặt lại mật khẩu tài khoản
   */
  async resetPassword(id: string, newPassword?: string): Promise<string> {
    const res = await apiClient.put<ApiResponse<string>>(`/users/${id}/reset-password`, { newPassword: newPassword || '123456' });
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

    const u = res.data.data;
    return {
      id: String(u.id),
      username: u.username,
      fullName: u.fullName,
      email: u.email,
      phone: payload.phone || ('09' + String(u.id).padStart(8, '0')),
      role: (u.role as UserRole) || 'ROLE_OPERATOR',
      assignedWarehouse: payload.assignedWarehouse || u.assignedWarehouse || 'Kho Tổng Tân Bình (ZONE A & B)',
      status: u.isActive ? 'ACTIVE' : 'LOCKED',
      lastLoginAt: u.updatedAt ? new Date(u.updatedAt).toLocaleString('vi-VN') : 'Vừa cập nhật',
      lastLoginIp: '192.168.1.10' + (u.id % 10),
      createdAt: u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : 'Hôm nay',
    };
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
};


