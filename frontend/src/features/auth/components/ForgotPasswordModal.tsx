import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mail,
  Shield,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Smartphone,
  MessageSquare,
  Clock,
  RotateCcw,
  Lock,
  Eye,
  EyeOff,
  BellRing,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { authService } from '../services/authService';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPrefillUsername?: (username: string) => void;
}

type Step = 'INPUT_IDENTIFIER' | 'ENTER_OTP' | 'NEW_PASSWORD' | 'SUCCESS';

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  onPrefillUsername,
}) => {
  const [step, setStep] = useState<Step>('INPUT_IDENTIFIER');
  const [identifier, setIdentifier] = useState('');
  const [channel, setChannel] = useState<'SMS' | 'EMAIL'>('SMS');
  const [phoneNumber, setPhoneNumber] = useState('+84 988 567 890');

  // OTP State
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(180); // 3 minutes
  const [showSimulatedSms, setShowSimulatedSms] = useState(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // New Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // General Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Countdown timer for OTP
  useEffect(() => {
    let timer: any;
    if (step === 'ENTER_OTP' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  if (!isOpen) return null;

  const handleResetAll = () => {
    setStep('INPUT_IDENTIFIER');
    setIdentifier('');
    setPhoneNumber('+84 988 567 890');
    setGeneratedOtp('');
    setOtpDigits(['', '', '', '', '', '']);
    setCountdown(180);
    setShowSimulatedSms(false);
    setNewPassword('');
    setConfirmPassword('');
    setErrorMessage(null);
    onClose();
  };

  /**
   * Bước 1: Gửi mã xác thực OTP
   */
  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMessage('Vui lòng nhập Tên đăng nhập hoặc Email công vụ!');
      return;
    }

    if (channel === 'SMS' && !phoneNumber.trim()) {
      setErrorMessage('Vui lòng nhập số điện thoại để nhận tin nhắn SMS!');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    // Sinh mã ngẫu nhiên 6 chữ số
    const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(randomOtp);
    setCountdown(180);

    setTimeout(() => {
      setIsSubmitting(false);
      setStep('ENTER_OTP');
      setShowSimulatedSms(true);

      // Tự động focus ô đầu tiên
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    }, 600);
  };

  /**
   * Xử lý nhập từng ký tự OTP
   */
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otpDigits];
    newOtp[index] = value.slice(-1);
    setOtpDigits(newOtp);

    // Tự động nhảy sang ô kế tiếp
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  /**
   * Tự động điền nhanh mã OTP từ thông báo mô phỏng
   */
  const handleAutoFillOtp = () => {
    const digits = generatedOtp.split('');
    setOtpDigits(digits);
    setErrorMessage(null);
  };

  /**
   * Bước 2: Xác nhận mã OTP
   */
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const enteredCode = otpDigits.join('');

    if (enteredCode.length < 6) {
      setErrorMessage('Vui lòng nhập đủ 6 chữ số của mã OTP!');
      return;
    }

    if (enteredCode !== generatedOtp) {
      setErrorMessage('Mã xác thực OTP không chính xác. Vui lòng kiểm tra lại!');
      return;
    }

    setErrorMessage(null);
    setShowSimulatedSms(false);
    setStep('NEW_PASSWORD');
  };

  /**
   * Bước 3: Đặt lại mật khẩu mới vào cơ sở dữ liệu
   */
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (newPassword.length < 6) {
      setErrorMessage('Mật khẩu mới phải có tối thiểu 6 ký tự!');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Xác nhận mật khẩu mới không khớp!');
      return;
    }

    setIsSubmitting(true);

    try {
      await authService.resetForgottenPassword(identifier.trim(), newPassword.trim());

      setStep('SUCCESS');
      if (onPrefillUsername) {
        onPrefillUsername(identifier.trim());
      }
    } catch (err: any) {
      console.error('Lỗi đặt lại mật khẩu:', err);
      setErrorMessage(err.message || 'Không thể cập nhật mật khẩu. Vui lòng thử lại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200">
      
      {/* ================= THÔNG BÁO MÔ PHỎNG PUSH NOTIFICATION (SMS HOẶC EMAIL) ================= */}
      {showSimulatedSms && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[60] w-full max-w-md px-4 animate-in slide-in-from-top-6 duration-300">
          <div className={`p-3.5 bg-slate-900/95 border rounded-2xl shadow-2xl backdrop-blur-xl flex items-start gap-3 ${
            channel === 'SMS' 
              ? 'border-cyan-500/50 shadow-cyan-950/60' 
              : 'border-indigo-500/50 shadow-indigo-950/60'
          }`}>
            <div className={`p-2 rounded-xl border shrink-0 ${
              channel === 'SMS'
                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
            }`}>
              {channel === 'SMS' ? <MessageSquare className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-white flex items-center gap-1.5">
                  <span>SMART WMS</span>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                    channel === 'SMS' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-indigo-500/20 text-indigo-300'
                  }`}>
                    {channel === 'SMS' ? 'SMS BRANDNAME' : 'GMAIL / OUTLOOK'}
                  </span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Vừa xong</span>
              </div>
              <p className="text-slate-300 mt-1 leading-relaxed">
                {channel === 'SMS' ? (
                  <>Gửi tới <span className="text-cyan-300 font-semibold">{phoneNumber}</span>: Mã xác thực OTP của bạn là: <span className="font-mono font-black text-amber-300 text-sm tracking-widest">{generatedOtp}</span> (Hiệu lực 3 phút).</>
                ) : (
                  <>Gửi tới <span className="text-indigo-300 font-semibold">{identifier.includes('@') ? identifier : `${identifier}@smartwms.vn`}</span>: Mã xác thực OTP là: <span className="font-mono font-black text-amber-300 text-sm tracking-widest">{generatedOtp}</span> (Hiệu lực 3 phút).</>
                )}
              </p>
              <button
                type="button"
                onClick={handleAutoFillOtp}
                className="mt-1.5 text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold underline flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Bấm vào đây để tự động điền mã OTP này</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowSimulatedSms(false)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL CHÍNH ================= */}
      <div className="bg-[#0b101d] border border-slate-700/80 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden my-8 relative">
        {/* Glow ambient */}
        <div className="absolute top-0 right-1/4 w-48 h-24 bg-indigo-600/20 rounded-full blur-2xl pointer-events-none -z-10"></div>
        <div className="absolute bottom-0 left-1/4 w-48 h-24 bg-cyan-600/15 rounded-full blur-2xl pointer-events-none -z-10"></div>

        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Khôi Phục Mật Khẩu WMS</h3>
              <p className="text-[11px] text-slate-400">Xác thực 2 lớp qua mã OTP (SMS / Email)</p>
            </div>
          </div>
          <button
            onClick={handleResetAll}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl flex items-center gap-2 text-rose-300 text-xs animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ================= BƯỚC 1: NHẬP ĐỊNH DANH & CHỌN KÊNH ================= */}
          {step === 'INPUT_IDENTIFIER' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <p className="text-slate-300 leading-relaxed">
                Nhập <span className="font-semibold text-white">Tên đăng nhập</span> hoặc <span className="font-semibold text-white">Email công vụ</span> của bạn để nhận mã xác thực OTP:
              </p>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Tài khoản hoặc Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="VD: admin, manager01 hoặc email@smartwms.vn"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all font-mono"
                  />
                </div>
              </div>

              {/* Kênh nhận OTP */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Phương thức nhận mã OTP
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setChannel('SMS')}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                      channel === 'SMS'
                        ? 'bg-indigo-950/40 border-indigo-500 text-white ring-1 ring-indigo-500/50'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 text-indigo-400" />
                    <div>
                      <div className="font-bold text-[11px]">Tin nhắn SMS</div>
                      <div className="text-[10px] text-slate-500 font-mono">SĐT nội bộ / di động</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setChannel('EMAIL')}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                      channel === 'EMAIL'
                        ? 'bg-cyan-950/40 border-cyan-500 text-white ring-1 ring-cyan-500/50'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Mail className="w-4 h-4 text-cyan-400" />
                    <div>
                      <div className="font-bold text-[11px]">Hộp thư Email</div>
                      <div className="text-[10px] text-slate-500 font-mono">Mail công vụ</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Ô nhập số điện thoại khi chọn SMS */}
              {channel === 'SMS' && (
                <div className="animate-in fade-in duration-200">
                  <label className="block text-slate-300 font-semibold mb-1.5 flex items-center justify-between">
                    <span>Số điện thoại nhận tin nhắn SMS OTP</span>
                    <span className="text-[10px] text-indigo-400 font-normal">Mô phỏng tin nhắn SMS</span>
                  </label>
                  <div className="relative">
                    <Smartphone className="w-4 h-4 text-indigo-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="VD: 0988 567 890 hoặc SĐT của bạn"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all font-mono"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResetAll}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-900/30 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>Gửi Mã Xác Thực OTP</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ================= BƯỚC 2: NHẬP MÃ OTP ================= */}
          {step === 'ENTER_OTP' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center space-y-1">
                <p className="text-slate-300">
                  Mã OTP đã được gửi đến {channel === 'SMS' ? `tin nhắn SMS số ${phoneNumber}` : `hộp thư email ${identifier.includes('@') ? identifier : `${identifier}@smartwms.vn`}`}:
                </p>
                <p className="font-mono font-bold text-cyan-300">
                  {channel === 'SMS' ? phoneNumber : identifier}
                </p>
              </div>

              {/* 6 ô nhập mã OTP */}
              <div className="flex justify-center gap-2 py-2">
                {otpDigits.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (otpInputRefs.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-11 h-12 text-center text-lg font-black font-mono text-white bg-slate-950 border border-slate-700 rounded-xl focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all shadow-inner"
                  />
                ))}
              </div>

              {/* Đồng hồ đếm ngược & Gửi lại */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <div className="flex items-center gap-1 font-mono text-cyan-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Mã hết hạn sau: {formatTime(countdown)}</span>
                </div>

                <button
                  type="button"
                  disabled={countdown > 0}
                  onClick={handleSendOtp}
                  className="text-indigo-400 hover:text-indigo-300 disabled:opacity-40 disabled:hover:text-indigo-400 flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Gửi lại mã</span>
                </button>
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setStep('INPUT_IDENTIFIER')}
                  className="flex items-center gap-1 text-slate-400 hover:text-white"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Đổi tài khoản</span>
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-md shadow-indigo-900/30 active:scale-95 cursor-pointer"
                >
                  Xác Thực OTP
                </button>
              </div>
            </form>
          )}

          {/* ================= BƯỚC 3: ĐẶT MẬT KHẨU MỚI ================= */}
          {step === 'NEW_PASSWORD' && (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-[11px] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Xác thực OTP thành công! Vui lòng nhập mật khẩu mới:</span>
              </div>

              {/* Mật khẩu mới */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Mật Khẩu Mới (≥ 6 ký tự) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Nhập mật khẩu mới an toàn"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full pl-9 pr-9 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-white font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Xác nhận mật khẩu mới */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Xác Nhận Mật Khẩu Mới <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Gõ lại mật khẩu mới"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full pl-9 pr-9 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-white font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-md shadow-indigo-900/30 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
                  ) : (
                    <span>Cập Nhật Mật Khẩu Mới</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ================= BƯỚC 4: THÀNH CÔNG ================= */}
          {step === 'SUCCESS' && (
            <div className="text-center py-4 space-y-3.5 animate-in fade-in">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Khôi Phục Mật Khẩu Thành Công!</h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Mật khẩu mới của tài khoản <span className="font-mono text-cyan-300 font-bold">@{identifier}</span> đã được cập nhật và mã hóa an toàn vào cơ sở dữ liệu PostgreSQL.
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetAll}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-md shadow-indigo-900/40 cursor-pointer"
              >
                Đăng Nhập Ngay Với Mật Khẩu Mới
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
