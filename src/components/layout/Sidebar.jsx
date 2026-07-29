/**
 * Sidebar Navigation Component
 * Role-based sidebar with navigation links and logout
 * Collapsible on mobile via hamburger menu
 */
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Building2, UserPlus, Users, CalendarDays,
  Receipt, Stethoscope, FileText, ClipboardList, UserCircle,
  Search, HeartPulse, LogOut, X, Activity, Pill, TestTube, Package, FlaskConical,
} from 'lucide-react';

/** Navigation items per role */
const roleNavItems = {
  ADMIN: [
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/departments', label: 'Manage Departments', icon: Building2 },
    { path: '/admin/specializations', label: 'Manage Specializations', icon: Building2 },
    { path: '/admin/register-doctor', label: 'Register Doctor', icon: UserPlus },
    { path: '/admin/register-nurse', label: 'Register Nurse', icon: UserPlus },
    { path: '/admin/register-receptionist', label: 'Register Receptionist', icon: UserPlus },
    { path: '/admin/register-pharmacist', label: 'Register Pharmacist', icon: Pill },
    { path: '/admin/register-lab-technician', label: 'Register Lab Tech', icon: TestTube },
    { path: '/admin/patients', label: 'Patient Search', icon: Search },
    { path: '/admin/appointments', label: 'Appointments', icon: CalendarDays },
    { path: '/admin/billing', label: 'Billing', icon: Receipt },
    { path: '/admin/symptoms', label: 'Symptoms', icon: HeartPulse },
    { path: '/admin/reports', label: 'Reports', icon: FileText },
  ],
  DOCTOR: [
    { path: '/doctor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/doctor/profile', label: 'My Profile', icon: UserCircle },
    { path: '/doctor/appointments', label: 'My Appointments & Lab Orders', icon: CalendarDays },
    { path: '/doctor/prescriptions', label: 'Add Prescription', icon: ClipboardList },
  ],
  NURSE: [
    { path: '/nurse/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/nurse/profile', label: 'My Profile', icon: UserCircle },
    { path: '/nurse/patients', label: 'Assigned Patients', icon: Users },
  ],
  RECEPTIONIST: [
    { path: '/receptionist/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/receptionist/availability', label: 'Daily Doctor Availability', icon: CalendarDays },
    { path: '/receptionist/patients', label: 'Patient Search', icon: Search },
    { path: '/receptionist/offline-registration', label: 'Offline Patient Registration', icon: UserPlus },
    { path: '/receptionist/book-walkin', label: 'Book Walk-in Appointment', icon: CalendarDays },
    { path: '/receptionist/online-requests', label: 'Online Appointment Requests', icon: ClipboardList },
    { path: '/receptionist/billing', label: 'Billing', icon: Receipt },
    { path: '/receptionist/symptoms', label: 'Symptoms Suggestion', icon: HeartPulse },
  ],
  PHARMACIST: [
    { path: '/pharmacist/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/pharmacist/prescriptions', label: 'Pending Queue', icon: Pill },
    { path: '/pharmacist/medicines', label: 'Manage Medicines', icon: Package },
  ],
  LAB_TECHNICIAN: [
    { path: '/lab/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/lab/orders', label: 'Lab Orders Queue', icon: FlaskConical },
    { path: '/lab/reports', label: 'Lab Reports', icon: TestTube },
  ],
  PATIENT: [
    { path: '/patient/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/patient/profile', label: 'My Profile', icon: UserCircle },
    { path: '/patient/doctors', label: 'Search Doctor', icon: Stethoscope },
    { path: '/patient/book-appointment', label: 'Book Appointment', icon: CalendarDays },
    { path: '/patient/appointments', label: 'My Appointments', icon: CalendarDays },
    { path: '/patient/prescriptions', label: 'Prescriptions', icon: ClipboardList },
    { path: '/patient/lab-reports', label: 'Lab Reports', icon: TestTube },
    { path: '/patient/bills', label: 'My Bills', icon: Receipt },
  ],
};

export default function Sidebar({ isOpen, onClose }) {
  const { role, logout } = useAuth();
  const navItems = roleNavItems[role] || [];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden" onClick={onClose} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen flex flex-col w-64 transform bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-slate-700/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/30">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-wide">HMS</h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">Hospital System</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-700 lg:hidden transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-400 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                }`
              }
            >
              <item.icon className="h-4.5 w-4.5 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="border-t border-slate-700/50 p-3 shrink-0">
          <button
            onClick={() => { logout(); onClose?.(); }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200"
          >
            <LogOut className="h-4.5 w-4.5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
