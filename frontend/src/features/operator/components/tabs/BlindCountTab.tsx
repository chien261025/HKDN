import React, { useState } from 'react';
import { ClipboardCheck, CheckCircle2, ScanLine, EyeOff, Send, ShieldAlert, History } from 'lucide-react';
import { BlindCountRecord } from '../../types';

interface BlindCountTabProps {
  onOpenScanner: () => void;
}

export const BlindCountTab: React.FC<BlindCountTabProps> = ({ onOpenScanner }) => {
  const [history, setHistory] = useState<BlindCountRecord[]>([
    {
      id: 'cnt-01',
      locationBarcode: 'ZA-A01-R01-S01-B01',
      countedQty: 25,
      timestamp: '15 phút trước',
      notes: 'Bao bì nguyên vẹn, tem nhãn rõ ràng',
      status: 'SUBMITTED',
    },
  ]);

  const [locationBarcode, setLocationBarcode] = useState('ZA-A01-R01-S01-B03');
  const [countedQty, setCountedQty] = useState('');
  const [notes, setNotes] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const handleSubmitCount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!countedQty || isNaN(parseInt(countedQty))) return;

    const newRecord: BlindCountRecord = {
      id: `cnt-${Date.now().toString().slice(-4)}`,
      locationBarcode,
      countedQty: parseInt(countedQty),
      timestamp: 'Vừa xong',
      notes: notes || 'Đếm thực tế bằng mắt thường',
      status: 'SUBMITTED',
    };

    setHistory((prev) => [newRecord, ...prev]);
    setNotice(`Đã gửi kết quả đếm (${countedQty} cái tại ô ${locationBarcode}) về cho Quản lý kho duyệt!`);
    setCountedQty('');
    setNotes('');
    setTimeout(() => setNotice(null), 4000);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="p-3.5 rounded-2xl bg-[#0d1322] border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              4. Đếm Kiểm Kê Mù (Blind Count)
            </h2>
            <p className="text-[11px] text-slate-400">Không hiển thị số dư tồn kho hệ thống</p>
          </div>
        </div>

        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
          <EyeOff className="w-3 h-3" /> BLIND MODE
        </span>
      </div>

      {/* Note about Blind Count */}
      <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-800/40 text-[11px] text-indigo-200/90 leading-relaxed flex items-start gap-2">
        <ShieldAlert className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
        <span>
          <strong>Nguyên tắc kiểm kê mù:</strong> Bạn chỉ nhập số lượng đếm được thực tế bằng mắt. Hệ thống sẽ tự động so khớp chênh lệch và gửi báo cáo về cho Quản lý kho duyệt tại trang <strong>/audit</strong>.
        </span>
      </div>

      {/* Success Notification */}
      {notice && (
        <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span className="font-semibold">{notice}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmitCount} className="bg-[#0b101d] rounded-2xl p-4 border border-slate-800 space-y-3 shadow-lg">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <span className="text-xs font-bold text-slate-300">Ghi Nhận Số Liệu Kiểm Kê</span>
          <button
            type="button"
            onClick={onOpenScanner}
            className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold"
          >
            <ScanLine className="w-3.5 h-3.5" />
            <span>Quét Mã Ô Kệ</span>
          </button>
        </div>

        {/* Mã ô kệ */}
        <div>
          <label className="text-[11px] text-slate-400 font-medium">Mã Vạch Ô Kệ Kiểm Kê:</label>
          <div className="flex gap-2 mt-1">
            <input
              type="text"
              value={locationBarcode}
              onChange={(e) => setLocationBarcode(e.target.value)}
              required
              className="flex-1 p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-cyan-300 font-bold focus:outline-none focus:border-cyan-500"
            />
            <button
              type="button"
              onClick={() => setLocationBarcode('ZA-A01-R01-S01-B01')}
              className="px-2.5 py-2 bg-slate-800 text-[10px] font-mono text-slate-300 rounded-xl hover:bg-slate-700"
            >
              Ô B01
            </button>
            <button
              type="button"
              onClick={() => setLocationBarcode('ZB-B01-R01-S01-B05')}
              className="px-2.5 py-2 bg-slate-800 text-[10px] font-mono text-slate-300 rounded-xl hover:bg-slate-700"
            >
              Ô B05
            </button>
          </div>
        </div>

        {/* Số lượng đếm thực tế */}
        <div>
          <label className="text-[11px] text-slate-400 font-medium">Số Lượng Đếm Thực Tế Tại Ô (Cái):</label>
          <input
            type="number"
            value={countedQty}
            onChange={(e) => setCountedQty(e.target.value)}
            min="0"
            required
            placeholder="Nhập số lượng đếm được bằng mắt..."
            className="mt-1 w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-sm text-emerald-400 font-bold font-mono focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Ghi chú */}
        <div>
          <label className="text-[11px] text-slate-400 font-medium">Ghi Chú Hiện Trường (Tùy chọn):</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="VD: Hộp hơi xước nhẹ, còn nguyên seal..."
            className="mt-1 w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-slate-500"
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all active:scale-95"
        >
          <Send className="w-4 h-4" />
          <span>Gửi Kết Quả Về Cho Quản Lý Duyệt</span>
        </button>
      </form>

      {/* Lịch sử đếm */}
      <div className="bg-[#0b101d] rounded-2xl p-4 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-slate-400" />
            Lịch Sử Các Ô Đã Đếm Trong Ca ({history.length})
          </h3>
          <span className="text-[10px] text-emerald-400 font-mono">Đã gửi lên Cloud</span>
        </div>

        <div className="space-y-2">
          {history.map((rec) => (
            <div
              key={rec.id}
              className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-0.5">
                <div className="font-mono font-bold text-cyan-300">{rec.locationBarcode}</div>
                <div className="text-[11px] text-slate-400">{rec.notes}</div>
                <div className="text-[10px] text-slate-500 font-mono">{rec.timestamp}</div>
              </div>

              <div className="text-right flex-shrink-0 font-mono">
                <div className="text-emerald-400 font-bold text-sm">{rec.countedQty} cái</div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  CHỜ DUYỆT
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
