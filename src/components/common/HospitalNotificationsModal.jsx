/**
 * Hospital Notifications Modal / Drawer Component
 * Serves ALL logged-in roles: ADMIN, DOCTOR, PATIENT, RECEPTIONIST, LAB_TECHNICIAN, PHARMACIST
 * OpenAPI Controller: HospitalNotificationController (/api/hospital-notifications)
 *
 * Supported Event Types & Receivers:
 *   - Patient Register -> Patient
 *   - Appointment Book -> Receptionist
 *   - Appointment Approved -> Patient + Doctor
 *   - Consultation Created -> Patient
 *   - Prescription Created -> Patient
 *   - Lab Order Created -> Lab Technician
 *   - Lab Report Uploaded -> Patient + Doctor
 *   - Report Reviewed -> Patient
 *   - Medicine Dispensed -> Patient
 *   - Consultation / Pharmacy / Laboratory Payments -> Patient
 */
import { useState, useEffect, useCallback } from 'react';
import { Bell, CheckCheck, X, Check, Trash2, Clock, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import notificationApi from '../../api/notificationApi';

export default function HospitalNotificationsModal({ isOpen, onClose, onUpdateCount }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    let remoteList = [];
    try {
      const res = await notificationApi.getMyNotifications();
      remoteList = Array.isArray(res.data) ? res.data : [];
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }

    const localNotifs = JSON.parse(localStorage.getItem('hms_local_notifications') || '[]');
    const userRole = JSON.parse(localStorage.getItem('hms_user') || '{}')?.role || 'RECEPTIONIST';
    const filteredLocal = localNotifs.filter((n) => n.role === userRole);

    const merged = [...filteredLocal, ...remoteList];

    setNotifications(merged);

    const unread = merged.filter((n) => !(n.read ?? n.isRead)).length;
    if (onUpdateCount) onUpdateCount(unread);
    setLoading(false);
  }, [onUpdateCount]);

  /** Close modal on Escape key press */
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  const handleMarkAsRead = async (id) => {
    try {
      if (typeof id === 'string' && id.startsWith('notif-')) {
        const localNotifs = JSON.parse(localStorage.getItem('hms_local_notifications') || '[]');
        const updated = localNotifs.map((n) => (n.id === id ? { ...n, read: true, isRead: true } : n));
        localStorage.setItem('hms_local_notifications', JSON.stringify(updated));
      } else {
        await notificationApi.markAsRead(id);
      }
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true, isRead: true } : n))
      );
      toast.success('Notification marked as read');
    } catch (err) {
      console.error(err);
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const localNotifs = JSON.parse(localStorage.getItem('hms_local_notifications') || '[]');
      const updated = localNotifs.map((n) => ({ ...n, read: true, isRead: true }));
      localStorage.setItem('hms_local_notifications', JSON.stringify(updated));
      await notificationApi.markAllAsRead().catch(() => {});

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true, isRead: true })));
      toast.success('All notifications marked as read');
      if (onUpdateCount) onUpdateCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      if (typeof id === 'string' && id.startsWith('notif-')) {
        const localNotifs = JSON.parse(localStorage.getItem('hms_local_notifications') || '[]');
        const updated = localNotifs.filter((n) => n.id !== id);
        localStorage.setItem('hms_local_notifications', JSON.stringify(updated));
      } else {
        await notificationApi.deleteNotification(id);
      }
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      toast.success('Notification deleted');
    } catch (err) {
      console.error(err);
    }
  };


  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !(n.read ?? n.isRead)).length;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-end p-4 sm:p-6 bg-slate-900/50 backdrop-blur-xs animate-fade-in cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 max-h-[85vh] flex flex-col cursor-default mt-12 sm:mt-14"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 font-bold">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Hospital Notifications
                {unreadCount > 0 && (
                  <span className="rounded-full bg-blue-100 text-blue-800 text-[11px] px-2 py-0.5 font-bold">
                    {unreadCount} New
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500">
                Real-time activity alerts and event notifications
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={fetchNotifications}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              title="Refresh Queue"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 px-2 py-1 rounded-xl transition-colors"
                title="Mark all as read"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Read All
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              title="Close (Esc)"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {loading && notifications.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-10 animate-pulse">Loading notifications...</p>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <Bell className="mx-auto h-10 w-10 opacity-30 text-slate-400" />
              <p className="text-sm font-bold text-slate-700">No notifications found</p>
              <p className="text-xs text-slate-400">All alerts and event notifications will appear here in real-time.</p>
            </div>
          ) : (
            notifications.map((item) => {
              const isRead = item.read ?? item.isRead;
              return (
                <div
                  key={item.id}
                  className={`rounded-2xl p-4 border transition-all space-y-2 ${
                    isRead
                      ? 'bg-slate-50/60 border-slate-200/60 opacity-80'
                      : 'bg-blue-50/60 border-blue-200/80 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {!isRead && (
                        <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0" />
                      )}
                      <h4 className="text-xs font-bold text-slate-900">{item.title || item.eventType || 'Hospital Event Alert'}</h4>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {item.createdAt ? new Date(item.createdAt).toLocaleString('en-IN') : 'Just now'}
                      </span>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors"
                        title="Delete notification"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.message || item.content || 'Notification message details.'}</p>
                  {!isRead && (
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
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex justify-between items-center mt-3">
          <span className="text-[11px] text-slate-400">Press ESC or click outside to dismiss</span>
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-1.5 text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
