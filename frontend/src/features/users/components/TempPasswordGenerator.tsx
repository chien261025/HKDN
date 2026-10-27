import React from 'react';

interface TempPasswordGeneratorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const TempPasswordGenerator: React.FC<TempPasswordGeneratorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    onChange(result);
  };

  return (
    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-slate-700 font-semibold text-xs">
          Mật Khẩu Khởi Tạo Ban Đầu
        </label>
        <button
          type="button"
          onClick={handleGeneratePassword}
          disabled={disabled}
          className="text-xs text-indigo-600 hover:underline font-semibold font-mono cursor-pointer"
        >
          + Tự động tạo ngẫu nhiên
        </button>
      </div>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
        />
      </div>
      {/* Password Strength Indicator */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-2xs font-semibold">
          <span className="text-slate-500">Độ an toàn mật khẩu:</span>
          <span className={value.length >= 8 ? 'text-emerald-700 font-bold' : 'text-amber-700'}>
            {value.length >= 8 ? 'Chuẩn Enterprise (OWASP)' : 'Cơ bản (Khuyến nghị >= 8 ký tự)'}
          </span>
        </div>
        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden flex gap-0.5">
          <div className={`h-full flex-1 ${value.length >= 4 ? 'bg-rose-500' : 'bg-transparent'}`} />
          <div className={`h-full flex-1 ${value.length >= 6 ? 'bg-amber-500' : 'bg-transparent'}`} />
          <div className={`h-full flex-1 ${value.length >= 8 ? 'bg-emerald-500' : 'bg-transparent'}`} />
          <div className={`h-full flex-1 ${value.length >= 10 && /[!@#$%^&*]/.test(value) ? 'bg-indigo-600' : 'bg-transparent'}`} />
        </div>
      </div>
      <p className="text-2xs text-slate-500 font-sans">
        Mật khẩu được mã hóa một chiều bằng thuật toán <strong>BCrypt (10 rounds)</strong> trước khi ghi vào CSDL.
      </p>
    </div>
  );
};
