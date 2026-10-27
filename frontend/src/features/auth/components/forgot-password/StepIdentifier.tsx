import React from 'react';
import { Mail, ArrowRight } from 'lucide-react';

interface StepIdentifierProps {
  identifier: string;
  onIdentifierChange: (val: string) => void;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export const StepIdentifier: React.FC<StepIdentifierProps> = ({
  identifier,
  onIdentifierChange,
  isSubmitting,
  onSubmit,
  onCancel,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <p className="text-slate-600 leading-relaxed text-xs sm:text-sm">
        Vui lòng nhập <span className="font-semibold text-slate-900">Tên đăng nhập</span> hoặc{' '}
        <span className="font-semibold text-slate-900">Email</span> đã liên kết với tài khoản để nhận mã xác thực (OTP) qua hòm thư:
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
            placeholder="Nhập tên đăng nhập hoặc email"
            value={identifier}
            onChange={(e) => onIdentifierChange(e.target.value)}
            disabled={isSubmitting}
            className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all font-medium text-sm shadow-xs"
          />
        </div>
      </div>

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
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md shadow-indigo-100 active:scale-95 disabled:opacity-50 cursor-pointer text-xs sm:text-sm"
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
