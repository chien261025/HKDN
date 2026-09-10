import React, { useState } from 'react';
import { Package, Truck, CheckCircle2, ScanLine, Plus, Calendar, Hash } from 'lucide-react';
import { InboundReceiptItem } from '../../types';

interface InboundStagingTabProps {
  onOpenScanner: () => void;
}

export const InboundStagingTab: React.FC<InboundStagingTabProps> = ({ onOpenScanner }) => {
  const [items, setItems] = useState<InboundReceiptItem[]>([
    {
      id: 'rcp-01',
      poCode: 'PO-2026-001',
      sku: 'SKU-MILK-100',
      productName: 'Sữa tươi Vinamilk 100% 1L',
      expectedQty: 100,
      receivedQty: 100,
      batchNumber: 'BATCH-MILK-26B',
      expiryDate: '2026-10-15',
      status: 'RECEIVED',
    },
  ]);

  const [sku, setSku] = useState('SKU-OMO-MATIC');
  const [productName, setProductName] = useState('Nước giặt OMO Matic 3.6kg');
  const [qty, setQty] = useState('50');
  const [expiry, setExpiry] = useState('2026-11-20');
  const [batch, setBatch] = useState('BATCH-OMO-02');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const handleConfirmReceive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qty || parseInt(qty) <= 0) return;

    const newItem: InboundReceiptItem = {
      id: `rcp-${Date.now().toString().slice(-4)}`,
      poCode: 'PO-2026-002',
      sku,
      productName,
      expectedQty: parseInt(qty),
      receivedQty: parseInt(qty),
      batchNumber: batch || `BATCH-${Date.now().toString().slice(-4)}`,
      expiryDate: expiry,
      status: 'RECEIVED',
    };

    setItems((prev) => [newItem, ...prev]);
    setSuccessNotice(`Đã nhận ${qty} cái ${productName} vào Khu Đệm (STAGING)!`);
    setTimeout(() => setSuccessNotice(null), 3000);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Banner / Title */}
      <div className="p-3.5 rounded-2xl bg-[#0d1322] border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              1. Nhận Hàng Tại Khu Đệm (Staging)
            </h2>
            <p className="text-[11px] text-slate-400">Kiểm tra thực tế từ xe tải giao hàng</p>
          </div>
        </div>

        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
          GATE 01
        </span>
      </div>

      {/* Success Notification */}
      {successNotice && (
        <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span className="font-semibold">{successNotice}</span>
        </div>
      )}

      {/* Scan & Receipt Form */}
      <form onSubmit={handleConfirmReceive} className="bg-[#0b101d] rounded-2xl p-4 border border-slate-800 space-y-3 shadow-lg">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <span className="text-xs font-bold text-slate-300">Nhập Liệu Kiện Hàng</span>
          <button
            type="button"
            onClick={onOpenScanner}
            className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold"
          >
            <ScanLine className="w-3.5 h-3.5" />
            <span>Quét Thùng Hàng</span>
          </button>
        </div>

        {/* Sản phẩm */}
        <div>
          <label className="text-[11px] text-slate-400 font-medium">Mặt Hàng Nhận:</label>
          <select
            value={sku}
            onChange={(e) => {
              setSku(e.target.value);
              if (e.target.value === 'SKU-OMO-MATIC') {
                setProductName('Nước giặt OMO Matic 3.6kg');
                setBatch('BATCH-OMO-02');
              } else if (e.target.value === 'SKU-MILK-100') {
                setProductName('Sữa tươi Vinamilk 100% 1L');
                setBatch('BATCH-MILK-26C');
              } else {
                setProductName('Samsung Galaxy S24 Ultra');
                setBatch('BATCH-S24-01');
              }
            }}
            className="mt-1 w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500 font-semibold"
          >
            <option value="SKU-OMO-MATIC">Nước giặt OMO Matic 3.6kg (SKU-OMO-MATIC)</option>
            <option value="SKU-MILK-100">Sữa tươi Vinamilk 100% 1L (SKU-MILK-100)</option>
            <option value="SKU-SAMS-S24">Samsung Galaxy S24 Ultra (SKU-SAMS-S24)</option>
          </select>
        </div>

        {/* Grid Số lượng & Lô */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="text-[11px] text-slate-400 font-medium">Số Lượng Thực Nhận:</label>
            <input
              type="number"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              min="1"
              required
              className="mt-1 w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-emerald-400 font-bold font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 font-medium">Mã Số Lô Hàng:</label>
            <input
              type="text"
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
              required
              className="mt-1 w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Hạn sử dụng FEFO */}
        <div>
          <label className="text-[11px] text-slate-400 font-medium">Hạn Sử Dụng (In Trên Thùng):</label>
          <input
            type="date"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            required
            className="mt-1 w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/30 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Xác Nhận Nhận Hàng Vào Khu Đệm (STAGING)</span>
        </button>
      </form>

      {/* Danh sách kiện vừa nhận */}
      <div className="bg-[#0b101d] rounded-2xl p-4 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Kiện Hàng Đang Ở Khu Đệm ({items.length})
          </h3>
          <span className="text-[10px] text-slate-500 font-mono">Chờ cất hàng lên kệ</span>
        </div>

        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-0.5">
                <div className="font-bold text-white">{item.productName}</div>
                <div className="text-[10px] font-mono text-slate-400 flex items-center gap-2">
                  <span>Lô: <strong className="text-cyan-400">{item.batchNumber}</strong></span>
                  <span>•</span>
                  <span>HSD: <strong className="text-amber-300">{item.expiryDate}</strong></span>
                </div>
              </div>

              <div className="text-right flex-shrink-0 font-mono">
                <div className="text-emerald-400 font-bold">{item.receivedQty} cái</div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  STAGING
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
