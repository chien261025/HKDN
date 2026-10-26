import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { NotificationMessage, ToastItem } from '../types';
import { notificationService } from '../services/notificationService';

interface NotificationContextType {
  notifications: NotificationMessage[];
  unreadCount: number;
  toasts: ToastItem[];
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addToast: (item: Partial<ToastItem> & { title: string; message: string }) => void;
  removeToast: (toastId: string) => void;
  refreshNotifications: () => Promise<void>;
  triggerTestAlert: (title?: string, message?: string, severity?: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Web Audio API chime tone (nhẹ nhàng, không cần file .mp3 ngoại lai)
const playNotificationSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Không làm gián đoạn UI nếu trình duyệt chặn autoplay audio
  }
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const refreshNotifications = useCallback(async () => {
    const list = await notificationService.getRecentNotifications();
    setNotifications(list);
  }, []);

  const removeToast = useCallback((toastId: string) => {
    setToasts((prev) => prev.filter((t) => t.toastId !== toastId));
  }, []);

  const addToast = useCallback((item: Partial<ToastItem> & { title: string; message: string }) => {
    const toastId = 'toast-' + Math.random().toString(36).substring(2, 9);
    const duration = item.duration || 6000;
    const newToast: ToastItem = {
      toastId,
      id: item.id || toastId,
      type: item.type || 'SYSTEM_ALERT',
      title: item.title,
      message: item.message,
      severity: item.severity || 'INFO',
      referenceCode: item.referenceCode,
      link: item.link,
      timestamp: item.timestamp || new Date().toISOString(),
      read: false,
      duration,
    };

    setToasts((prev) => [newToast, ...prev.slice(0, 4)]); // Tối đa 5 toast cùng lúc

    setTimeout(() => {
      removeToast(toastId);
    }, duration);
  }, [removeToast]);

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    await notificationService.markAsRead(id);
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await notificationService.markAllAsRead();
  }, []);

  const triggerTestAlert = useCallback(
    async (
      title: string = 'Kiểm Tra Thông Báo Thời Gian Thực',
      message: string = 'Hạ tầng SSE & WebSocket Smart WMS đang hoạt động xuất sắc!',
      severity: string = 'SUCCESS'
    ) => {
      await notificationService.sendTestNotification(title, message, severity);
    },
    []
  );

  // Khởi tạo tải dữ liệu và lắng nghe SSE Real-time
  useEffect(() => {
    refreshNotifications();

    const unsubscribe = notificationService.createNotificationStream((msg) => {
      playNotificationSound();
      setNotifications((prev) => [msg, ...prev.filter((n) => n.id !== msg.id)]);
      addToast({
        ...msg,
        duration: 7000,
      });
    });

    return () => {
      unsubscribe();
    };
  }, [refreshNotifications, addToast]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        toasts,
        markAsRead,
        markAllAsRead,
        addToast,
        removeToast,
        refreshNotifications,
        triggerTestAlert,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
