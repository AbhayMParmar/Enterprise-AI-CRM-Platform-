import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Sparkles, AlertCircle, Info, DollarSign, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';

export interface NotificationItem {
  _id: string;
  type: 'info' | 'success' | 'warning' | 'deal' | 'task';
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, accessToken } = useAuthStore();

  const fetchNotifications = async () => {
    // Only fetch when authenticated with a real token
    if (!isAuthenticated || !accessToken) return;
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.warn('Failed to fetch notifications');
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 60 seconds — avoids rate limiting while staying reasonably fresh
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, accessToken]);

  const handleToggleOpen = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.warn('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.warn('Failed to mark all notifications as read');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'deal':
        return <DollarSign className="w-4 h-4 text-emerald-600" />;
      case 'task':
        return <Calendar className="w-4 h-4 text-blue-600" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-amber-600" />;
      case 'success':
        return <Check className="w-4 h-4 text-green-600" />;
      default:
        return <Info className="w-4 h-4 text-indigo-600" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleToggleOpen}
        className="relative p-2 text-slate-600 hover:text-brand-primary hover:bg-slate-100 rounded-xl transition-all outline-none"
        title="Notification Center"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-4.5 h-4.5 px-1 bg-red-500 text-white rounded-full text-[10px] font-extrabold flex items-center justify-center animate-bounce shadow-sm border border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-brand-border rounded-2xl smooth-shadow z-50 overflow-hidden"
            >
              <div className="p-3.5 border-b border-brand-border bg-slate-50/70 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-brand-primary" />
                  <span className="font-bold text-xs text-brand-textPrimary">Notification Center</span>
                  {unreadCount > 0 && (
                    <span className="bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                      {unreadCount} unread
                    </span>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-[11px] font-semibold text-brand-primary hover:underline flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 italic flex flex-col items-center gap-2">
                    <Sparkles className="w-6 h-6 text-brand-primary/30" />
                    <span>No notifications available.</span>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      onClick={() => !n.isRead && handleMarkAsRead(n._id)}
                      className={`p-3 flex items-start gap-3 hover:bg-slate-50 transition-colors cursor-pointer ${
                        !n.isRead ? 'bg-blue-50/40 font-medium' : ''
                      }`}
                    >
                      <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-xs flex-shrink-0 mt-0.5">
                        {getIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className={`text-xs ${!n.isRead ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'} truncate`}>
                            {n.title}
                          </h4>
                          <span className="text-[9px] text-slate-400 flex-shrink-0">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
