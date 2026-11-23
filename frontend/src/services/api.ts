import axios from 'axios';
import { STORAGE_KEYS, APP_CONFIG } from '../constants';
import { getDeviceFingerprint } from '../features/auth/utils/deviceFingerprint';

export const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: APP_CONFIG.API_TIMEOUT_MS,
});

// Request Interceptor: Tự động đính kèm Device Fingerprint và JWT Token
apiClient.interceptors.request.use(
  (config) => {
    config.headers['X-Device-Fingerprint'] = getDeviceFingerprint();
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Bắt lỗi 401 Unauthorized và tự động đăng xuất, chuẩn hóa thông báo lỗi từ backend
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const hadAuthHeader = !!error.config?.headers?.Authorization;
    if (error.response?.status === 401 && hadAuthHeader) {
      console.warn('[AUTH] Phiên đăng nhập đã hết hạn hoặc không hợp lệ.');
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
      localStorage.removeItem(STORAGE_KEYS.SESSION);
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // Tự động giải nén thông điệp lỗi nghiệp vụ từ backend thay vì hiển thị "Request failed with status code 400"
    if (error.response?.data?.message) {
      error.message = error.response.data.message;
    }

    return Promise.reject(error);
  }
);
