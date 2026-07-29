/**
 * Top Navbar Component
 * Displays hospital branding, user role, real-time notification bell telemetry, and logout
 */
import { useState, useEffect, useCallback } from 'react';
import { Menu, Bell, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import notificationApi from '../../api/notificationApi';
import HospitalNotificationsModal from '../common/HospitalNotificationsModal';

/** Role badge color mapping */
const roleBadgeColors = {
  ADMIN: 'bg-purple-100 text-purple-700',
  DOCTOR: 'bg-blue-100 text-blue-700',
  NURSE: 'bg-emerald-100 text-emerald-700',
  RECEPTIONIST: 'bg-amber-100 text-amber-700',
  PATIENT: 'bg-cyan-100 text-cyan-700',
  LAB_TECHNICIAN: 'bg-rose-100 text-rose-700',
  PHARMACIST: 'bg-indigo-100 text-indigo-700',
};

export default function Navbar({ onMenuToggle }) {
  const { user, logout } = useAuth();
  const badgeColor = roleBadgeColors[user?.role] || 'bg-slate-100 text-slate-700';

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  /** Fetch unread count for logged-in user via GET /api/hospital-notifications/unread-count */
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    let remoteCount = 0;
    try {
      const res = await notificationApi.getUnreadCount();
      remoteCount = typeof res.data === 'number' ? res.data : res.data?.unreadCount ?? 0;
    } catch (err) {
      // Fallback silently
    }

    // Combine with local notifications strictly for this user role
    const localNotifs = JSON.parse(localStorage.getItem('hms_local_notifications') || '[]');
    const localUnread = localNotifs.filter(
      (n) => !n.read && n.role === user.role
    ).length;

    setUnreadCount(remoteCount + localUnread);
  }, [user]);


  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000);

    const handleNotifEvent = () => {
      fetchUnreadCount();
    };

    window.addEventListener('hms_notification_trigger', handleNotifEvent);
    window.addEventListener('hms_dashboard_refresh', handleNotifEvent);

    return () => {
      clearInterval(interval);
      window.removeEventListener('hms_notification_trigger', handleNotifEvent);
      window.removeEventListener('hms_dashboard_refresh', handleNotifEvent);
    };
  }, [fetchUnreadCount]);


  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-xl px-4 py-3 lg:px-6">
      {/* Left — Menu toggle (mobile) + Page title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 lg:hidden transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="hidden sm:block">
          <h2 className="text-lg font-semibold text-slate-800">
            Hospital Management System
          </h2>
        </div>
      </div>

      {/* Right — User info + Notification Bell + Logout */}
      <div className="flex items-center gap-3">
        {/* Real-time Hospital Notification Bell */}
        <button
          onClick={() => setNotificationsOpen((prev) => !prev)}
          className="relative rounded-xl p-2.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all cursor-pointer"
          title="Hospital Notifications & Alerts"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-xs animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Universal Notifications Modal */}
        <HospitalNotificationsModal
          isOpen={notificationsOpen}
          onClose={() => {
            setNotificationsOpen(false);
            fetchUnreadCount();
          }}
          onUpdateCount={(cnt) => setUnreadCount(cnt)}
        />

        {/* User avatar + info */}
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-1.5 border border-slate-100">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white uppercase shadow-xs">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-700 truncate max-w-[140px]">{user?.name}</p>
            <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badgeColor}`}>
              {user?.role}
            </span>
          </div>
        </div>

        {/* Logout button */}
        <button
          onClick={logout}
          className="rounded-xl p-2.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
          title="Logout"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
