import React from 'react';
import { Smartphone, Wifi, BatteryCharging, User, ScanLine, ArrowLeft, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';

interface OperatorHeaderProps {
  onOpenScanner: () => void;
}

export const OperatorHeader: React.FC<OperatorHeaderProps> = ({ onOpenScanner }) => {
  // Đọc thông tin người dùng từ phiên đăng nhập thực tế
  const sessionStr = localStorage.getItem('smart_wms_session');
  const session = sessionStr ? JSON.parse(sessionStr) : {
    fullName: 'Lê Thủ Kho',
    role: 'ROLE_OPERATOR',
    username: 'operator01',
  };

  const handleLogout = () => {
    localStorage.removeItem('smart_wms_token');
    localStorage.removeItem('smart_wms_session');
    window.location.href = '/login';
  };

  const initials = session.fullName
    ? session.fullName.split(' ').map((n: string) => n[0]).slice(-2).join('')
    : 'TK';

  return (
    <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-30 shadow-xs">
      {/* Top Device Status Line */}
      <div className="flex items-center justify-between text-xs font-mono text-slate-500 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
            <Smartphone className="w-3.5 h-3.5" /> PDA Zebra TC21
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5 text-cyan-700 font-semibold">
            <Wifi className="w-3.5 h-3.5" /> Kho Tân Bình (5GHz)
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
          <BatteryCharging className="w-4 h-4" />
          <span>95%</span>
        </div>
      </div>

      {/* Main Operator Row */}
      <div className="flex items-center justify-between pt-2.5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-sm">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-900">{session.fullName || 'Lê Thủ Kho'}</h1>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                OPERATOR
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">@{session.username || 'operator01'} • Hiện trường kho</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenScanner}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <ScanLine className="w-4 h-4" />
            <span>Quét Mã</span>
          </button>

          <Link
            to="/"
            className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl text-xs transition-colors"
            title="Quay lại Tháp Chỉ Huy (Desktop)"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <button
            onClick={handleLogout}
            className="p-2 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-600 hover:text-rose-700 rounded-xl text-xs transition-colors cursor-pointer"
            title="Đăng xuất khỏi PDA"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
