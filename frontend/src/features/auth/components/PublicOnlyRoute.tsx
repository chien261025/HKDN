import React from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/authService';

interface PublicOnlyRouteProps {
  children: React.ReactNode;
}

export const PublicOnlyRoute: React.FC<PublicOnlyRouteProps> = ({ children }) => {
  const session = authService.getCurrentSession();
  const token = localStorage.getItem('smart_wms_token');

  // Nếu đã đăng nhập và phiên còn hạn, tự động đưa vào màn hình tương ứng
  if (session && token) {
    const isExpired = session.expiresAt && new Date(session.expiresAt).getTime() <= Date.now();
    if (!isExpired) {
      if (session.role === 'ROLE_OPERATOR') {
        return <Navigate to="/operator" replace />;
      }
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};
