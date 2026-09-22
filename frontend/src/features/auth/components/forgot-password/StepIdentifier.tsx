import React from 'react';
import { Mail, Smartphone, ArrowRight } from 'lucide-react';

interface StepIdentifierProps {
  identifier: string;
  onIdentifierChange: (val: string) => void;
  channel: 'SMS' | 'EMAIL';
  onChannelChange: (val: 'SMS' | 'EMAIL') => void;
  phoneNumber: string;
  onPhoneNumberChange: (val: string) => void;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export const StepIdentifier: React.FC<StepIdentifierProps> = ({
  identifier,
  onIdentifierChange,
  channel,
  onChannelChange,
  phoneNumber,
  onPhoneNumberChange,
  isSubmitting,
  onSubmit,
  onCancel,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <p className="text-slate-600 leading-relaxed text-sm">
        Nhập <span className="font-bold text-slate-900">Tên đăng nhập</span> hoặc{' '}
        <span className="font-bold text-slate-900">Email công vụ</span> của bạn để nhận mã xác thực OTP:
      </p>

      <div>
        <label className="block text-slate-700 font-semibold mb-1.5 text-xs sm:text-sm">
          Tài khoản hoặc Email
        </label>
        <div className="relative">
          <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            required
            autoFocus
            placeholder="VD: admin, manager01 hoặc email@smartwms.vn"
            value={identifier}
            onChange={(e) => onIdentifierChange(e.target.value)}
            disabled={isSubmitting}
            className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all font-mono text-sm shadow-xs"
          />
        </div>
      </div>

      {/* Kênh nhận OTP */}
      <div>
        <label className="block text-slate-700 font-semibold mb-1.5 text-xs sm:text-sm">
          Phương thức nhận mã OTP
        </label>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => onChannelChange('SMS')}
            className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
              channel === 'SMS'
                ? 'bg-indigo-50 border-indigo-500 text-indigo-950 ring-2 ring-indigo-500/20 font-bold'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Smartphone className={`w-4 h-4 ${channel === 'SMS' ? 'text-indigo-600' : 'text-slate-400'}`} />
            <div>
              <div className="font-bold text-xs sm:text-sm text-slate-900">Tin nhắn SMS</div>
              <div className="text-[11px] text-slate-500 font-mono">SĐT nội bộ / di động</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onChannelChange('EMAIL')}
            className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
              channel === 'EMAIL'
                ? 'bg-indigo-50 border-indigo-500 text-indigo-950 ring-2 ring-indigo-500/20 font-bold'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Mail className={`w-4 h-4 ${channel === 'EMAIL' ? 'text-indigo-600' : 'text-slate-400'}`} />
            <div>
              <div className="font-bold text-xs sm:text-sm text-slate-900">Hộp thư Email</div>
              <div className="text-[11px] text-slate-500 font-mono">Mail công vụ</div>
            </div>
          </button>
        </div>
      </div>

      {/* Ô nhập số điện thoại khi chọn SMS */}
      {channel === 'SMS' && (
        <div className="animate-in fade-in duration-200">
          <label className="block text-slate-700 font-semibold mb-1.5 flex items-center justify-between text-xs sm:text-sm">
            <span>Số điện thoại nhận tin nhắn SMS OTP</span>
            <span className="text-[11px] text-indigo-600 font-medium">Mô phỏng tin nhắn SMS</span>
          </label>
          <div className="relative">
            <Smartphone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="VD: 0988 567 890 hoặc SĐT của bạn"
              value={phoneNumber}
              onChange={(e) => onPhoneNumberChange(e.target.value)}
              disabled={isSubmitting}
              className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all font-mono text-sm shadow-xs"
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors font-semibold text-xs sm:text-sm cursor-pointer"
        >
          Hủy
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md shadow-indigo-200 active:scale-95 disabled:opacity-50 cursor-pointer text-xs sm:text-sm"
        >
          {isSubmitting ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              <span>Gửi Mã Xác Thực OTP</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
};
