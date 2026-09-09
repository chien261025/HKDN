import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Layers, Package, ScanLine, Bot, FileSpreadsheet, Bell } from 'lucide-react';
import { DashboardPage } from '../features/dashboard/pages/DashboardPage';
import { SmartAssistantPage } from '../features/smartquery/pages/SmartAssistantPage';
import { CameraBarcodeScanner } from '../components/scanner/CameraBarcodeScanner';

const AppContent: React.FC = () => {
  const [showScanner, setShowScanner] = useState(false);
  const location = useLocation();

  const navItems = [
    { name: 'Tổng Quan Kho', path: '/', icon: LayoutDashboard },
    { name: 'Sơ Đồ Kệ Hàng', path: '/layout', icon: Layers },
    { name: 'Tra Cứu Tồn Kho', path: '/inventory', icon: Package },
    { name: 'Trợ Lý AI Smart Query', path: '/smartquery', icon: Bot },
    { name: 'Báo Cáo Lớn (RabbitMQ)', path: '/reports', icon: FileSpreadsheet },
  ];

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/30">
              W
            </div>
            <div>
              <h2 className="font-bold text-white text-base leading-none">Smart WMS</h2>
              <span className="text-[10px] text-slate-400 font-medium">Modular Monolith 3.0</span>
            </div>
          </div>
        </div>

        {/* Menu items */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Quét Barcode Quick Button */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={() => setShowScanner(true)}
            className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 hover:text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-semibold transition-all"
          >
            <ScanLine className="w-4 h-4" />
            <span>Mở Camera Quét Mã</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-medium">
            Môi trường: <span className="text-emerald-600 font-bold">PostgreSQL • RabbitMQ • MinIO Active</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-bold flex items-center justify-center text-xs">
                QL
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-800">Trần Trưởng Kho</p>
                <p className="text-[10px] text-slate-400">WAREHOUSE_MANAGER</p>
              </div>
            </div>
          </div>
        </header>

        {/* Router View */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/smartquery" element={<SmartAssistantPage />} />
            <Route path="*" element={<DashboardPage />} />
          </Routes>
        </main>
      </div>

      {/* Camera Barcode Scanner Modal */}
      {showScanner && (
        <CameraBarcodeScanner
          onScanSuccess={(code) => {
            alert(`Đã nhận diện mã vạch: ${code}`);
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
