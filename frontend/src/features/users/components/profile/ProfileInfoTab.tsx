import React from 'react';
import {
  User,
  Shield,
  MapPin,
  Clock,
  Smartphone,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { AuthSession } from '../../../auth/types';

interface ProfileInfoTabProps {
  session: AuthSession;
}

export const ProfileInfoTab: React.FC<ProfileInfoTabProps> = ({ session }) => {
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ROLE_ADMIN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-purple-50 text-purple-700 border border-purple-200">
            <Shield className="w-3.5 h-3.5 text-purple-600" />
            Quản Trị Hệ Thống
          </span>
        );
      case 'ROLE_WAREHOUSE_MANAGER':
      case 'ROLE_MANAGER':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
            <User className="w-3.5 h-3.5 text-blue-600" />
            Quản Lý Kho
          </span>
        );
      case 'ROLE_OPERATOR':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-cyan-50 text-cyan-800 border border-cyan-200">
            <Smartphone className="w-3.5 h-3.5 text-cyan-600" />
            Thủ Kho Vận Hành
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono bg-slate-100 text-slate-700 border border-slate-200">
            {role}
          </span>
        );
    }
  };

  return (
    <div className="p-6 space-y-4 text-sm">
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-slate-500 font-medium">Vai Trò Hệ Thống:</span>
          {getRoleBadge(session.role)}
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 pt-2.5">
          <span className="text-slate-500 font-medium">Kho Phụ Trách:</span>
          <span className="font-semibold text-slate-800 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-indigo-600" />
            {session.warehouse || 'Kho Tổng Tân Bình'}
          </span>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 pt-2.5">
          <span className="text-slate-500 font-medium">Email Công Vụ:</span>
          <span className="font-mono text-slate-700">{session.email || `${session.username}@smartwms.vn`}</span>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 pt-2.5">
          <span className="text-slate-500 font-medium">Thời Gian Đăng Nhập:</span>
          <span className="font-mono text-slate-700 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-sky-600" />
            {session.loginAt ? new Date(session.loginAt).toLocaleString('vi-VN') : 'Phiên hiện tại'}
          </span>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 pt-2.5">
          <span className="text-slate-500 font-medium">Phiên Có Hiệu Lực Đến:</span>
          <span className="font-mono text-slate-700 text-xs sm:text-sm">
            {session.expiresAt
              ? `${new Date(session.expiresAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ngày ${new Date(session.expiresAt).toLocaleDateString('vi-VN')}`
              : '24 giờ'}
          </span>
        </div>
      </div>

      {/* Danh sách quyền hạn */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Quyền Hạn Tài Khoản
        </h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Xem danh mục hàng hóa &amp; kho</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Nhập / Xuất Kho</span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Kiểm kê & Điều chỉnh</span>
          </div>
          <div className={`flex items-center gap-1.5 font-medium ${session.role === 'ROLE_ADMIN' ? 'text-emerald-700' : 'text-slate-400'}`}>
            {session.role === 'ROLE_ADMIN' ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            )}
            <span>Quản trị người dùng</span>
          </div>
        </div>
      </div>
    </div>
  );
};
