import React, { useState } from 'react';
import { Truck, Layers, PackageCheck, ClipboardCheck, ScanLine, Smartphone } from 'lucide-react';
import { OperatorHeader } from '../components/OperatorHeader';
import { InboundStagingTab } from '../components/tabs/InboundStagingTab';
import { PutawayTab } from '../components/tabs/PutawayTab';
import { PickingFefoTab } from '../components/tabs/PickingFefoTab';
import { BlindCountTab } from '../components/tabs/BlindCountTab';
import { CameraBarcodeScanner } from '../../../components/scanner/CameraBarcodeScanner';
import { OperatorTab } from '../types';

export const OperatorPortalPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<OperatorTab>('STAGING');
  const [showScanner, setShowScanner] = useState(false);

  const handleScanSuccess = (code: string) => {
    setShowScanner(false);
    alert(`[PDA SCANNER] Đã quét thành công mã vạch:\n${code}`);
  };

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col justify-between relative selection:bg-cyan-500 selection:text-black">
      {/* Ambient background glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none -z-10"></div>

      {/* Main Container - Optimized for Phone / Rugged PDA device */}
      <div className="w-full max-w-lg mx-auto flex-1 flex flex-col bg-[#070b16] border-x border-slate-800/80 shadow-2xl">
        {/* Device & Operator Header */}
        <OperatorHeader onOpenScanner={() => setShowScanner(true)} />

        {/* Dynamic Tab Body */}
        <main className="flex-1 p-4 overflow-y-auto">
          {activeTab === 'STAGING' && (
            <InboundStagingTab onOpenScanner={() => setShowScanner(true)} />
          )}
          {activeTab === 'PUTAWAY' && (
            <PutawayTab onOpenScanner={() => setShowScanner(true)} />
          )}
          {activeTab === 'PICKING' && (
            <PickingFefoTab onOpenScanner={() => setShowScanner(true)} />
          )}
          {activeTab === 'AUDIT' && (
            <BlindCountTab onOpenScanner={() => setShowScanner(true)} />
          )}
        </main>

        {/* Fixed Mobile Bottom Navigation Bar */}
        <nav className="sticky bottom-0 left-0 right-0 bg-[#090e1c]/95 backdrop-blur-xl border-t border-slate-800 px-2 py-2 flex items-center justify-around z-30 shadow-2xl">
          {/* Tab 1: Staging */}
          <button
            onClick={() => setActiveTab('STAGING')}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
              activeTab === 'STAGING'
                ? 'text-cyan-400 bg-cyan-500/10 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span className="text-[10px] tracking-tight">1. Nhận Hàng</span>
          </button>

          {/* Tab 2: Putaway */}
          <button
            onClick={() => setActiveTab('PUTAWAY')}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
              activeTab === 'PUTAWAY'
                ? 'text-indigo-400 bg-indigo-500/10 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span className="text-[10px] tracking-tight">2. Cất Kệ</span>
          </button>

          {/* Tab 3: Picking */}
          <button
            onClick={() => setActiveTab('PICKING')}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
              activeTab === 'PICKING'
                ? 'text-amber-400 bg-amber-500/10 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PackageCheck className="w-4 h-4" />
            <span className="text-[10px] tracking-tight">3. Nhặt FEFO</span>
          </button>

          {/* Tab 4: Audit */}
          <button
            onClick={() => setActiveTab('AUDIT')}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
              activeTab === 'AUDIT'
                ? 'text-emerald-400 bg-emerald-500/10 font-bold scale-105'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            <span className="text-[10px] tracking-tight">4. Đếm Mù</span>
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
