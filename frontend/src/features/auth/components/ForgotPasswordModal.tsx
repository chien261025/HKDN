import React, { useState, useEffect, useRef } from 'react';
import { X, KeyRound, AlertCircle } from 'lucide-react';
import { authService } from '../services/authService';
import { SimulatedNotificationBanner } from './forgot-password/SimulatedNotificationBanner';
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
  const [channel, setChannel] = useState<'SMS' | 'EMAIL'>('SMS');
  const [phoneNumber, setPhoneNumber] = useState('+84 988 567 890');

  // OTP State
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(180);
  const [showSimulatedSms, setShowSimulatedSms] = useState(false);
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

    const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(randomOtp);
    setCountdown(180);

    setTimeout(() => {
      setIsSubmitting(false);
      setStep('ENTER_OTP');
      setShowSimulatedSms(true);

      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    }, 600);
  };

  /**
   * Xử lý nhập OTP
   */
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otpDigits];
    newOtp[index] = value.slice(-1);
    setOtpDigits(newOtp);

    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleAutoFillOtp = () => {
    const digits = generatedOtp.split('');
    setOtpDigits(digits);
    setErrorMessage(null);
  };

  /**
   * Bước 2: Xác thực OTP
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
   * Bước 3: Lưu mật khẩu mới
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      {/* Push Notification Simulator */}
      {showSimulatedSms && (
        <SimulatedNotificationBanner
          channel={channel}
          phoneNumber={phoneNumber}
          identifier={identifier}
          generatedOtp={generatedOtp}
          onAutoFillOtp={handleAutoFillOtp}
          onClose={() => setShowSimulatedSms(false)}
        />
      )}

      {/* Main Modal */}
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden my-8 relative">
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
              channel={channel}
              onChannelChange={setChannel}
              phoneNumber={phoneNumber}
              onPhoneNumberChange={setPhoneNumber}
              isSubmitting={isSubmitting}
              onSubmit={handleSendOtp}
              onCancel={handleResetAll}
            />
          )}

          {step === 'ENTER_OTP' && (
            <StepOtp
              channel={channel}
              phoneNumber={phoneNumber}
              identifier={identifier}
              otpDigits={otpDigits}
              otpInputRefs={otpInputRefs}
              onOtpChange={handleOtpChange}
              onOtpKeyDown={handleOtpKeyDown}
              countdown={countdown}
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
