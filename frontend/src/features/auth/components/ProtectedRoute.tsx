import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import { UserRole } from '../types';
import { isRouteAllowedForRole } from '../../users/data/rbacModulesData';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  routePath?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles, routePath }) => {
  const location = useLocation();
  const session = authService.getCurrentSession();
  const token = localStorage.getItem('smart_wms_token');

  // 1. Kiểm tra nếu chưa đăng nhập hoặc không có token
  if (!session || !token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // 1b. Kiểm tra nếu tài khoản đang yêu cầu bắt buộc đổi mật khẩu lần đầu
  if (session.mustChangePassword) {
    return <Navigate to="/login" replace />;
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
      if (session.role === 'ROLE_OPERATOR') {
        return <Navigate to="/operator" replace />;
      }
      return <Navigate to="/" replace />;
    }
  }

  // 4. Kiểm tra phân quyền động theo RBAC Matrix (routePath hoặc location.pathname)
  const targetPath = routePath || location.pathname;
  if (!isRouteAllowedForRole(targetPath, session.role)) {
    if (session.role === 'ROLE_OPERATOR') {
      return <Navigate to="/operator" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
