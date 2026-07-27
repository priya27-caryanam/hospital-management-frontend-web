/**
 * Patient Notifications Modal / Drawer Component
 * Fetches and displays patient notifications matching OpenAPI notification-controller:
 *   - GET /api/notifications/patient/{patientId}
 *   - PUT /api/notifications/{notificationId}/read
 *   - PUT /api/notifications/patient/{patientId}/read-all
 */
import { useState, useEffect, useCallback } from 'react';
import { Bell, CheckCheck, X, Check, Calendar, AlertTriangle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import notificationApi from '../../api/notificationApi';

export default function PatientNotificationsModal({ patientId, isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    try {
      const res = await notificationApi.getByPatient(patientId);
      setNotifications(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationApi.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      toast.success('Notification marked as read');
    } catch (err) {
      console.error(err);
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead(patientId);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch (err) {
      console.error(err);
      toast.error('Failed to mark all as read');
    }
  };

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 font-bold">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Your Notifications</h3>
              <p className="text-xs text-slate-500">
                {unreadCount > 0 ? `${unreadCount} unread alert(s)` : 'All notifications caught up'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 px-2.5 py-1 rounded-lg transition-colors"
                title="Mark all as read"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark All Read
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {loading ? (
            <p className="text-xs text-slate-400 text-center py-8 animate-pulse">Loading notifications...</p>
          ) : notifications.length === 0 ? (
            <div className="text-center py-10 text-slate-400 space-y-2">
              <Bell className="mx-auto h-8 w-8 opacity-30" />
              <p className="text-xs font-medium">No notifications found.</p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                className={`rounded-2xl p-4 border transition-all space-y-2 ${
                  item.isRead
                    ? 'bg-slate-50/50 border-slate-200/60 opacity-80'
                    : 'bg-blue-50/50 border-blue-200/80 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {!item.isRead && (
                      <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0" />
                    )}
                    <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Just now'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{item.message}</p>
                {!item.isRead && (
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => handleMarkAsRead(item.id)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:underline"
                    >
                      <Check className="h-3 w-3" />
                      Mark as read
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
