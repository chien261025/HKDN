import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface StepSuccessProps {
  identifier: string;
  onFinish: () => void;
}

export const StepSuccess: React.FC<StepSuccessProps> = ({ identifier, onFinish }) => {
  return (
    <div className="text-center py-4 space-y-4 animate-in fade-in">
      <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
        <CheckCircle2 className="w-8 h-8" />
      </div>
      <div>
        <h4 className="text-lg font-bold text-slate-900">Khôi Phục Mật Khẩu Thành Công!</h4>
        <p className="text-sm text-slate-600 mt-1 leading-relaxed">
          Mật khẩu mới của tài khoản <span className="font-mono text-indigo-700 font-bold">@{identifier}</span> đã được
          cập nhật và mã hóa an toàn vào cơ sở dữ liệu PostgreSQL.
        </p>
      </div>

      <button
        type="button"
        onClick={onFinish}
        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md shadow-indigo-200 cursor-pointer text-sm"
      >
        Đăng Nhập Ngay Với Mật Khẩu Mới
      </button>
    </div>
  );
};
