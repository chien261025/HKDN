import React from 'react';
import { Clock, RotateCcw, ArrowLeft } from 'lucide-react';

interface StepOtpProps {
  identifier: string;
  targetEmail?: string;
  otpDigits: string[];
  otpInputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>;
  onOtpChange: (index: number, val: string) => void;
  onOtpKeyDown: (index: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
  onOtpPaste?: (pastedCode: string) => void;
  countdown: number;
  isSubmitting?: boolean;
  onResendOtp: (e: React.FormEvent) => void;
  onBackToIdentifier: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const StepOtp: React.FC<StepOtpProps> = ({
  identifier,
  targetEmail,
  otpDigits,
  otpInputRefs,
  onOtpChange,
  onOtpKeyDown,
  onOtpPaste,
  countdown,
  isSubmitting = false,
  onResendOtp,
  onBackToIdentifier,
  onSubmit,
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted && onOtpPaste) {
      onOtpPaste(pasted);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="text-center space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
        <p className="text-slate-600 text-xs sm:text-sm">
          Mã xác thực gồm 6 chữ số đã được gửi đến hộp thư email:
        </p>
        <p className="font-bold text-indigo-700 text-sm sm:text-base">
          {targetEmail || identifier}
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
            disabled={isSubmitting}
            onChange={(e) => onOtpChange(i, e.target.value)}
            onKeyDown={(e) => onOtpKeyDown(i, e)}
            onPaste={handlePaste}
            className="w-12 h-14 text-center text-xl font-bold font-mono text-slate-900 bg-white border-2 border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100 disabled:opacity-60 transition-all shadow-xs"
          />
        ))}
      </div>

      {/* Đồng hồ đếm ngược & Gửi lại */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
        <div className="flex items-center gap-1.5 font-medium text-slate-600">
          <Clock className="w-3.5 h-3.5 text-indigo-600" />
          <span>
            Hết hạn sau: <strong className="text-indigo-600 font-mono">{formatTime(countdown)}</strong>
          </span>
        </div>

        <button
          type="button"
          disabled={countdown > 0 || isSubmitting}
          onClick={onResendOtp}
          className="text-indigo-600 hover:text-indigo-800 disabled:opacity-40 disabled:hover:text-indigo-600 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Gửi lại mã</span>
        </button>
      </div>

      <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={onBackToIdentifier}
          className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium text-xs sm:text-sm cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại</span>
        </button>

        <button
          type="submit"
          disabled={isSubmitting || otpDigits.join('').length < 6}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold transition-all shadow-md shadow-indigo-100 active:scale-95 cursor-pointer text-xs sm:text-sm flex items-center gap-2"
        >
          {isSubmitting ? 'Đang xác thực...' : 'Xác Nhận OTP'}
        </button>
      </div>
    </form>
  );
};
