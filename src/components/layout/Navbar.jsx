/**
 * Top Navbar Component
 * Shows hospital branding, user info, and mobile hamburger toggle
 */
import { Menu, Bell, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

/** Role badge color mapping */
const roleBadgeColors = {
  ADMIN: 'bg-purple-100 text-purple-700',
  DOCTOR: 'bg-blue-100 text-blue-700',
  NURSE: 'bg-emerald-100 text-emerald-700',
  RECEPTIONIST: 'bg-amber-100 text-amber-700',
  PATIENT: 'bg-cyan-100 text-cyan-700',
};

export default function Navbar({ onMenuToggle }) {
  const { user, logout } = useAuth();
  const badgeColor = roleBadgeColors[user?.role] || 'bg-slate-100 text-slate-700';

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

      {/* Right — User info + Logout */}
      <div className="flex items-center gap-3">
        {/* Notification bell placeholder */}
        <button className="relative rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>

        {/* User avatar + info */}
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-1.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white uppercase">
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
          className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
          title="Logout"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
