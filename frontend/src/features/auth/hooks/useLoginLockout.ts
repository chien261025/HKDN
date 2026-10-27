import { useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import { getDeviceFingerprint } from '../utils/deviceFingerprint';

const getStoredLockoutSeconds = (u: string): number => {
  if (!u?.trim()) return 0;
  const stored = localStorage.getItem(`wms_lockout_${u.trim().toLowerCase()}`);
  if (!stored) return 0;
  const remaining = Math.max(0, Math.ceil((parseInt(stored, 10) - Date.now()) / 1000));
  if (remaining <= 0) {
    localStorage.removeItem(`wms_lockout_${u.trim().toLowerCase()}`);
    return 0;
  }
  return remaining;
};

export const useLoginLockout = (username: string, onLockoutExpired?: () => void) => {
  const [lockoutRemainingSec, setLockoutRemainingSec] = useState(() =>
    getStoredLockoutSeconds(username)
  );
  const [lockLevel, setLockLevel] = useState<number>(1);

  // Bộ đếm lùi thời gian thực mỗi giây
  useEffect(() => {
    if (lockoutRemainingSec <= 0) return;
    const timer = setInterval(() => {
      setLockoutRemainingSec((prev) => {
        if (prev <= 1) {
          if (username.trim()) {
            localStorage.removeItem(`wms_lockout_${username.trim().toLowerCase()}`);
          }
          onLockoutExpired?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutRemainingSec, username, onLockoutExpired]);

  // Kiểm tra khóa thực tế từ máy chủ (Hỗ trợ chống Tab ẩn danh qua IP & DFP)
  useEffect(() => {
    let isMounted = true;
    const checkCurrentLockout = async () => {
      const dfp = getDeviceFingerprint();
      try {
        const res = await authService.checkLockout(username, dfp);
        if (!isMounted) return;
        if (res.blocked && res.remainingSeconds > 0) {
          setLockoutRemainingSec(res.remainingSeconds);
          setLockLevel(res.lockLevel || 1);
          if (username.trim()) {
            localStorage.setItem(
              `wms_lockout_${username.trim().toLowerCase()}`,
              (Date.now() + res.remainingSeconds * 1000).toString()
            );
          }
        } else {
          setLockoutRemainingSec(0);
          if (username.trim()) {
            localStorage.removeItem(`wms_lockout_${username.trim().toLowerCase()}`);
          }
        }
      } catch {
        if (!isMounted) return;
        const localSec = getStoredLockoutSeconds(username);
        setLockoutRemainingSec(localSec);
      }
    };
    checkCurrentLockout();
    return () => { isMounted = false; };
  }, [username]);

  const handleLockoutFromError = useCallback((err: any, targetUser: string) => {
    const apiMsg = err.response?.data?.message || err.message || '';
    const secMatch = apiMsg.match(/sau\s+(\d+)\s+giây/);
    const minMatch = apiMsg.match(/bị tạm khóa\s+(\d+)\s+phút/);
    const isLocked = err.response?.status === 400 && (secMatch || minMatch);

    if (isLocked) {
      let sec = 60;
      if (secMatch) sec = parseInt(secMatch[1], 10);
      else if (minMatch) sec = parseInt(minMatch[1], 10) * 60;

      setLockoutRemainingSec(sec);
      if (sec > 180) setLockLevel(3);
      else if (sec > 60) setLockLevel(2);
      else setLockLevel(1);

      if (targetUser.trim()) {
        localStorage.setItem(
          `wms_lockout_${targetUser.trim().toLowerCase()}`,
          (Date.now() + sec * 1000).toString()
        );
      }
    } else {
      setLockoutRemainingSec(0);
      if (targetUser.trim()) {
        localStorage.removeItem(`wms_lockout_${targetUser.trim().toLowerCase()}`);
      }
    }
  }, []);

  const formatMinsSecs = useCallback((sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, []);

  return {
    lockoutRemainingSec,
    lockLevel,
    setLockoutRemainingSec,
    handleLockoutFromError,
    formatMinsSecs,
  };
};
