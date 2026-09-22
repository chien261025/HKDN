import React from 'react';
import { Clock, RotateCcw, ArrowLeft } from 'lucide-react';

interface StepOtpProps {
  channel: 'SMS' | 'EMAIL';
  phoneNumber: string;
  identifier: string;
  otpDigits: string[];
  otpInputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  onOtpChange: (index: number, val: string) => void;
  onOtpKeyDown: (index: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
  countdown: number;
  onResendOtp: (e: React.FormEvent) => void;
  onBackToIdentifier: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const StepOtp: React.FC<StepOtpProps> = ({
  channel,
  phoneNumber,
  identifier,
  otpDigits,
  otpInputRefs,
  onOtpChange,
  onOtpKeyDown,
  countdown,
  onResendOtp,
  onBackToIdentifier,
  onSubmit,
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="text-center space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
        <p className="text-slate-600 text-xs sm:text-sm">
          Mã OTP đã được gửi đến{' '}
          {channel === 'SMS'
            ? `tin nhắn SMS số ${phoneNumber}`
            : `hộp thư email ${identifier.includes('@') ? identifier : `${identifier}@smartwms.vn`}`}
          :
        </p>
        <p className="font-mono font-bold text-indigo-700 text-sm sm:text-base">
          {channel === 'SMS' ? phoneNumber : identifier}
        </p>
      </div>

      {/* 6 ô nhập mã OTP */}
      <div className="flex justify-center gap-2.5 py-2">
        {otpDigits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => (otpInputRefs.current[i] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => onOtpChange(i, e.target.value)}
            onKeyDown={(e) => onOtpKeyDown(i, e)}
            className="w-12 h-14 text-center text-xl font-black font-mono text-slate-900 bg-white border-2 border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all shadow-xs"
          />
        ))}
      </div>

      {/* Đồng hồ đếm ngược & Gửi lại */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
        <div className="flex items-center gap-1.5 font-mono font-medium text-slate-700">
          <Clock className="w-3.5 h-3.5 text-indigo-600" />
          <span>
            Mã hết hạn sau: <strong className="text-indigo-600">{formatTime(countdown)}</strong>
          </span>
        </div>

        <button
          type="button"
          disabled={countdown > 0}
          onClick={onResendOtp}
          className="text-indigo-600 hover:text-indigo-800 disabled:opacity-40 disabled:hover:text-indigo-600 font-semibold flex items-center gap-1 cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Gửi lại mã</span>
        </button>
      </div>

      <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200">
        <button
          type="button"
          onClick={onBackToIdentifier}
          className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium text-xs sm:text-sm cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Đổi tài khoản</span>
        </button>

        <button
          type="submit"
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md shadow-indigo-200 active:scale-95 cursor-pointer text-xs sm:text-sm"
        >
          Xác Thực OTP
        </button>
      </div>
    </form>
  );
};
