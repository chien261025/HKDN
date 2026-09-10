import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Layers,
  Package,
  ScanLine,
  Bot,
  FileSpreadsheet,
  Bell,
  Search,
  Activity,
  ShieldCheck,
  Cpu,
  Database,
  Radio,
  Clock,
  Sparkles
} from 'lucide-react';
import { DashboardPage } from '../features/dashboard/pages/DashboardPage';
import { LocationLayoutPage } from '../features/masterdata/pages/LocationLayoutPage';
import { InventoryBalancePage } from '../features/inventory/pages/InventoryBalancePage';
import { SmartAssistantPage } from '../features/smartquery/pages/SmartAssistantPage';
import { ReportsPage } from '../features/reporting/pages/ReportsPage';
import { CameraBarcodeScanner } from '../components/scanner/CameraBarcodeScanner';

const AppContent: React.FC = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('vi-VN'));
  const location = useLocation();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('vi-VN'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const navItems = [
    { name: 'Trung Tâm Điều Hành', path: '/', icon: LayoutDashboard, badge: 'LIVE', shortcut: '⌘1' },
    { name: 'Bản Đồ Ô Kệ 3D/2D', path: '/layout', icon: Layers, badge: 'TOPOLOGY', shortcut: '⌘2' },
    { name: 'Cân Đối Tồn Kho & Khóa', path: '/inventory', icon: Package, badge: 'LOCK', shortcut: '⌘3' },
    { name: 'Trợ Lý AI Smart Query', path: '/smartquery', icon: Bot, badge: 'AST SAFE', shortcut: '⌘4' },
    { name: 'Báo Cáo Ngầm (RabbitMQ)', path: '/reports', icon: FileSpreadsheet, badge: 'STREAM', shortcut: '⌘5' },
  ];

  return (
    <div className="flex h-screen bg-[#070a12] text-slate-100 font-sans overflow-hidden">
      {/* Ambient background light glows */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none -z-10"></div>

      {/* Cyber Sidebar Navigation */}
      <aside className="w-72 bg-[#0d121f]/90 backdrop-blur-2xl text-slate-300 flex flex-col border-r border-slate-800/80 shadow-2xl relative z-20">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-indigo-500/30 ring-1 ring-white/20">
                W
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#0d121f] rounded-full animate-ping"></span>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[#0d121f] rounded-full"></span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-extrabold text-white text-base tracking-wide">SMART WMS</h1>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">PRO</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium tracking-tight">Logistics Command Tower</p>
            </div>
          </div>
        </div>

        {/* Quick System Telemetry Pulse */}
        <div className="px-4 py-2.5 bg-slate-900/60 border-b border-slate-800/50 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Telemetry Online</span>
          </div>
          <div className="flex items-center gap-1 font-mono text-slate-400 text-[10px]">
            <Clock className="w-3 h-3 text-indigo-400" />
            <span>{currentTime}</span>
          </div>
        </div>

        {/* Menu Navigation */}
        <nav className="flex-1 p-3.5 space-y-1.5 overflow-y-auto">
          <p className="px-3 py-1.5 text-[10px] font-bold text-slate-300 uppercase tracking-wider">Phân Hệ Điều Hành</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all relative ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600/90 to-indigo-700 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/30'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg transition-colors ${isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400 group-hover:text-indigo-400 group-hover:bg-slate-700'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span>{item.name}</span>
                </div>
                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-500 group-hover:text-slate-300'}`}>
                  {item.badge}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Infrastructure Nodes Status Widget */}
        <div className="p-3 mx-3 mb-3 rounded-xl bg-slate-900/80 border border-slate-800/80 text-[11px] space-y-1.5">
          <div className="flex items-center justify-between text-slate-400 font-bold text-[10px] uppercase tracking-wider">
            <span className="flex items-center gap-1"><Cpu className="w-3 h-3 text-indigo-400" /> Cụm Hạ Tầng Live</span>
            <span className="text-emerald-400">100% HEALTHY</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px] font-mono">
            <div className="p-1.5 rounded bg-slate-800/60 flex items-center justify-between border border-slate-700/40">
              <span className="text-slate-400">PostgreSQL</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </div>
            <div className="p-1.5 rounded bg-slate-800/60 flex items-center justify-between border border-slate-700/40">
              <span className="text-slate-400">RabbitMQ</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </div>
            <div className="p-1.5 rounded bg-slate-800/60 flex items-center justify-between border border-slate-700/40">
              <span className="text-slate-400">MinIO S3</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </div>
            <div className="p-1.5 rounded bg-slate-800/60 flex items-center justify-between border border-slate-700/40">
              <span className="text-slate-400">Pessimistic</span>
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            </div>
          </div>
        </div>

        {/* Quét Barcode Action Button */}
        <div className="p-3.5 border-t border-slate-800/80">
          <button
            onClick={() => setShowScanner(true)}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 bg-gradient-to-r from-cyan-600/20 to-indigo-600/20 hover:from-cyan-600/30 hover:to-indigo-600/30 text-cyan-300 hover:text-white border border-cyan-500/40 rounded-xl text-xs font-bold transition-all shadow-md shadow-cyan-900/20 group"
          >
            <ScanLine className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span>Mở Camera Quét Mã Barcode</span>
          </button>
        </div>
      </aside>

      {/* Main Content Arena */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Futuristic Top Header Bar */}
        <header className="h-16 bg-[#0d121f]/80 backdrop-blur-xl border-b border-slate-800/80 px-6 flex items-center justify-between shadow-sm">
          {/* Search bar */}
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm nhanh SKU, mã vạch Barcode, ô kệ (VD: ZA-A01, SKU-MILK)..."
                className="w-full pl-9 pr-12 py-1.5 bg-slate-900/90 border border-slate-700/60 rounded-xl text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
                ⌘K
              </span>
            </div>
          </div>

          {/* Right quick telemetry & User profile */}
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Chống Âm Kho: Pessimistic Locked</span>
            </div>

            <button className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl border border-slate-700/40 transition-all">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-[#0d121f]"></span>
            </button>

            <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-extrabold flex items-center justify-center text-xs shadow-md shadow-indigo-500/20 border border-white/20">
                  TK
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#0d121f] rounded-full"></span>
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-slate-200">Trần Trưởng Kho</p>
                <span className="text-[10px] font-mono text-indigo-400 font-semibold">CHIEF_OPERATOR</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Route View */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#070a12] relative">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/layout" element={<LocationLayoutPage />} />
            <Route path="/inventory" element={<InventoryBalancePage />} />
            <Route path="/smartquery" element={<SmartAssistantPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="*" element={<DashboardPage />} />
          </Routes>
        </main>
      </div>

      {/* Barcode Scanner Modal */}
      {showScanner && (
        <CameraBarcodeScanner
          onScanSuccess={(code) => {
            alert(`Đã nhận diện mã vạch Barcode: ${code}`);
            setShowScanner(false);
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

export default App;
