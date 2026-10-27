import React, { useState, useEffect, useRef } from 'react';
import { X, KeyRound, AlertCircle } from 'lucide-react';
import { authService } from '../services/authService';
import { StepIdentifier } from './forgot-password/StepIdentifier';
import { StepOtp } from './forgot-password/StepOtp';
import { StepNewPassword } from './forgot-password/StepNewPassword';
import { StepSuccess } from './forgot-password/StepSuccess';

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

  // Target email and OTP digits
  const [targetEmail, setTargetEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(180);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // New Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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
    setTargetEmail('');
    setOtpDigits(['', '', '', '', '', '']);
    setCountdown(180);
    setNewPassword('');
    setConfirmPassword('');
    setErrorMessage(null);
    onClose();
  };

  /**
   * Bước 1: Gửi mã xác thực OTP qua Email hoặc SMS
   */
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMessage('Vui lòng nhập tên đăng nhập hoặc email.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await authService.sendForgotPasswordOtp(identifier.trim());
      setIsSubmitting(false);
      setTargetEmail(res.email || identifier.trim());
      setCountdown(res.expiresInSeconds || 180);
      setStep('ENTER_OTP');

      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'Không thể gửi mã xác thực. Vui lòng kiểm tra lại tài khoản hoặc email!');
    }
  };

  /**
   * Gọi xác thực OTP với máy chủ (Tự động hoặc khi bấm nút)
   */
  const executeVerifyOtp = async (code: string) => {
    if (code.length < 6 || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await authService.verifyForgotPasswordOtp(identifier.trim(), code);
      setIsSubmitting(false);
      setStep('NEW_PASSWORD');
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'Mã xác thực không chính xác hoặc đã hết hạn.');
    }
  };

  /**
   * Xử lý nhập OTP & Tự động gửi khi điền đủ 6 số
   */
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otpDigits];
    newOtp[index] = value.slice(-1);
    setOtpDigits(newOtp);

    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Tự động gửi xác thực ngay khi điền đủ 6 số
    const fullCode = newOtp.join('');
    if (fullCode.length === 6 && !newOtp.includes('')) {
      executeVerifyOtp(fullCode);
    }
  };

  const handleOtpPaste = (pasted: string) => {
    const digits = pasted.split('').slice(0, 6);
    const newOtp = [...otpDigits];
    digits.forEach((d, i) => {
      newOtp[i] = d;
    });
    setOtpDigits(newOtp);
    if (digits.length === 6) {
      executeVerifyOtp(digits.join(''));
    } else {
      otpInputRefs.current[digits.length]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  /**
   * Bước 2: Xác thực OTP với máy chủ khi submit form
   */
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const enteredCode = otpDigits.join('');

    if (enteredCode.length < 6) {
      setErrorMessage('Vui lòng nhập đủ 6 chữ số của mã xác thực.');
      return;
    }

    executeVerifyOtp(enteredCode);
  };

  /**
   * Bước 3: Lưu mật khẩu mới
   */
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (newPassword.length < 6) {
      setErrorMessage('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Xác nhận mật khẩu mới không khớp.');
      return;
    }

    setIsSubmitting(true);

    try {
      const enteredCode = otpDigits.join('');
      await authService.resetForgottenPassword(identifier.trim(), newPassword.trim(), enteredCode);
      setStep('SUCCESS');
      if (onPrefillUsername) {
        onPrefillUsername(identifier.trim());
      }
    } catch (err: any) {
      console.error('Lỗi đặt lại mật khẩu:', err);
      setErrorMessage(err.message || 'Không thể cập nhật mật khẩu. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      {/* Main Modal */}
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden my-8 relative">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Khôi Phục Mật Khẩu</h3>
              <p className="text-xs text-slate-500 font-medium">Xác thực danh tính để thiết lập lại mật khẩu</p>
            </div>
          </div>
          <button
            onClick={handleResetAll}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-sm">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs sm:text-sm animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          {step === 'INPUT_IDENTIFIER' && (
            <StepIdentifier
              identifier={identifier}
              onIdentifierChange={setIdentifier}
              isSubmitting={isSubmitting}
              onSubmit={handleSendOtp}
              onCancel={handleResetAll}
            />
          )}

          {step === 'ENTER_OTP' && (
            <StepOtp
              identifier={identifier}
              targetEmail={targetEmail}
              otpDigits={otpDigits}
              otpInputRefs={otpInputRefs}
              onOtpChange={handleOtpChange}
              onOtpKeyDown={handleOtpKeyDown}
              onOtpPaste={handleOtpPaste}
              countdown={countdown}
              isSubmitting={isSubmitting}
              onResendOtp={handleSendOtp}
              onBackToIdentifier={() => setStep('INPUT_IDENTIFIER')}
              onSubmit={handleVerifyOtp}
            />
          )}

          {step === 'NEW_PASSWORD' && (
            <StepNewPassword
              newPassword={newPassword}
              onNewPasswordChange={setNewPassword}
              confirmPassword={confirmPassword}
              onConfirmPasswordChange={setConfirmPassword}
              isSubmitting={isSubmitting}
              onSubmit={handleResetPasswordSubmit}
            />
          )}

          {step === 'SUCCESS' && (
            <StepSuccess
              identifier={identifier}
              onFinish={handleResetAll}
            />
          )}
        </div>
      </div>
    </div>
  );
};
