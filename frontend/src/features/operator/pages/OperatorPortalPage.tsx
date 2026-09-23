import React, { useState } from 'react';
import { Truck, Layers, PackageCheck, ClipboardCheck } from 'lucide-react';
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
  const [scannedCode, setScannedCode] = useState<string | null>(null);

  const handleScanSuccess = (code: string) => {
    setShowScanner(false);
    setScannedCode(code);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col justify-between relative selection:bg-indigo-500 selection:text-white">
      {/* Main Container - Optimized for Phone / Rugged PDA device */}
      <div className="w-full max-w-lg mx-auto flex-1 flex flex-col bg-white border-x border-slate-200 shadow-xl">
        {/* Device & Operator Header */}
        <OperatorHeader onOpenScanner={() => setShowScanner(true)} />

        {/* Dynamic Tab Body */}
        <main className="flex-1 p-4 overflow-y-auto bg-slate-50/50">
          {activeTab === 'STAGING' && (
            <InboundStagingTab
              onOpenScanner={() => setShowScanner(true)}
              scannedCode={scannedCode}
              onClearScannedCode={() => setScannedCode(null)}
            />
          )}
          {activeTab === 'PUTAWAY' && (
            <PutawayTab
              onOpenScanner={() => setShowScanner(true)}
              scannedCode={scannedCode}
              onClearScannedCode={() => setScannedCode(null)}
            />
          )}
          {activeTab === 'PICKING' && (
            <PickingFefoTab
              onOpenScanner={() => setShowScanner(true)}
              scannedCode={scannedCode}
              onClearScannedCode={() => setScannedCode(null)}
            />
          )}
          {activeTab === 'AUDIT' && (
            <BlindCountTab
              onOpenScanner={() => setShowScanner(true)}
              scannedCode={scannedCode}
              onClearScannedCode={() => setScannedCode(null)}
            />
          )}
        </main>

        {/* Fixed Mobile Bottom Navigation Bar */}
        <nav className="sticky bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200 px-3 py-2.5 flex items-center justify-around z-30 shadow-lg">
          {/* Tab 1: Staging */}
          <button
            onClick={() => setActiveTab('STAGING')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'STAGING'
                ? 'text-cyan-700 bg-cyan-50 font-bold scale-105 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Truck className="w-5 h-5" />
            <span className="text-xs tracking-tight">1. Nhận Hàng</span>
          </button>

          {/* Tab 2: Putaway */}
          <button
            onClick={() => setActiveTab('PUTAWAY')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'PUTAWAY'
                ? 'text-indigo-700 bg-indigo-50 font-bold scale-105 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="w-5 h-5" />
            <span className="text-xs tracking-tight">2. Cất Kệ</span>
          </button>

          {/* Tab 3: Picking */}
          <button
            onClick={() => setActiveTab('PICKING')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'PICKING'
                ? 'text-amber-700 bg-amber-50 font-bold scale-105 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <PackageCheck className="w-5 h-5" />
            <span className="text-xs tracking-tight">3. Nhặt FEFO</span>
          </button>

          {/* Tab 4: Audit */}
          <button
            onClick={() => setActiveTab('AUDIT')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
              activeTab === 'AUDIT'
                ? 'text-emerald-700 bg-emerald-50 font-bold scale-105 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <ClipboardCheck className="w-5 h-5" />
            <span className="text-xs tracking-tight">4. Đếm Mù</span>
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
