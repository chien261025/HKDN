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
  }
};
