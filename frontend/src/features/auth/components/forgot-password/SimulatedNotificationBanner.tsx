import React from 'react';
import { X, MessageSquare, Mail, Sparkles } from 'lucide-react';

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
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[60] w-full max-w-md px-4 animate-in slide-in-from-top-6 duration-300">
      <div
        className={`p-4 bg-white border rounded-2xl shadow-2xl flex items-start gap-3.5 ${
          channel === 'SMS' ? 'border-indigo-300 shadow-indigo-100' : 'border-blue-300 shadow-blue-100'
        }`}
      >
        <div
          className={`p-2.5 rounded-xl border shrink-0 ${
            channel === 'SMS'
              ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
              : 'bg-blue-50 text-blue-600 border-blue-200'
          }`}
        >
          {channel === 'SMS' ? <MessageSquare className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
        </div>
        <div className="flex-1 min-w-0 text-xs sm:text-sm">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-slate-900 flex items-center gap-2">
              <span>SMART WMS</span>
              <span
                className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md ${
                  channel === 'SMS' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'
                }`}
              >
                {channel === 'SMS' ? 'SMS BRANDNAME' : 'GMAIL / OUTLOOK'}
              </span>
            </span>
            <span className="text-xs text-slate-500 font-mono">Vừa xong</span>
          </div>
          <p className="text-slate-700 mt-1.5 leading-relaxed text-xs sm:text-sm">
            {channel === 'SMS' ? (
              <>
                Gửi tới <span className="text-indigo-700 font-bold">{phoneNumber}</span>: Mã xác thực OTP của bạn là:{' '}
                <span className="font-mono font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-300 text-sm tracking-widest">
                  {generatedOtp}
                </span>{' '}
                (Hiệu lực 3 phút).
              </>
            ) : (
              <>
                Gửi tới{' '}
                <span className="text-blue-700 font-bold">
                  {identifier.includes('@') ? identifier : `${identifier}@smartwms.vn`}
                </span>
                : Mã xác thực OTP là:{' '}
                <span className="font-mono font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-300 text-sm tracking-widest">
                  {generatedOtp}
                </span>{' '}
                (Hiệu lực 3 phút).
              </>
            )}
          </p>
          <button
            type="button"
            onClick={onAutoFillOtp}
            className="mt-2 text-xs text-indigo-600 hover:text-indigo-800 font-bold underline flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Bấm vào đây để tự động điền mã OTP này</span>
          </button>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
