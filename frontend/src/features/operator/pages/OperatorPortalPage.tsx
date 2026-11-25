import React, { useState, useEffect } from 'react';
import {
  Truck,
  Layers,
  PackageCheck,
  ArrowRightLeft,
  ClipboardCheck,
  Zap,
  HelpCircle,
  History,
  Barcode,
  CheckCircle2,
  X,
  Radio,
  Clock,
  Sparkles,
  ShieldCheck,
  Smartphone,
  Maximize2,
  ScanLine,
} from 'lucide-react';
import { OperatorHeader } from '../components/OperatorHeader';
import { InboundStagingTab } from '../components/tabs/InboundStagingTab';
import { PutawayTab } from '../components/tabs/PutawayTab';
import { PickingFefoTab } from '../components/tabs/PickingFefoTab';
import { StockTransferTab } from '../components/tabs/StockTransferTab';
import { BlindCountTab } from '../components/tabs/BlindCountTab';
import { CameraBarcodeScanner } from '../../../components/scanner/CameraBarcodeScanner';
import { OperatorTab } from '../types';
import { soundEffects } from '../utils/soundEffects';

export const OperatorPortalPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<OperatorTab>('STAGING');
  const [showScanner, setShowScanner] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [activeScanTarget, setActiveScanTarget] = useState<'FROM' | 'TO' | null>(null);

  // Chế độ hiển thị: Mặc định luôn là 'EXPANDED' (Trạm làm việc toàn màn hình) trên màn hình lớn.
  const [displayMode, setDisplayMode] = useState<'PDA' | 'EXPANDED'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 'EXPANDED';
    }
    const saved = localStorage.getItem('smart_wms_operator_display_mode');
    return saved === 'PDA' ? 'PDA' : 'EXPANDED';
  });

  const [isMobileScreen, setIsMobileScreen] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isCompact = displayMode === 'PDA' || isMobileScreen;

  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isToolboxOpen, setIsToolboxOpen] = useState<boolean>(false);

  const [scanHistory, setScanHistory] = useState<Array<{ code: string; time: string; label?: string }>>([
    { code: 'PO-2026-234', time: '22:30:15', label: 'Đơn PO Samsung' },
    { code: 'SKU-MILK-100', time: '22:28:40', label: 'Sữa tươi Vinamilk' },
    { code: 'WH01-ZB-B01-R01-S02-B06', time: '22:25:12', label: 'Ô Kệ B06 Tầng 2' },
  ]);

  const toggleDisplayMode = () => {
    setDisplayMode((prev) => {
      const next = prev === 'PDA' ? 'EXPANDED' : 'PDA';
      localStorage.setItem('smart_wms_operator_display_mode', next);
      return next;
    });
  };

  const handleScanSuccess = (code: string) => {
    setShowScanner(false);
    setScannedCode(code);
    if (soundEnabled) {
      soundEffects.playSuccessBeep();
    }
    setScanHistory((prev) => [
      { code, time: new Date().toLocaleTimeString('vi-VN') },
      ...prev.slice(0, 7),
    ]);
  };

  const handleClearScannedCode = React.useCallback(() => {
    setScannedCode(null);
  }, []);

  const handleOpenScanner = (targetField?: 'FROM' | 'TO') => {
    setActiveScanTarget(targetField || null);
    setShowScanner(true);
  };

  // Tiêm mã test nhanh từ panel hỗ trợ (Dành cho kiểm thử giao diện & báo cáo)
  const handleInjectBarcode = (code: string, label?: string) => {
    handleScanSuccess(code);
    if (label) {
      setScanHistory((prev) => [
        { code, time: new Date().toLocaleTimeString('vi-VN'), label },
        ...prev.slice(0, 7),
      ]);
    }
  };

  // Hardware Scanner Wedge Listener (Zebra TC21 / Honeywell Barcode Gun / Keyboard)
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');

      // Phím tắt bàn phím toàn cục (khi không gõ chữ trong ô input)
      if (!isInput) {
        if (e.key === '1') { setActiveTab('STAGING'); return; }
        if (e.key === '2') { setActiveTab('PUTAWAY'); return; }
        if (e.key === '3') { setActiveTab('PICKING'); return; }
        if (e.key === '4') { setActiveTab('TRANSFER'); return; }
        if (e.key === '5') { setActiveTab('AUDIT'); return; }
        if (e.key === 'F1' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) {
          e.preventDefault();
          setShowScanner((prev) => !prev);
          return;
        }
      }

      if (isInput) return;

      const currentTime = Date.now();
      if (currentTime - lastKeyTime > 150) {
        buffer = '';
      }
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (buffer.length >= 2) {
          handleScanSuccess(buffer.trim());
          buffer = '';
        }
      } else if (e.key.length === 1) {
        buffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [soundEnabled]);

  const tabList = [
    {
      id: 'STAGING' as OperatorTab,
      label: 'Tiếp Nhận Hàng',
      sub: 'Tiếp nhận & dỡ hàng',
      icon: Truck,
      shortcut: '1',
      badge: 'Cửa Nhập',
      color: 'blue',
    },
    {
      id: 'PUTAWAY' as OperatorTab,
      label: 'Cất Kệ Lưu Kho',
      sub: 'Xếp hàng lên kệ',
      icon: Layers,
      shortcut: '2',
      badge: 'Cất Kệ',
      color: 'indigo',
    },
    {
      id: 'PICKING' as OperatorTab,
      label: 'Lấy Hàng Theo HSD',
      sub: 'Ưu tiên hàng cận hạn',
      icon: PackageCheck,
      shortcut: '3',
      badge: 'Xuất Kho',
      color: 'amber',
    },
    {
      id: 'TRANSFER' as OperatorTab,
      label: 'Điều Chuyển Kệ',
      sub: 'Stock Transfer',
      icon: ArrowRightLeft,
      shortcut: '4',
      badge: 'Nội Bộ',
      color: 'purple',
    },
    {
      id: 'AUDIT' as OperatorTab,
      label: 'Kiểm Kê Kho',
      sub: 'Cycle Count',
      icon: ClipboardCheck,
      shortcut: '5',
      badge: 'Đối Soát',
      color: 'emerald',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-900 flex flex-col justify-between relative selection:bg-blue-600 selection:text-white">
      {/* 1. Header Thủ Kho Hiện Trường */}
      <OperatorHeader
        onOpenScanner={() => handleOpenScanner()}
        viewMode={displayMode}
        onToggleViewMode={toggleDisplayMode}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((v) => !v)}
        onToggleToolbox={() => setIsToolboxOpen((v) => !v)}
        isToolboxOpen={isToolboxOpen}
        onQuickSearchBarcode={(code) => handleScanSuccess(code)}
      />

      {/* 2. Top Workflow Ribbon (5 Operational Process Steps) */}
      <nav aria-label="Các phân hệ nghiệp vụ thủ kho" className="bg-white border-b border-slate-200 sticky top-[73px] z-30 shadow-2xs select-none">
        <div className="max-w-7xl mx-auto px-2 sm:px-4">
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2 no-scrollbar">
            {tabList.map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-200 ring-2 ring-blue-600/30'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <div className="text-left">
                    <div className="leading-tight flex items-center gap-1.5">
                      <span>{t.label}</span>
                      <span className={`text-[10px] font-mono px-1 rounded ${
                        isActive ? 'bg-blue-500/40 text-blue-50' : 'bg-slate-200 text-slate-600'
                      }`}>
                        [{t.shortcut}]
                      </span>
                    </div>
                    <div className={`text-[10px] font-normal leading-tight hidden md:block ${
                      isActive ? 'text-blue-100' : 'text-slate-400'
                    }`}>
                      {t.sub}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* 3. Main Workspace Container */}
      <main className="flex-1 w-full flex items-start justify-center">
        <div className={`w-full ${
          displayMode === 'PDA'
            ? 'max-w-[480px] my-4 mx-auto px-3 sm:px-0'
            : 'max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-6'
        }`}>
          <div className={displayMode === 'PDA' ? 'bg-white rounded-3xl border border-slate-300 shadow-2xl p-4 sm:p-5 overflow-hidden' : ''}>
            {activeTab === 'STAGING' && (
              <InboundStagingTab
                onOpenScanner={() => handleOpenScanner()}
                scannedCode={scannedCode}
                onClearScannedCode={() => setScannedCode(null)}
                isCompact={isCompact}
              />
            )}
            {activeTab === 'PUTAWAY' && (
              <PutawayTab
                onOpenScanner={() => handleOpenScanner()}
                scannedCode={scannedCode}
                onClearScannedCode={() => setScannedCode(null)}
                isCompact={isCompact}
              />
            )}
            {activeTab === 'PICKING' && (
              <PickingFefoTab
                onOpenScanner={() => handleOpenScanner()}
                scannedCode={scannedCode}
                onClearScannedCode={handleClearScannedCode}
                isCompact={isCompact}
              />
            )}
            {activeTab === 'TRANSFER' && (
              <StockTransferTab
                onOpenScanner={handleOpenScanner}
                scannedCode={scannedCode}
                onClearScannedCode={() => setScannedCode(null)}
                activeScanTarget={activeScanTarget}
                isCompact={isCompact}
              />
            )}
            {activeTab === 'AUDIT' && (
              <BlindCountTab
                onOpenScanner={() => handleOpenScanner()}
                scannedCode={scannedCode}
                onClearScannedCode={() => setScannedCode(null)}
                isCompact={isCompact}
              />
            )}
          </div>
        </div>
      </main>

      {/* Floating Action Button (FAB) Quét Mã Camera Trên Mobile */}
      <button
        type="button"
        onClick={() => handleOpenScanner()}
        className="fixed bottom-6 right-6 z-40 md:hidden flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 active:scale-90 text-white rounded-full shadow-2xl shadow-blue-500/60 border-2 border-white transition-all cursor-pointer"
        title="Quét Barcode bằng Camera"
      >
        <ScanLine className="w-6 h-6 animate-pulse" />
      </button>

      {/* 4. Slide-Over Toolbox Drawer ("Bộ Giả Lập Barcode & Nhật Ký Thực Địa") */}
      {isToolboxOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <aside className="w-full max-w-md bg-slate-900 text-slate-100 h-full shadow-2xl flex flex-col border-l border-slate-800 animate-in slide-in-from-right duration-250 select-none">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  <Barcode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Sổ Tay Mã Hiện Trường & Nhật Ký Quét
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">Bảng mã tham chiếu tại bến & Lịch sử kiểm toán</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsToolboxOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-mono">
              {/* Section 1: Bảng mã thao tác nhanh dán tại trạm bến */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-700 text-slate-300">
                  <span className="font-bold uppercase text-[11px] text-blue-400">🏷️ Bảng Mã Vạch Thao Tác Nhanh (Trạm Bến)</span>
                  <span className="text-[10px] text-slate-400">Chạm để xác nhận mã</span>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block pt-1">Đơn hàng (PO / SO):</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleInjectBarcode('PO-2026-234', 'Đơn PO Samsung')}
                      className="p-2 rounded-xl bg-slate-900/90 hover:bg-blue-600 text-left border border-slate-700/60 text-slate-200 transition cursor-pointer"
                    >
                      <div className="font-bold text-[11px] text-blue-300">PO-2026-234</div>
                      <div className="text-[10px] text-slate-400 truncate">Nhận bến Samsung</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInjectBarcode('SO-2026-884', 'Đơn xuất SO Co.op')}
                      className="p-2 rounded-xl bg-slate-900/90 hover:bg-blue-600 text-left border border-slate-700/60 text-slate-200 transition cursor-pointer"
                    >
                      <div className="font-bold text-[11px] text-emerald-300">SO-2026-884</div>
                      <div className="text-[10px] text-slate-400 truncate">Xuất Co.opmart</div>
                    </button>
                  </div>

                  <span className="text-[10px] uppercase font-bold text-slate-400 block pt-2">Mặt hàng (SKU / Barcode):</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleInjectBarcode('SKU-MILK-100', 'Sữa tươi Vinamilk')}
                      className="p-2 rounded-xl bg-slate-900/90 hover:bg-blue-600 text-left border border-slate-700/60 text-slate-200 transition cursor-pointer"
                    >
                      <div className="font-bold text-[11px] text-slate-200">SKU-MILK-100</div>
                      <div className="text-[10px] text-slate-400 truncate">Sữa Vinamilk 1L</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInjectBarcode('SKU-TEA-TH', 'Trà xanh TH True TEA')}
                      className="p-2 rounded-xl bg-slate-900/90 hover:bg-blue-600 text-left border border-slate-700/60 text-slate-200 transition cursor-pointer"
                    >
                      <div className="font-bold text-[11px] text-slate-200">SKU-TEA-TH</div>
                      <div className="text-[10px] text-slate-400 truncate">Trà xanh TH 350ml</div>
                    </button>
                  </div>

                  <span className="text-[10px] uppercase font-bold text-slate-400 block pt-2">Vị trí Ô Kệ (Bin Barcode):</span>
                  <div className="grid grid-cols-1 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleInjectBarcode('WH01-ZA-A01-R01-S01-B01', 'Ô Nhập Khu A')}
                      className="p-2 rounded-xl bg-slate-900/90 hover:bg-blue-600 text-left border border-slate-700/60 text-slate-200 transition cursor-pointer flex items-center justify-between"
                    >
                      <span className="font-bold text-[11px] text-indigo-300">WH01-ZA-A01-R01-S01-B01</span>
                      <span className="text-[10px] text-slate-400">Tầng 1 (S01)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInjectBarcode('WH01-ZB-B01-R01-S02-B06', 'Ô Kệ B06 Khu B')}
                      className="p-2 rounded-xl bg-slate-900/90 hover:bg-blue-600 text-left border border-slate-700/60 text-slate-200 transition cursor-pointer flex items-center justify-between"
                    >
                      <span className="font-bold text-[11px] text-indigo-300">WH01-ZB-B01-R01-S02-B06</span>
                      <span className="text-[10px] text-slate-400">Tầng 2 (S02)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInjectBarcode('WH01-ZB-B02-R02-S02-B12', 'Ô Kệ B12 Cận Hạn')}
                      className="p-2 rounded-xl bg-slate-900/90 hover:bg-blue-600 text-left border border-slate-700/60 text-slate-200 transition cursor-pointer flex items-center justify-between"
                    >
                      <span className="font-bold text-[11px] text-amber-300">WH01-ZB-B02-R02-S02-B12</span>
                      <span className="text-[10px] text-slate-400">Hàng Cận Hạn</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Section 2: Nhật ký quét thực địa */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-700 text-slate-300">
                  <div className="flex items-center gap-1.5 font-bold uppercase text-[11px] text-emerald-400">
                    <History className="w-3.5 h-3.5" />
                    <span>Nhật Ký Quét Barcode Thực Địa</span>
                  </div>
                  <span className="text-[10px] text-slate-400">{scanHistory.length} mã gần nhất</span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {scanHistory.map((sh, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-xl bg-slate-900/80 border border-slate-700/60 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Barcode className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <div className="truncate">
                          <span className="text-slate-200 font-bold block truncate">{sh.code}</span>
                          {sh.label && <span className="text-[10px] text-slate-400 block truncate">{sh.label}</span>}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500 shrink-0 font-mono">{sh.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 3: Phím tắt vận hành */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 space-y-2 text-slate-300">
                <div className="flex items-center gap-1.5 font-bold uppercase text-[11px] text-blue-400 pb-1 border-b border-slate-700">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Phím Tắt Súng Quét & Bàn Phím</span>
                </div>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-400">Phím [1] đến [5]:</span>
                    <span className="text-white font-bold">Chuyển đổi 5 phân hệ</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-400">Bóp cò súng / Enter:</span>
                    <span className="text-emerald-400 font-bold">Quét Barcode tức thời</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-400">Phím F1 / Ctrl+K:</span>
                    <span className="text-blue-400 font-bold">Bật Camera Barcode</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Floating Barcode Camera Scanner Modal */}
      {showScanner && (
        <CameraBarcodeScanner
          onScanSuccess={handleScanSuccess}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
};
