import React from 'react';
import { Shield, User, Smartphone, CheckCircle2, Lock } from 'lucide-react';
import { UserRole, UserStatus } from '../types';

export const getRoleBadge = (role: UserRole): React.ReactNode => {
  switch (role) {
    case 'ROLE_ADMIN':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 font-mono">
          <Shield className="w-3 h-3 text-purple-600" /> ADMIN
        </span>
      );
    case 'ROLE_WAREHOUSE_MANAGER':
    case 'ROLE_MANAGER':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
          <User className="w-3 h-3 text-blue-600" /> Quản Lý
        </span>
      );
    case 'ROLE_OPERATOR':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200 font-mono">
          <Smartphone className="w-3 h-3 text-cyan-600" /> Thủ Kho
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 font-mono">
          {role}
        </span>
      );
  }
};

export const getStatusBadge = (status: UserStatus): React.ReactNode => (
  status === 'ACTIVE' ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
      <CheckCircle2 className="w-3 h-3" /> Hoạt Động
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
      <Lock className="w-3 h-3" /> Đã Khóa
    </span>
  )
);
