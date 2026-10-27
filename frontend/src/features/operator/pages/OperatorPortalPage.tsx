import React, { useState, useEffect } from 'react';
import { Truck, Layers, PackageCheck, ArrowRightLeft, ClipboardCheck } from 'lucide-react';
import { OperatorHeader } from '../components/OperatorHeader';
import { InboundStagingTab } from '../components/tabs/InboundStagingTab';
import { PutawayTab } from '../components/tabs/PutawayTab';
import { PickingFefoTab } from '../components/tabs/PickingFefoTab';
import { StockTransferTab } from '../components/tabs/StockTransferTab';
import { BlindCountTab } from '../components/tabs/BlindCountTab';
import { CameraBarcodeScanner } from '../../../components/scanner/CameraBarcodeScanner';
import { OperatorTab } from '../types';

export const OperatorPortalPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<OperatorTab>('STAGING');
  const [showScanner, setShowScanner] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [activeScanTarget, setActiveScanTarget] = useState<'FROM' | 'TO' | null>(null);

  const handleScanSuccess = (code: string) => {
    setShowScanner(false);
    setScannedCode(code);
  };

  const handleOpenScanner = (targetField?: 'FROM' | 'TO') => {
    setActiveScanTarget(targetField || null);
    setShowScanner(true);
  };

  // Hardware Scanner Wedge Listener (Zebra TC21 / Honeywell Barcode Gun)
  // Khi thủ kho bóp cò súng quét vật lý, máy gửi nhanh chuỗi ký tự < 150ms kết thúc bằng Enter
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

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
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col justify-between relative selection:bg-indigo-500 selection:text-white">
      {/* Main Container - Optimized for Phone / Rugged PDA device */}
      <div className="w-full max-w-lg mx-auto flex-1 flex flex-col bg-white border-x border-slate-200 shadow-xl">
        {/* Device & Operator Header */}
        <OperatorHeader onOpenScanner={() => handleOpenScanner()} />

        {/* Dynamic Tab Body */}
        <main className="flex-1 p-4 overflow-y-auto bg-slate-50/50">
          {activeTab === 'STAGING' && (
            <InboundStagingTab
              onOpenScanner={() => handleOpenScanner()}
              scannedCode={scannedCode}
              onClearScannedCode={() => setScannedCode(null)}
            />
          )}
          {activeTab === 'PUTAWAY' && (
            <PutawayTab
              onOpenScanner={() => handleOpenScanner()}
              scannedCode={scannedCode}
              onClearScannedCode={() => setScannedCode(null)}
            />
          )}
          {activeTab === 'PICKING' && (
            <PickingFefoTab
              onOpenScanner={() => handleOpenScanner()}
              scannedCode={scannedCode}
              onClearScannedCode={() => setScannedCode(null)}
            />
          )}
          {activeTab === 'TRANSFER' && (
            <StockTransferTab
              onOpenScanner={handleOpenScanner}
              scannedCode={scannedCode}
              onClearScannedCode={() => setScannedCode(null)}
              activeScanTarget={activeScanTarget}
            />
          )}
          {activeTab === 'AUDIT' && (
            <BlindCountTab
              onOpenScanner={() => handleOpenScanner()}
              scannedCode={scannedCode}
              onClearScannedCode={() => setScannedCode(null)}
            />
          )}
        </main>

        {/* Fixed Mobile Bottom Navigation Bar - 5 Tabs */}
        <nav className="sticky bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200 px-1.5 py-2 flex items-center justify-around z-30 shadow-lg">
          {/* Tab 1: Staging */}
          <button
            type="button"
            onClick={() => setActiveTab('STAGING')}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'STAGING'
                ? 'text-cyan-700 bg-cyan-50 font-bold scale-105 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Truck className="w-4.5 h-4.5" />
            <span className="text-[11px] tracking-tight">1. Nhận PO</span>
          </button>

          {/* Tab 2: Putaway */}
          <button
            type="button"
            onClick={() => setActiveTab('PUTAWAY')}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'PUTAWAY'
                ? 'text-indigo-700 bg-indigo-50 font-bold scale-105 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4.5 h-4.5" />
            <span className="text-[11px] tracking-tight">2. Cất Kệ</span>
          </button>

          {/* Tab 3: Picking */}
          <button
            type="button"
            onClick={() => setActiveTab('PICKING')}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'PICKING'
                ? 'text-amber-700 bg-amber-50 font-bold scale-105 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <PackageCheck className="w-4.5 h-4.5" />
            <span className="text-[11px] tracking-tight">3. Nhặt SO</span>
          </button>

          {/* Tab 4: Transfer */}
          <button
            type="button"
            onClick={() => setActiveTab('TRANSFER')}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'TRANSFER'
                ? 'text-purple-700 bg-purple-50 font-bold scale-105 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <ArrowRightLeft className="w-4.5 h-4.5" />
            <span className="text-[11px] tracking-tight">4. Chuyển Ô</span>
          </button>

          {/* Tab 5: Audit */}
          <button
            type="button"
            onClick={() => setActiveTab('AUDIT')}
            className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'AUDIT'
                ? 'text-emerald-700 bg-emerald-50 font-bold scale-105 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <ClipboardCheck className="w-4.5 h-4.5" />
            <span className="text-[11px] tracking-tight">5. Kiểm Kê</span>
          </button>
        </nav>
      </div>

      {/* Floating Barcode Scanner Modal */}
      {showScanner && (
        <CameraBarcodeScanner
          onScanSuccess={handleScanSuccess}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
  );
};
