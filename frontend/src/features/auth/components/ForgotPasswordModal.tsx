import React, { useState, useCallback } from 'react';
import { X, KeyRound, AlertCircle } from 'lucide-react';
import { authService } from '../services/authService';
import { StepIdentifier } from './forgot-password/StepIdentifier';
import { StepOtp } from './forgot-password/StepOtp';
import { StepNewPassword } from './forgot-password/StepNewPassword';
import { StepSuccess } from './forgot-password/StepSuccess';
import { useOtpInput } from '../hooks/useOtpInput';

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
  const [targetEmail, setTargetEmail] = useState('');

  // New Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const executeVerifyOtp = useCallback(async (code: string) => {
    if (code.length < 6 || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await authService.verifyForgotPasswordOtp(identifier.trim(), code);
      setIsSubmitting(false);
      setStep('NEW_PASSWORD');
    } catch (err: unknown) {
      setIsSubmitting(false);
      const msg = err instanceof Error ? err.message : 'Mã xác thực không chính xác hoặc đã hết hạn.';
      setErrorMessage(msg);
    }
  }, [identifier, isSubmitting]);

  const {
    otpDigits,
    countdown,
    otpInputRefs,
    handleOtpChange,
    handleOtpPaste,
    handleOtpKeyDown,
    resetOtp,
    focusFirst,
    setCountdown,
  } = useOtpInput({
    length: 6,
    initialCountdown: 180,
    isActive: step === 'ENTER_OTP',
    onComplete: executeVerifyOtp,
  });

  if (!isOpen) return null;

  const handleResetAll = () => {
    setStep('INPUT_IDENTIFIER');
    setIdentifier('');
    setTargetEmail('');
    resetOtp(180);
    setNewPassword('');
    setConfirmPassword('');
    setErrorMessage(null);
    onClose();
  };

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
      focusFirst();
    } catch (err: unknown) {
      setIsSubmitting(false);
      const msg = err instanceof Error ? err.message : 'Không thể gửi mã xác thực. Vui lòng thử lại!';
      setErrorMessage(msg);
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const enteredCode = otpDigits.join('');
    if (enteredCode.length < 6) {
      setErrorMessage('Vui lòng nhập đủ 6 chữ số của mã xác thực.');
      return;
    }
    executeVerifyOtp(enteredCode);
  };

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
    } catch (err: unknown) {
      console.error('Lỗi đặt lại mật khẩu:', err);
      const msg = err instanceof Error ? err.message : 'Không thể cập nhật mật khẩu. Vui lòng thử lại sau.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
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
