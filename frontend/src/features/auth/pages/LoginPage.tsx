import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm';
import { DemoAccountCards } from '../components/DemoAccountCards';
import { SecurityBadges } from '../components/SecurityBadges';
import { DemoAccount } from '../types';
import { authService } from '../services/authService';
import { Sparkles, Radio, Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('manager01');
  const [password, setPassword] = useState('123456');
  const [warehouse, setWarehouse] = useState('Kho Tổng Tân Bình (ZONE A & B)');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  /**
   * Thực hiện gọi API đăng nhập Backend thực tế qua authService
   */
  const executeLogin = async (userToLogin: string, passToLogin: string, targetRouteOverride?: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const data = await authService.login(
        {
          username: userToLogin.trim(),
          password: passToLogin,
        },
        warehouse
      );

      setSuccessMessage(`Đăng nhập thành công! Chào mừng ${data.fullName} (${data.role})`);

      // Định tuyến tự động theo phân quyền RBAC
      setTimeout(() => {
        setIsLoading(false);
        if (targetRouteOverride) {
          navigate(targetRouteOverride);
        } else if (data.role === 'ROLE_OPERATOR') {
          navigate('/operator');
        } else {
          navigate('/');
        }
      }, 500);
    } catch (err: any) {
      setIsLoading(false);
      const apiMsg =
        err.response?.data?.message ||
        err.message ||
        'Không thể kết nối đến máy chủ Backend hoặc thông tin đăng nhập sai!';
      setErrorMessage(apiMsg);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeLogin(username, password);
  };

  const handleSelectDemo = (acc: DemoAccount) => {
    setUsername(acc.username);
    setPassword('123456');
    executeLogin(acc.username, '123456', acc.targetRoute);
  };

  return (
    <div className="min-h-screen w-full bg-[#050811] text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans select-none">
      {/* Dynamic Background Glow Orbs */}
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-[130px] pointer-events-none"></div>
      <div className="fixed -bottom-40 -right-40 w-96 h-96 bg-cyan-600/20 rounded-full blur-[130px] pointer-events-none"></div>
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-purple-600/10 rounded-full blur-[180px] pointer-events-none"></div>

      {/* Top Floating Bar */}
      <header className="p-4 md:px-8 flex items-center justify-between relative z-10 border-b border-slate-800/60 bg-[#070b16]/70 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-indigo-600/40 ring-1 ring-white/20">
            W
          </div>
          <div>
            <span className="font-extrabold text-white text-sm tracking-wide">SMART WMS</span>
            <span className="ml-1.5 text-[9px] font-mono font-bold bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/40">
              JWT RBAC AUTH
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-xs font-mono text-slate-300">
          <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            Backend API Live
          </span>
          <span>•</span>
          <span className="text-slate-400">PostgreSQL 16 &amp; RabbitMQ</span>
        </div>
      </header>

      {/* Main Login Card Arena */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10 my-4">
        <div className="w-full max-w-xl bg-[#0b101f]/95 backdrop-blur-2xl border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-950/50 space-y-5">
          {/* Brand Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/40 text-indigo-300 text-xs font-mono font-bold mb-1 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>HỆ THỐNG QUẢN LÝ KHO THÔNG MINH</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Đăng Nhập Cổng Điều Hành
            </h1>
            <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
              Xác thực JWT Token thời gian thực, tự động phân luồng theo vai trò Admin, Quản Lý Kho &amp; Thủ Kho PDA.
            </p>
          </div>

          {/* Alert Banners: Error or Success */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/60 text-rose-200 text-xs font-bold flex items-center gap-2.5 shadow-lg shadow-rose-950/40 animate-in fade-in slide-in-from-top-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/60 text-emerald-200 text-xs font-bold flex items-center gap-2.5 shadow-lg shadow-emerald-950/40 animate-in fade-in slide-in-from-top-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

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

          {/* 3 Interactive Quick Demo Login Buttons (1-Click Real Login) */}
          <DemoAccountCards onSelectDemo={handleSelectDemo} isLoading={isLoading} />

          {/* 4 Technical Pillars Badges */}
          <SecurityBadges />
        </div>
      </main>

      {/* Footer Credentials */}
      <footer className="p-4 text-center text-xs text-slate-400 relative z-10 border-t border-slate-800/80 font-mono bg-[#070b16]/70">
        <p className="text-slate-300 font-bold">
          ĐỒ ÁN TỐT NGHIỆP: SMART WMS SYSTEM • KIẾN TRÚC KHO THÔNG MINH ENTERPRISE
        </p>
        <p className="text-[10px] text-slate-400 mt-0.5">
          JWT Bearer Auth • Pessimistic Concurrency • FEFO Lot Tracking • RabbitMQ Streaming • JSqlParser AST
        </p>
      </footer>
    </div>
  );
};
