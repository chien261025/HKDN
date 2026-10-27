import React from 'react';
import { X, CheckCircle2, ArrowRight } from 'lucide-react';

interface SimulatedNotificationBannerProps {
  channel: 'SMS' | 'EMAIL';
  phoneNumber: string;
  identifier: string;
  generatedOtp: string;
  onAutoFillOtp: () => void;
  onClose: () => void;
}

export const SimulatedNotificationBanner: React.FC<SimulatedNotificationBannerProps> = ({
  channel,
  phoneNumber,
  identifier,
  generatedOtp,
  onAutoFillOtp,
  onClose,
}) => {
  return (
    <div className="fixed top-5 right-5 z-[70] max-w-sm w-full px-2 sm:px-0 animate-in slide-in-from-top-4 duration-200">
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-800 flex items-start gap-3">
        <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0 text-xs sm:text-sm">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white text-xs">Mã xác thực hệ thống</span>
            <span className="text-[11px] text-slate-400">Vừa xong</span>
          </div>
          <p className="text-slate-300 mt-1 text-xs leading-relaxed">
            Mã OTP gửi tới {channel === 'SMS' ? phoneNumber : identifier}:{' '}
            <strong className="text-amber-300 font-mono text-sm tracking-wider">{generatedOtp}</strong>
          </p>
          <div className="mt-2.5">
            <button
              type="button"
              onClick={onAutoFillOtp}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer flex items-center gap-1.5 transition-colors"
            >
              <span>Tự động điền mã</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 cursor-pointer transition-colors"
          aria-label="Đóng thông báo"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

