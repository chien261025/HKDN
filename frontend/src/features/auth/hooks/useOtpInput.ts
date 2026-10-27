import { useState, useEffect, useRef, useCallback } from 'react';

interface UseOtpInputProps {
  length?: number;
  initialCountdown?: number;
  isActive?: boolean;
  onComplete?: (code: string) => void;
}

export const useOtpInput = ({
  length = 6,
  initialCountdown = 180,
  isActive = false,
  onComplete,
}: UseOtpInputProps = {}) => {
  const [otpDigits, setOtpDigits] = useState<string[]>(() => Array(length).fill(''));
  const [countdown, setCountdown] = useState<number>(initialCountdown);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Bộ đếm thời gian hiệu lực OTP
  useEffect(() => {
    if (!isActive || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [isActive, countdown]);

  const handleOtpChange = useCallback(
    (index: number, value: string) => {
      if (!/^\d*$/.test(value)) return;

      const newOtp = [...otpDigits];
      newOtp[index] = value.slice(-1);
      setOtpDigits(newOtp);

      if (value && index < length - 1) {
        otpInputRefs.current[index + 1]?.focus();
      }

      const fullCode = newOtp.join('');
      if (fullCode.length === length && !newOtp.includes('')) {
        onComplete?.(fullCode);
      }
    },
    [otpDigits, length, onComplete]
  );

  const handleOtpPaste = useCallback(
    (pasted: string) => {
      const cleanDigits = pasted.replace(/\D/g, '').split('').slice(0, length);
      const newOtp = [...otpDigits];
      cleanDigits.forEach((d, i) => {
        newOtp[i] = d;
      });
      setOtpDigits(newOtp);

      if (cleanDigits.length === length) {
        onComplete?.(cleanDigits.join(''));
      } else {
        otpInputRefs.current[cleanDigits.length]?.focus();
      }
    },
    [otpDigits, length, onComplete]
  );

  const handleOtpKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
        otpInputRefs.current[index - 1]?.focus();
      }
    },
    [otpDigits]
  );

  const resetOtp = useCallback(
    (newCountdown = 180) => {
      setOtpDigits(Array(length).fill(''));
      setCountdown(newCountdown);
    },
    [length]
  );

  const focusFirst = useCallback(() => {
    setTimeout(() => {
      otpInputRefs.current[0]?.focus();
    }, 100);
  }, []);

  return {
    otpDigits,
    countdown,
    otpInputRefs,
    handleOtpChange,
    handleOtpPaste,
    handleOtpKeyDown,
    resetOtp,
    focusFirst,
    setCountdown,
  };
};
