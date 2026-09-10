import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm';
import { DemoAccountCards } from '../components/DemoAccountCards';
import { SecurityBadges } from '../components/SecurityBadges';
import { DemoAccount, UserRole } from '../types';
import { Sparkles, Radio, Database, Shield } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('12345678');
  const [warehouse, setWarehouse] = useState('Kho Tổng Tân Bình (ZONE A & B)');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (user: string, role: UserRole, targetRoute: string, fullName: string) => {
    setIsLoading(true);

    // Save session in localStorage
    const sessionData = {
      username: user,
      fullName: fullName || (user === 'admin' ? 'Trần Trưởng Kho' : user === 'manager_kien' ? 'Nguyễn Văn Kiên' : 'Lê Hoàng Nam'),
      role,
      warehouse,
      token: 'jwt_mock_token_' + Date.now(),
      loggedAt: new Date().toISOString(),
    };
    localStorage.setItem('smart_wms_session', JSON.stringify(sessionData));

    setTimeout(() => {
      setIsLoading(false);
      navigate(targetRoute);
    }, 600);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let role: UserRole = 'ROLE_ADMIN';
    let target = '/';
    let name = 'Người Dùng WMS';

    if (username.toLowerCase().includes('operator') || username.toLowerCase().includes('nam')) {
      role = 'ROLE_OPERATOR';
      target = '/operator';
      name = 'Lê Hoàng Nam';
    } else if (username.toLowerCase().includes('manager') || username.toLowerCase().includes('kien')) {
      role = 'ROLE_MANAGER';
      target = '/';
      name = 'Nguyễn Văn Kiên';
    } else {
      role = 'ROLE_ADMIN';
      target = '/';
      name = 'Trần Trưởng Kho';
    }

    handleLogin(username, role, target, name);
  };

  const handleSelectDemo = (acc: DemoAccount) => {
    setUsername(acc.username);
    setPassword('••••••••');
    handleLogin(acc.username, acc.role, acc.targetRoute, acc.fullName);
  };

  return (
    <div className="min-h-screen w-full bg-[#050811] text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans select-none">
      {/* Dynamic Background Glow Orbs */}
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed -bottom-40 -right-40 w-96 h-96 bg-cyan-600/15 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-[160px] pointer-events-none"></div>

      {/* Top Floating Bar */}
      <header className="p-4 md:px-8 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-indigo-600/30 ring-1 ring-white/20">
            W
          </div>
          <div>
            <span className="font-extrabold text-white text-sm tracking-wide">SMART WMS</span>
            <span className="ml-1.5 text-[9px] font-mono font-bold bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/30">
              ENTERPRISE v2.5
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            PostgreSQL &amp; Redis Ready
          </span>
          <span>•</span>
          <span className="text-slate-500">Node Cluster Port 8080/3000</span>
        </div>
      </header>

      {/* Main Login Card Arena */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10 my-4">
        <div className="w-full max-w-xl bg-[#0b101f]/90 backdrop-blur-2xl border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-950/40 space-y-6">
          {/* Brand Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-bold mb-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>HỆ THỐNG QUẢN LÝ KHO THÔNG MINH</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Đăng Nhập Cổng Điều Hành
            </h1>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Hỗ trợ phân quyền RBAC 3 cấp (Admin, Manager, Operator) với cơ chế bảo vệ số dư tồn kho bất biến
            </p>
          </div>

          {/* Login Form */}
          <LoginForm
            username={username}
            setUsername={setUsername}
            password={password}
            setPassword={setPassword}
            warehouse={warehouse}
            setWarehouse={setWarehouse}
            rememberMe={rememberMe}
            setRememberMe={setRememberMe}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />

          {/* 3 Interactive Quick Demo Login Buttons */}
          <DemoAccountCards onSelectDemo={handleSelectDemo} />

          {/* 4 Technical Pillars Badges */}
          <SecurityBadges />
        </div>
      </main>

      {/* Footer Credentials */}
      <footer className="p-4 text-center text-xs text-slate-500 relative z-10 border-t border-slate-900 font-mono">
        <p>
          ĐỒ ÁN TỐT NGHIỆP: SMART WMS SYSTEM • KIẾN TRÚC KHO THÔNG MINH ENTERPRISE
        </p>
        <p className="text-[10px] text-slate-600 mt-0.5">
          Pessimistic Concurrency • FEFO Lot Tracking • RabbitMQ Streaming SXSSF • JSqlParser AST
        </p>
      </footer>
    </div>
  );
};
