import { apiClient } from '../../../services/api';
import { AuthSession } from '../types';

export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  password: string;
  fullName: string;
  email: string;
  role?: string;
}

export interface AuthTokenData {
  accessToken: string;
  tokenType: string;
  username: string;
  fullName: string;
  role: string;
  expiresIn: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export const authService = {
  /**
   * Gọi API đăng nhập backend để nhận JWT Token
   */
  async login(payload: LoginPayload, warehouse?: string): Promise<AuthTokenData> {
    const response = await apiClient.post<ApiResponse<AuthTokenData>>('/auth/login', payload);
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Đăng nhập không thành công!');
    }

    const data = response.data.data;

    // Lưu Token và phiên làm việc vào localStorage
    localStorage.setItem('smart_wms_token', data.accessToken);
    
    const session: AuthSession = {
      token: data.accessToken,
      username: data.username,
      fullName: data.fullName,
      role: data.role as any,
      warehouse: warehouse || 'Kho Tổng Tân Bình (ZONE A & B)',
      expiresAt: new Date(Date.now() + (data.expiresIn || 86400000)).toISOString(),
    };
    
    localStorage.setItem('smart_wms_session', JSON.stringify(session));

    return data;
  },

  /**
   * Gọi API đăng ký backend để tạo tài khoản mới và nhận JWT Token
   */
  async register(payload: RegisterPayload, warehouse?: string): Promise<AuthTokenData> {
    const response = await apiClient.post<ApiResponse<AuthTokenData>>('/auth/register', payload);
    
    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.message || 'Đăng ký không thành công!');
    }

    const data = response.data.data;

    // Lưu Token và phiên làm việc vào localStorage
    localStorage.setItem('smart_wms_token', data.accessToken);
    
    const session: AuthSession = {
      token: data.accessToken,
      username: data.username,
      fullName: data.fullName,
      role: data.role as any,
      warehouse: warehouse || 'Kho Tổng Tân Bình (ZONE A & B)',
      expiresAt: new Date(Date.now() + (data.expiresIn || 86400000)).toISOString(),
    };
    
    localStorage.setItem('smart_wms_session', JSON.stringify(session));

    return data;
  },

  /**
   * Đăng xuất khỏi hệ thống
   */
  logout(): void {
    localStorage.removeItem('smart_wms_token');
    localStorage.removeItem('smart_wms_session');
    window.location.href = '/login';
  },

  /**
   * Lấy thông tin phiên làm việc hiện tại
   */
  getCurrentSession(): AuthSession | null {
    const sessionStr = localStorage.getItem('smart_wms_session');
    if (!sessionStr) return null;
    try {
      const session: AuthSession = JSON.parse(sessionStr);
      if (session && session.fullName && session.fullName.includes('?')) {
        if (session.username === 'manager01' || session.role === 'ROLE_WAREHOUSE_MANAGER') {
          session.fullName = 'Trần Trưởng Kho';
        } else if (session.username === 'admin' || session.role === 'ROLE_ADMIN') {
          session.fullName = 'Nguyễn Quản Trị';
        } else if (session.username === 'operator01' || session.role === 'ROLE_OPERATOR') {
          session.fullName = 'Lê Thủ Kho';
        } else {
          session.fullName = session.fullName.replace(/\?+/g, '').trim() || session.username;
        }
        localStorage.setItem('smart_wms_session', JSON.stringify(session));
      }
      return session;
    } catch {
      return null;
    }
  },

  /**
   * Lấy danh sách tài khoản demo từ backend
   */
  async getDemoAccounts() {
    try {
      const res = await apiClient.get<ApiResponse<Array<{ username: string; password: string; role: string; desc: string }>>>('/auth/demo-accounts');
      return res.data.data;
    } catch (err) {
      console.warn('Không thể tải tài khoản demo từ backend, sử dụng danh sách mặc định:', err);
      return null;
    }
  },

  /**
   * Lấy tên đăng nhập đã ghi nhớ
   */
  getRememberedUsername(): string {
    return localStorage.getItem('smart_wms_remembered_username') || '';
  },

  /**
   * Lưu hoặc xóa tên đăng nhập đã ghi nhớ
   */
  setRememberedUsername(username: string, remember: boolean): void {
    if (remember && username.trim()) {
      localStorage.setItem('smart_wms_remembered_username', username.trim());
      localStorage.setItem('smart_wms_remember_me', 'true');
    } else {
      localStorage.removeItem('smart_wms_remembered_username');
      localStorage.removeItem('smart_wms_remember_me');
    }
  },

  /**
   * Kiểm tra người dùng có bật ghi nhớ không
   */
  isRemembered(): boolean {
    return localStorage.getItem('smart_wms_remember_me') === 'true';
  },

  /**
   * Đặt lại mật khẩu sau khi xác thực OTP thành công
   */
  async resetForgottenPassword(identifier: string, newPassword: string): Promise<string> {
    const res = await apiClient.post<ApiResponse<string>>('/auth/forgot-password/reset', {
      identifier: identifier.trim(),
      newPassword: newPassword.trim(),
    });
    if (!res.data.success) {
      throw new Error(res.data.message || 'Không thể đặt lại mật khẩu');
    }
    return res.data.message;
  }
};
