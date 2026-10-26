import { apiClient } from '../../../services/api';
import { NotificationMessage } from '../types';

export const notificationService = {
  /**
   * Lấy danh sách thông báo gần đây nhất (tối đa 50 thông báo)
   */
  async getRecentNotifications(): Promise<NotificationMessage[]> {
    try {
      const res = await apiClient.get<{ success: boolean; data: NotificationMessage[] }>('/notifications/recent');
      return res.data.data || [];
    } catch (err) {
      console.error('[NotificationService] Lỗi khi tải danh sách thông báo:', err);
      return [];
    }
  },

  /**
   * Đánh dấu 1 thông báo đã đọc
   */
  async markAsRead(id: string): Promise<boolean> {
    try {
      await apiClient.put(`/notifications/${id}/read`);
      return true;
    } catch (err) {
      console.error('[NotificationService] Lỗi khi đánh dấu đã đọc:', err);
      return false;
    }
  },

  /**
   * Đánh dấu tất cả thông báo đã đọc
   */
  async markAllAsRead(): Promise<boolean> {
    try {
      await apiClient.put('/notifications/read-all');
      return true;
    } catch (err) {
      console.error('[NotificationService] Lỗi khi đánh dấu tất cả đã đọc:', err);
      return false;
    }
  },

  /**
   * Gửi thông báo thử nghiệm từ hệ thống
   */
  async sendTestNotification(
    title: string = 'Thử nghiệm thông báo',
    message: string = 'Hệ thống Real-Time Notification đang hoạt động ổn định.',
    severity: string = 'INFO'
  ): Promise<NotificationMessage | null> {
    try {
      const res = await apiClient.post<{ success: boolean; data: NotificationMessage }>('/notifications/test', {
        type: 'SYSTEM_ALERT',
        title,
        message,
        severity,
      });
      return res.data.data;
    } catch (err) {
      console.error('[NotificationService] Lỗi gửi thông báo thử nghiệm:', err);
      return null;
    }
  },

  /**
   * Mở kênh Server-Sent Events (SSE) thời gian thực
   * Tự động giải phóng kết nối khi Component Unmount
   */
  createNotificationStream(
    onMessage: (notification: NotificationMessage) => void,
    onError?: (err: any) => void
  ): () => void {
    const streamUrl = '/api/notifications/stream';
    let eventSource: EventSource | null = null;
    let isDisposed = false;

    const connect = () => {
      if (isDisposed) return;
      try {
        eventSource = new EventSource(streamUrl);

        eventSource.addEventListener('notification', (e: MessageEvent) => {
          try {
            const data: NotificationMessage = JSON.parse(e.data);
            onMessage(data);
          } catch (parseErr) {
            console.error('[NotificationService] Lỗi parse dữ liệu SSE:', parseErr);
          }
        });

        eventSource.onopen = () => {
          // Connected
        };

        eventSource.onerror = (e) => {
          if (onError) onError(e);
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          // Thử kết nối lại sau 5s nếu chưa unmount
          if (!isDisposed) {
            setTimeout(connect, 5000);
          }
        };
      } catch (e) {
        if (onError) onError(e);
      }
    };

    connect();

    return () => {
      isDisposed = true;
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
    };
  },
};
