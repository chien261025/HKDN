import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  CheckCheck,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import { NotificationMessage } from '../types';
import { NotificationItem } from './NotificationItem';

export const NotificationCenterDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD'>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    triggerTestAlert,
  } = useNotifications();

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshNotifications();
    setTimeout(() => setIsRefreshing(false), 400);
  };

  const filteredNotifications = notifications.filter((n) =>
    activeTab === 'UNREAD' ? !n.read : true
  );

  const handleItemClick = (notification: NotificationMessage) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Nút Chuông Thông Báo */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`relative p-2 rounded-xl border transition-all cursor-pointer ${
          isOpen
            ? 'bg-indigo-50 border-indigo-300 text-indigo-600'
            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 border-slate-200'
        }`}
        title="Trung tâm thông báo thời gian thực"
        aria-label="Thông báo"
      >
        <Bell className="w-4.5 h-4.5" />
        {unreadCount > 0 && (
          <>
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white shadow-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
            <span className="animate-ping absolute -top-1 -right-1 w-[18px] h-[18px] rounded-full bg-rose-400 opacity-60 pointer-events-none" />
          </>
        )}
      </button>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-88 md:w-96 bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col animate-fade-in">
          {/* Header Panel */}
          <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Thông Báo</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-700">
                  {unreadCount} mới
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() =>
                  triggerTestAlert(
                    'Kiểm Kê Kho Khẩn Cấp',
                    'Phát hiện chênh lệch -3 hộp iPhone 15 tại ô A-01-01!',
                    'WARNING'
                  )
                }
                title="Gửi thông báo mô phỏng kiểm kê"
                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1 font-semibold"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span className="hidden sm:inline text-[11px]">Test</span>
              </button>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  title="Đánh dấu tất cả đã đọc"
                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={handleManualRefresh}
                title="Tải lại danh sách"
                className={`p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg transition-colors cursor-pointer ${
                  isRefreshing ? 'animate-spin text-indigo-600' : ''
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="px-3.5 pt-2 pb-1 border-b border-slate-100 flex gap-2">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'ALL'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Tất cả ({notifications.length})
            </button>
            <button
              onClick={() => setActiveTab('UNREAD')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'UNREAD'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Chưa đọc ({unreadCount})
            </button>
          </div>

          {/* List Item */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {filteredNotifications.length === 0 ? (
              <div className="py-10 text-center px-4">
                <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-medium text-slate-400">
                  {activeTab === 'UNREAD'
                    ? 'Bạn đã đọc hết mọi thông báo.'
                    : 'Chưa có thông báo nào trong hệ thống.'}
                </p>
              </div>
            ) : (
              filteredNotifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onClick={handleItemClick}
                  onMarkAsRead={markAsRead}
                />
              ))
            )}
          </div>

          {/* Footer Status */}
          <div className="px-3.5 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-medium text-emerald-700">Real-Time SSE Live</span>
            </div>
            <span className="text-slate-400">Smart WMS v1.0</span>
          </div>
        </div>
      )}
    </div>
  );
};
