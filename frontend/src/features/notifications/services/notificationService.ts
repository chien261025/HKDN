import { apiClient } from '../../../services/api';
import { STORAGE_KEYS } from '../../../constants';
import { getDeviceFingerprint } from '../../auth/utils/deviceFingerprint';
import { NotificationMessage } from '../types';

export const notificationService = {
  /**
   * Lấy danh sách thông báo gần đây nhất (tối đa 50 thông báo)
   */
  async getRecentNotifications(): Promise<NotificationMessage[]> {
    try {
      const token = localStorage.getItem('smart_wms_token');
      if (!token) return [];
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
    let abortController: AbortController | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let isDisposed = false;

    const connect = async () => {
      if (isDisposed) return;
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      if (!token) return;

      abortController = new AbortController();
      try {
        const response = await fetch(streamUrl, {
          method: 'GET',
          headers: {
            Accept: 'text/event-stream',
            Authorization: `Bearer ${token}`,
            'X-Device-Fingerprint': getDeviceFingerprint(),
          },
          signal: abortController.signal,
        });

        if (response.status === 401 || response.status === 403) {
          return;
        }
        if (!response.ok || !response.body) {
          throw new Error(`SSE HTTP ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (!isDisposed) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const events = buffer.split(/\r?\n\r?\n/);
          buffer = events.pop() || '';

          for (const rawEvent of events) {
            const lines = rawEvent.split(/\r?\n/);
            let eventName = 'message';
            const dataLines: string[] = [];

            for (const line of lines) {
              if (line.startsWith('event:')) {
                eventName = line.slice(6).trim();
              } else if (line.startsWith('data:')) {
                dataLines.push(line.slice(5).trim());
              }
            }

            if (eventName === 'notification' && dataLines.length > 0) {
              try {
                const data: NotificationMessage = JSON.parse(dataLines.join('\n'));
                onMessage(data);
              } catch (parseErr) {
                console.error('[NotificationService] Lỗi parse dữ liệu SSE:', parseErr);
              }
            }
          }
        }
      } catch (e: any) {
        if (e?.name === 'AbortError' || isDisposed) return;
        if (onError) onError(e);
      }

      if (!isDisposed) {
        retryTimer = setTimeout(connect, 5000);
      }
    };

    connect();

    return () => {
      isDisposed = true;
      if (retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = null;
      }
      if (abortController) {
        abortController.abort();
        abortController = null;
      }
    };
  },
};
