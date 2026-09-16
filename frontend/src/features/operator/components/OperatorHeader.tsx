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
    <header className="bg-[#0b101d] border-b border-slate-800/80 px-4 py-3 sticky top-0 z-30 shadow-lg">
      {/* Top Device Status Line */}
      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pb-2 border-b border-slate-800/60">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-emerald-400 font-bold">
            <Smartphone className="w-3 h-3" /> PDA Zebra TC21
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 text-cyan-400 font-semibold">
            <Wifi className="w-3 h-3" /> Kho Tân Bình (5GHz)
          </span>
        </div>

        <div className="flex items-center gap-1 text-emerald-400 font-bold">
          <BatteryCharging className="w-3.5 h-3.5" />
          <span>95%</span>
        </div>
      </div>

      {/* Main Operator Row */}
      <div className="flex items-center justify-between pt-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-xs shadow-md">
            {initials}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xs font-bold text-white">{session.fullName || 'Lê Thủ Kho'}</h1>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                OPERATOR
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">@{session.username || 'operator01'} • Hiện trường kho</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenScanner}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-cyan-900/30 transition-all active:scale-95 cursor-pointer"
          >
            <ScanLine className="w-4 h-4" />
            <span>Quét Mã</span>
          </button>

          <Link
            to="/"
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs transition-colors"
            title="Quay lại Tháp Chỉ Huy (Desktop)"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <button
            onClick={handleLogout}
            className="p-2 bg-slate-900 hover:bg-rose-950/40 border border-slate-800 text-slate-400 hover:text-rose-400 rounded-xl text-xs transition-colors cursor-pointer"
            title="Đăng xuất khỏi PDA"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
