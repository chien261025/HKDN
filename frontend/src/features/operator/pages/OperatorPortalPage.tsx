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
import {
  operatorService,
  InboundOrderDto,
  OutboundOrderDto,
  ProductDto,
  LocationDto,
} from '../services/operatorService';

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

  const [scanHistory, setScanHistory] = useState<Array<{ code: string; time: string; label?: string }>>([]);
  const [quickRefs, setQuickRefs] = useState<{
    inbounds: InboundOrderDto[];
    outbounds: OutboundOrderDto[];
    products: ProductDto[];
    locations: LocationDto[];
  }>({ inbounds: [], outbounds: [], products: [], locations: [] });

  useEffect(() => {
    if (!isToolboxOpen) return;
    Promise.all([
      operatorService.getInboundOrders().catch(() => []),
      operatorService.getOutboundOrders().catch(() => []),
      operatorService.getProducts().catch(() => []),
      operatorService.getLocations().catch(() => []),
    ]).then(([inbounds, outbounds, products, locations]) => {
      setQuickRefs({
        inbounds: inbounds.filter((o) => o.status === 'PENDING' || o.status === 'PARTIALLY_STOCKED' || o.status === 'RECEIVED').slice(0, 3),
        outbounds: outbounds.filter((o) => o.status === 'ALLOCATED' || o.status === 'PICKING' || o.status === 'PENDING').slice(0, 3),
        products: products.slice(0, 4),
        locations: locations.filter((l) => l.isActive !== false).slice(0, 4),
      });
    });
  }, [isToolboxOpen]);

  const toggleDisplayMode = () => {
    setDisplayMode((prev) => {
      const next = prev === 'PDA' ? 'EXPANDED' : 'PDA';
      localStorage.setItem('smart_wms_operator_display_mode', next);
      return next;
    });
  };

  const handleScanSuccess = (code: string, label?: string) => {
    setShowScanner(false);
    setScannedCode(code);
    if (soundEnabled) {
      soundEffects.playSuccessBeep();
    }
    setScanHistory((prev) => [
      { code, time: new Date().toLocaleTimeString('vi-VN'), ...(label ? { label } : {}) },
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
    handleScanSuccess(code, label);
  };

  // Hardware Scanner Wedge Listener (Zebra TC21 / Honeywell Barcode Gun / Keyboard)
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();
    let shortcutTimer: ReturnType<typeof setTimeout> | null = null;
    const TAB_SHORTCUT_MAP: Record<string, OperatorTab> = {
      '1': 'STAGING',
      '2': 'PUTAWAY',
      '3': 'PICKING',
      '4': 'TRANSFER',
      '5': 'AUDIT',
    };

    const clearShortcutTimer = () => {
      if (shortcutTimer) {
        clearTimeout(shortcutTimer);
        shortcutTimer = null;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');

      if (!isInput && (e.key === 'F1' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k'))) {
        e.preventDefault();
        clearShortcutTimer();
        setShowScanner((prev) => !prev);
        return;
      }

      if (isInput) return;

      // Alt + [1..5]: Chuyển tab tức thì
      if (e.altKey && TAB_SHORTCUT_MAP[e.key]) {
        e.preventDefault();
        clearShortcutTimer();
        buffer = '';
        setActiveTab(TAB_SHORTCUT_MAP[e.key]);
        return;
      }

      const currentTime = Date.now();
      if (currentTime - lastKeyTime > 150) {
        buffer = '';
      }
      lastKeyTime = currentTime;
      clearShortcutTimer();

      if (e.key === 'Enter') {
        if (buffer.length >= 2) {
          handleScanSuccess(buffer.trim());
          buffer = '';
        }
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        buffer += e.key;
        // Chỉ coi phím 1..5 là phím tắt đổi tab nếu buffer chỉ có đúng 1 ký tự đó và không có ký tự tiếp theo từ súng quét trong 180ms
        if (buffer.length === 1 && TAB_SHORTCUT_MAP[e.key]) {
          const targetTab = TAB_SHORTCUT_MAP[e.key];
          shortcutTimer = setTimeout(() => {
            if (buffer.length === 1 && TAB_SHORTCUT_MAP[buffer]) {
              setActiveTab(targetTab);
              buffer = '';
            }
          }, 180);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearShortcutTimer();
      window.removeEventListener('keydown', handleKeyDown);
    };
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
      sub: 'Chuyển hàng nội bộ',
      icon: ArrowRightLeft,
      shortcut: '4',
      badge: 'Nội Bộ',
      color: 'purple',
    },
    {
      id: 'AUDIT' as OperatorTab,
      label: 'Kiểm Kê Kho',
      sub: 'Đếm & đối soát tồn',
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
              {/* Section 1: Mã đơn hàng & vị trí thực tế đang mở */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-700 text-slate-300">
                  <span className="font-bold uppercase text-[11px] text-blue-400">Mã Thao Tác Nhanh Hiện Trường</span>
                  <span className="text-[10px] text-slate-400">Chạm để chọn mã</span>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block pt-1">Đơn hàng đang mở (PO / SO):</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {quickRefs.inbounds.map((po) => (
                      <button
                        key={`po-${po.id}`}
                        type="button"
                        onClick={() => handleInjectBarcode(po.orderCode, po.supplier?.name || 'Đơn nhập')}
                        className="p-2 min-h-[44px] rounded-xl bg-slate-900/90 hover:bg-blue-600 text-left border border-slate-700/60 text-slate-200 transition cursor-pointer"
                      >
                        <div className="font-bold text-[11px] text-blue-300 truncate">{po.orderCode}</div>
                        <div className="text-[10px] text-slate-400 truncate">{po.supplier?.name || 'Đơn nhập kho'}</div>
                      </button>
                    ))}
                    {quickRefs.outbounds.map((so) => (
                      <button
                        key={`so-${so.id}`}
                        type="button"
                        onClick={() => handleInjectBarcode(so.orderCode, so.customerName || 'Đơn xuất')}
                        className="p-2 min-h-[44px] rounded-xl bg-slate-900/90 hover:bg-blue-600 text-left border border-slate-700/60 text-slate-200 transition cursor-pointer"
                      >
                        <div className="font-bold text-[11px] text-emerald-300 truncate">{so.orderCode}</div>
                        <div className="text-[10px] text-slate-400 truncate">{so.customerName || 'Đơn xuất kho'}</div>
                      </button>
                    ))}
                    {quickRefs.inbounds.length === 0 && quickRefs.outbounds.length === 0 && (
                      <div className="col-span-2 text-[11px] text-slate-400 py-1.5">
                        Không có đơn nhập/xuất đang chờ.
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] uppercase font-bold text-slate-400 block pt-2">Mặt hàng đang kinh doanh:</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {quickRefs.products.map((prod) => (
                      <button
                        key={`prod-${prod.id}`}
                        type="button"
                        onClick={() => handleInjectBarcode(prod.sku, prod.name)}
                        className="p-2 min-h-[44px] rounded-xl bg-slate-900/90 hover:bg-blue-600 text-left border border-slate-700/60 text-slate-200 transition cursor-pointer"
                      >
                        <div className="font-bold text-[11px] text-slate-200 truncate">{prod.sku}</div>
                        <div className="text-[10px] text-slate-400 truncate">{prod.name}</div>
                      </button>
                    ))}
                  </div>

                  <span className="text-[10px] uppercase font-bold text-slate-400 block pt-2">Vị trí Ô Kệ đang hoạt động:</span>
                  <div className="grid grid-cols-1 gap-1.5">
                    {quickRefs.locations.map((loc) => (
                      <button
                        key={`loc-${loc.id}`}
                        type="button"
                        onClick={() => handleInjectBarcode(loc.binBarcode, `${loc.zoneCode} • Tầng ${loc.shelf}`)}
                        className="p-2 min-h-[44px] rounded-xl bg-slate-900/90 hover:bg-blue-600 text-left border border-slate-700/60 text-slate-200 transition cursor-pointer flex items-center justify-between gap-2"
                      >
                        <span className="font-bold text-[11px] text-indigo-300 truncate">{loc.binBarcode}</span>
                        <span className="text-[10px] text-slate-400 shrink-0">Tầng {loc.shelf}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Section 2: Nhật ký quét thực địa */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-700 text-slate-300">
                  <div className="flex items-center gap-1.5 font-bold uppercase text-[11px] text-emerald-400">
                    <History className="w-3.5 h-3.5" />
                    <span>Nhật Ký Quét Mã Trong Ca</span>
                  </div>
                  <span className="text-[10px] text-slate-400">{scanHistory.length} mã gần nhất</span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {scanHistory.length === 0 ? (
                    <div className="p-4 text-center text-[11px] text-slate-400 bg-slate-900/50 rounded-xl border border-dashed border-slate-700">
                      Chưa có lượt quét mã vạch nào trong phiên làm việc này.
                    </div>
                  ) : (
                    scanHistory.map((sh, idx) => (
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
                    ))
                  )}
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
