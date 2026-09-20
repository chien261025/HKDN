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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      
      {/* ================= THÔNG BÁO MÔ PHỎNG PUSH NOTIFICATION (SMS HOẶC EMAIL) ================= */}
      {showSimulatedSms && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[60] w-full max-w-md px-4 animate-in slide-in-from-top-6 duration-300">
          <div className={`p-4 bg-white border rounded-2xl shadow-2xl flex items-start gap-3.5 ${
            channel === 'SMS' 
              ? 'border-indigo-300 shadow-indigo-100' 
              : 'border-blue-300 shadow-blue-100'
          }`}>
            <div className={`p-2.5 rounded-xl border shrink-0 ${
              channel === 'SMS'
                ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                : 'bg-blue-50 text-blue-600 border-blue-200'
            }`}>
              {channel === 'SMS' ? <MessageSquare className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0 text-xs sm:text-sm">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900 flex items-center gap-2">
                  <span>SMART WMS</span>
                  <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md ${
                    channel === 'SMS' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {channel === 'SMS' ? 'SMS BRANDNAME' : 'GMAIL / OUTLOOK'}
                  </span>
                </span>
                <span className="text-xs text-slate-500 font-mono">Vừa xong</span>
              </div>
              <p className="text-slate-700 mt-1.5 leading-relaxed text-xs sm:text-sm">
                {channel === 'SMS' ? (
                  <>Gửi tới <span className="text-indigo-700 font-bold">{phoneNumber}</span>: Mã xác thực OTP của bạn là: <span className="font-mono font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-300 text-sm tracking-widest">{generatedOtp}</span> (Hiệu lực 3 phút).</>
                ) : (
                  <>Gửi tới <span className="text-blue-700 font-bold">{identifier.includes('@') ? identifier : `${identifier}@smartwms.vn`}</span>: Mã xác thực OTP là: <span className="font-mono font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-300 text-sm tracking-widest">{generatedOtp}</span> (Hiệu lực 3 phút).</>
                )}
              </p>
              <button
                type="button"
                onClick={handleAutoFillOtp}
                className="mt-2 text-xs text-indigo-600 hover:text-indigo-800 font-bold underline flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Bấm vào đây để tự động điền mã OTP này</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowSimulatedSms(false)}
              className="text-slate-400 hover:text-slate-700 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================= MODAL CHÍNH ================= */}
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden my-8 relative">
        {/* Top accent border */}
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700"></div>

        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Khôi Phục Mật Khẩu WMS</h3>
              <p className="text-xs text-slate-500 font-medium">Xác thực 2 lớp qua mã OTP (SMS / Email)</p>
            </div>
          </div>
          <button
            onClick={handleResetAll}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 space-y-4 text-sm">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs sm:text-sm animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          {/* ================= BƯỚC 1: NHẬP ĐỊNH DANH & CHỌN KÊNH ================= */}
          {step === 'INPUT_IDENTIFIER' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <p className="text-slate-600 leading-relaxed text-sm">
                Nhập <span className="font-bold text-slate-900">Tên đăng nhập</span> hoặc <span className="font-bold text-slate-900">Email công vụ</span> của bạn để nhận mã xác thực OTP:
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
                    onChange={(e) => setIdentifier(e.target.value)}
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
                    onClick={() => setChannel('SMS')}
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
                    onClick={() => setChannel('EMAIL')}
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
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      disabled={isSubmitting}
                      className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all font-mono text-sm shadow-xs"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResetAll}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors font-semibold text-xs sm:text-sm"
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
          )}

          {/* ================= BƯỚC 2: NHẬP MÃ OTP ================= */}
          {step === 'ENTER_OTP' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <p className="text-slate-600 text-xs sm:text-sm">
                  Mã OTP đã được gửi đến {channel === 'SMS' ? `tin nhắn SMS số ${phoneNumber}` : `hộp thư email ${identifier.includes('@') ? identifier : `${identifier}@smartwms.vn`}`}:
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
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-12 h-14 text-center text-xl font-black font-mono text-slate-900 bg-white border-2 border-slate-300 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all shadow-xs"
                  />
                ))}
              </div>

              {/* Đồng hồ đếm ngược & Gửi lại */}
              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <div className="flex items-center gap-1.5 font-mono font-medium text-slate-700">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Mã hết hạn sau: <strong className="text-indigo-600">{formatTime(countdown)}</strong></span>
                </div>

                <button
                  type="button"
                  disabled={countdown > 0}
                  onClick={handleSendOtp}
                  className="text-indigo-600 hover:text-indigo-800 disabled:opacity-40 disabled:hover:text-indigo-600 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Gửi lại mã</span>
                </button>
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setStep('INPUT_IDENTIFIER')}
                  className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium text-xs sm:text-sm"
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
          )}

          {/* ================= BƯỚC 3: ĐẶT MẬT KHẨU MỚI ================= */}
          {step === 'NEW_PASSWORD' && (
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs sm:text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span className="font-semibold">Xác thực OTP thành công! Vui lòng nhập mật khẩu mới:</span>
              </div>

              {/* Mật khẩu mới */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1 text-xs sm:text-sm">
                  Mật Khẩu Mới (≥ 6 ký tự) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Nhập mật khẩu mới an toàn"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Xác nhận mật khẩu mới */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1 text-xs sm:text-sm">
                  Xác Nhận Mật Khẩu Mới <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Gõ lại mật khẩu mới"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 font-mono text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md shadow-indigo-200 active:scale-95 disabled:opacity-50 cursor-pointer text-sm"
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
            <div className="text-center py-4 space-y-4 animate-in fade-in">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900">Khôi Phục Mật Khẩu Thành Công!</h4>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                  Mật khẩu mới của tài khoản <span className="font-mono text-indigo-700 font-bold">@{identifier}</span> đã được cập nhật và mã hóa an toàn vào cơ sở dữ liệu PostgreSQL.
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetAll}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-md shadow-indigo-200 cursor-pointer text-sm"
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
