import axios from 'axios';

export const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Tự động đính kèm JWT Token vào Header Authorization
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('smart_wms_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Bắt lỗi 401 Unauthorized và tự động đăng xuất
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('[AUTH] Phiên đăng nhập đã hết hạn hoặc không hợp lệ.');
      localStorage.removeItem('smart_wms_token');
      localStorage.removeItem('smart_wms_session');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
