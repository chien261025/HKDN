import axios from 'axios';
import { apiClient } from '../../../services/api';
import { AuthSession, UserRole } from '../types';
import { getRealLocation } from './geolocationService';

export interface LoginPayload {
  username: string;
  password: string;
  clientLocation?: string;
  clientIp?: string;
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

const getErrorMessage = (err: unknown, fallback: string): string => {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.message || err.message || fallback;
  }
  return err instanceof Error ? err.message : fallback;
};

export const authService = {
  /**
   * Gọi API đăng nhập backend để nhận JWT Token
   */
  async login(payload: LoginPayload, warehouse?: string): Promise<AuthTokenData> {
    const response = await apiClient.post<ApiResponse<AuthTokenData>>('/auth/login', {
      ...payload,
      clientLocation: payload.clientLocation,
      clientIp: payload.clientIp,
    });
    
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
      role: data.role as UserRole,
      warehouse: warehouse || 'Kho Tổng Tân Bình (ZONE A & B)',
      expiresAt: new Date(Date.now() + (data.expiresIn || 86400000)).toISOString(),
    };
    
    localStorage.setItem('smart_wms_session', JSON.stringify(session));

    // Cập nhật vị trí GPS/IP thực tế trong nền sau khi đã vào hệ thống
    setTimeout(() => {
      getRealLocation().then(async (geo) => {
        if (geo.locationName) {
          await apiClient.put('/users/me/sessions/current-location', {
            location: geo.locationName,
            ip: geo.ipAddress
          }).catch(() => {});
        }
      }).catch(() => {});
    }, 1000);

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
      role: data.role as UserRole,
      warehouse: warehouse || 'Kho Tổng Tân Bình (ZONE A & B)',
      expiresAt: new Date(Date.now() + (data.expiresIn || 86400000)).toISOString(),
    };
    
    localStorage.setItem('smart_wms_session', JSON.stringify(session));

    return data;
  },

  /**
   * Đăng xuất khỏi hệ thống và hủy phiên trên server
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (err) {
      console.warn('[AUTH] Đăng xuất ngoại tuyến hoặc server không phản hồi:', err);
    } finally {
      localStorage.removeItem('smart_wms_token');
      localStorage.removeItem('smart_wms_session');
      window.location.href = '/login?logged_out=true';
    }
  },

  /**
   * Kiểm tra phiên đăng nhập hiện tại có bị thu hồi từ xa không
   */
  async checkSessionStatus(): Promise<{ active: boolean; reason?: string; maxConcurrentDevices: number }> {
    try {
      const res = await apiClient.get<ApiResponse<{ active: boolean; reason?: string; maxConcurrentDevices: number }>>('/auth/session-status');
      return res.data.data;
    } catch {
      return { active: true, maxConcurrentDevices: 2 };
    }
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
   * Yêu cầu backend gửi mã xác thực OTP qua Email thực tế
   */
  async sendForgotPasswordOtp(identifier: string): Promise<{ email: string; emailSent: boolean; expiresInSeconds: number }> {
    try {
      const res = await apiClient.post<ApiResponse<{ email: string; emailSent: boolean; expiresInSeconds: number }>>('/auth/forgot-password/send-otp', {
        identifier: identifier.trim(),
      });
      if (!res.data.success || !res.data.data) {
        throw new Error(res.data.message || 'Không thể gửi mã xác thực');
      }
      return res.data.data;
    } catch (err: unknown) {
      throw new Error(getErrorMessage(err, 'Không thể gửi mã xác thực'));
    }
  },

  /**
   * Kiểm tra mã xác thực OTP với backend
   */
  async verifyForgotPasswordOtp(identifier: string, otpCode: string): Promise<boolean> {
    try {
      const res = await apiClient.post<ApiResponse<boolean>>('/auth/forgot-password/verify-otp', {
        identifier: identifier.trim(),
        otpCode: otpCode.trim(),
      });
      if (!res.data.success) {
        throw new Error(res.data.message || 'Mã OTP không chính xác!');
      }
      return true;
    } catch (err: unknown) {
      throw new Error(getErrorMessage(err, 'Mã OTP không chính xác hoặc đã hết hạn!'));
    }
  },

  /**
   * Đặt lại mật khẩu sau khi xác thực OTP thành công
   */
  async resetForgottenPassword(identifier: string, newPassword: string, otpCode?: string): Promise<string> {
    try {
      const res = await apiClient.post<ApiResponse<string>>('/auth/forgot-password/reset', {
        identifier: identifier.trim(),
        newPassword: newPassword.trim(),
        otpCode: otpCode?.trim(),
      });
      if (!res.data.success) {
        throw new Error(res.data.message || 'Không thể đặt lại mật khẩu');
      }
      return res.data.message;
    } catch (err: unknown) {
      throw new Error(getErrorMessage(err, 'Không thể đặt lại mật khẩu'));
    }
  },

  /**
   * Kiểm tra trạng thái tạm khóa của tài khoản, IP hoặc Thiết bị
   */
  async checkLockout(username?: string, deviceFingerprint?: string): Promise<{ blocked: boolean; remainingSeconds: number; lockLevel?: number; clientIp?: string }> {
    try {
      const res = await apiClient.get<ApiResponse<{ blocked: boolean; remainingSeconds: number; lockLevel?: number; clientIp?: string }>>('/auth/lockout-status', {
        params: {
          username: username?.trim(),
          deviceFingerprint: deviceFingerprint || undefined
        }
      });
      return res.data.data || { blocked: false, remainingSeconds: 0 };
    } catch {
      return { blocked: false, remainingSeconds: 0 };
    }
  }
};
