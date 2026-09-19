import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const location = useLocation();
  const session = authService.getCurrentSession();
  const token = localStorage.getItem('smart_wms_token');

  // 1. Kiểm tra nếu chưa đăng nhập hoặc không có token
  if (!session || !token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // 2. Kiểm tra nếu token/session đã hết hạn
  if (session.expiresAt && new Date(session.expiresAt).getTime() <= Date.now()) {
    localStorage.removeItem('smart_wms_token');
    localStorage.removeItem('smart_wms_session');
    return <Navigate to="/login" replace state={{ from: location, expired: true }} />;
  }

  // 3. Kiểm tra phân quyền vai trò nếu có yêu cầu allowedRoles
  if (allowedRoles && allowedRoles.length > 0) {
    const hasPermission = allowedRoles.includes(session.role as UserRole);
    if (!hasPermission) {
      // Nếu là Thủ kho cố tình vào màn hình quản lý, đưa về trang Operator
      if (session.role === 'ROLE_OPERATOR') {
        return <Navigate to="/operator" replace />;
      }
      // Ngược lại nếu không đủ quyền, đưa về trang chủ
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};
