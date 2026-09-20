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
      <div className="p-4 rounded-2xl bg-white border border-slate-200 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              4. Đếm Kiểm Kê Mù (Blind Count)
            </h2>
            <p className="text-xs text-slate-500 font-medium">Không hiển thị số dư tồn kho hệ thống</p>
          </div>
        </div>

        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
          <EyeOff className="w-3.5 h-3.5" /> BLIND MODE
        </span>
      </div>

      {/* Note about Blind Count */}
      <div className="p-3.5 rounded-xl bg-indigo-50/80 border border-indigo-200 text-xs text-indigo-900 leading-relaxed flex items-start gap-2.5 font-medium">
        <ShieldAlert className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
        <span>
          <strong>Nguyên tắc kiểm kê mù:</strong> Bạn chỉ nhập số lượng đếm được thực tế bằng mắt. Hệ thống sẽ tự động so khớp chênh lệch và gửi báo cáo về cho Quản lý kho duyệt tại trang <strong>/audit</strong>.
        </span>
      </div>

      {/* Success Notification */}
      {notice && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in shadow-2xs font-medium">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span className="font-semibold">{notice}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmitCount} className="bg-white rounded-2xl p-5 border border-slate-200 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">Ghi Nhận Số Liệu Kiểm Kê</span>
          <button
            type="button"
            onClick={onOpenScanner}
            className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
          >
            <ScanLine className="w-4 h-4" />
            <span>Quét Mã Ô Kệ</span>
          </button>
        </div>

        {/* Mã ô kệ */}
        <div>
          <label className="text-xs text-slate-700 font-bold">Mã Vạch Ô Kệ Kiểm Kê:</label>
          <div className="flex gap-2 mt-1">
            <input
              type="text"
              value={locationBarcode}
              onChange={(e) => setLocationBarcode(e.target.value)}
              required
              className="flex-1 p-2.5 rounded-xl bg-white border border-slate-300 text-xs font-mono text-indigo-700 font-bold focus:outline-none focus:border-indigo-600"
            />
            <button
              type="button"
              onClick={() => setLocationBarcode('ZA-A01-R01-S01-B01')}
              className="px-3 py-2 bg-slate-100 text-xs font-mono text-slate-700 font-semibold rounded-xl hover:bg-slate-200 border border-slate-200 cursor-pointer"
            >
              Ô B01
            </button>
            <button
              type="button"
              onClick={() => setLocationBarcode('ZB-B01-R01-S01-B05')}
              className="px-3 py-2 bg-slate-100 text-xs font-mono text-slate-700 font-semibold rounded-xl hover:bg-slate-200 border border-slate-200 cursor-pointer"
            >
              Ô B05
            </button>
          </div>
        </div>

        {/* Số lượng đếm thực tế */}
        <div>
          <label className="text-xs text-slate-700 font-bold">Số Lượng Đếm Thực Tế Tại Ô (Cái):</label>
          <input
            type="number"
            value={countedQty}
            onChange={(e) => setCountedQty(e.target.value)}
            min="0"
            required
            placeholder="Nhập số lượng đếm được bằng mắt..."
            className="mt-1 w-full p-3 rounded-xl bg-white border border-slate-300 text-sm text-emerald-700 font-bold font-mono focus:outline-none focus:border-indigo-600"
          />
        </div>

        {/* Ghi chú */}
        <div>
          <label className="text-xs text-slate-700 font-bold">Ghi Chú Hiện Trường (Tùy chọn):</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="VD: Hộp hơi xước nhẹ, còn nguyên seal..."
            className="mt-1 w-full p-2.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-indigo-600 font-medium"
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
        >
          <Send className="w-4 h-4" />
          <span>Gửi Kết Quả Về Cho Quản Lý Duyệt</span>
        </button>
      </form>

      {/* Lịch sử đếm */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 space-y-3 shadow-sm">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <History className="w-4 h-4 text-slate-500" />
            Lịch Sử Các Ô Đã Đếm Trong Ca ({history.length})
          </h3>
          <span className="text-xs text-emerald-700 font-mono font-bold">Đã gửi lên Cloud</span>
        </div>

        <div className="space-y-2">
          {history.map((rec) => (
            <div
              key={rec.id}
              className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-0.5">
                <div className="font-mono font-bold text-indigo-700">{rec.locationBarcode}</div>
                <div className="text-xs text-slate-600 font-medium">{rec.notes}</div>
                <div className="text-xs text-slate-400 font-mono">{rec.timestamp}</div>
              </div>

              <div className="text-right flex-shrink-0 font-mono">
                <div className="text-emerald-700 font-bold text-sm">{rec.countedQty} cái</div>
                <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold font-sans">
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
