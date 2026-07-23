/**
 * ReceptionistDashboard Page
 * Main dashboard for receptionist users featuring:
 * - Real-time metrics from GET /api/dashboard/receptionist (100% field mapping for 7 fields)
 * - Profile-based welcome message
 * - Quick action StatsCards
 * - Navigation cards to core features
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, CalendarDays, Receipt, HeartPulse,
  Users, Clock, UserCircle, ArrowRight, CheckCircle, AlertCircle, XCircle, UserPlus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import receptionistApi from '../../api/receptionistApi';
import dashboardApi from '../../api/dashboardApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatsCard from '../../components/common/StatsCard';

export default function ReceptionistDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  /* Fetch receptionist profile and stats on mount */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, statsRes] = await Promise.all([
          receptionistApi.getById(user.userId),
          dashboardApi.getReceptionistStats(),
        ]);
        setProfile(profileRes.data);
        setStats(statsRes.data);
      } catch (error) {
        toast.error('Failed to load dashboard data');
        console.error('Receptionist dashboard fetch error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.userId]);

  if (loading) return <LoadingSpinner fullPage />;

  /** Quick-action cards that link to receptionist features */
  const quickActions = [
    {
      icon: Search,
      label: 'Patient Search',
      description: 'Search and view patient records',
      path: '/receptionist/patients',
      color: 'blue',
    },
    {
      icon: CalendarDays,
      label: 'Book Appointment',
      description: 'Schedule a new appointment',
      path: '/receptionist/appointments',
      color: 'green',
    },
    {
      icon: Receipt,
      label: 'Billing',
      description: 'Manage bills and payments',
      path: '/receptionist/billing',
      color: 'amber',
    },
    {
      icon: HeartPulse,
      label: 'Symptoms Suggestion',
      description: 'Suggest departments by symptoms',
      path: '/receptionist/symptoms',
      color: 'purple',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white shadow-lg shadow-blue-600/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              Welcome back, {profile?.firstName || user.name} 👋
            </h1>
            <p className="mt-1 text-blue-100 text-sm">
              Receptionist Dashboard — Manage appointments, patients, and billing
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-white/15 px-4 py-2.5 backdrop-blur-sm">
            <UserCircle className="h-5 w-5" />
            <div className="text-sm">
              <p className="font-medium">{profile?.firstName} {profile?.lastName}</p>
              <p className="text-blue-200 text-xs">{profile?.shift || 'Staff'} Shift</p>
            </div>
          </div>
        </div>
      </div>

      {/* 100% Real Stats cards from ReceptionistDashboardResponse (7 fields) */}
      <div>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Live Hospital Desk Metrics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <StatsCard
            icon={Users}
            label="Total Patients"
            value={stats?.totalPatients ?? 0}
            color="blue"
            onClick={() => navigate('/receptionist/patients')}
          />
          <StatsCard
            icon={UserPlus}
            label="Today Registered Patients"
            value={stats?.todayRegisteredPatients ?? 0}
            color="cyan"
            onClick={() => navigate('/receptionist/patients')}
          />
          <StatsCard
            icon={CalendarDays}
            label="Total Appointments"
            value={stats?.totalAppointments ?? 0}
            color="green"
            onClick={() => navigate('/receptionist/appointments')}
          />
          <StatsCard
            icon={Clock}
            label="Pending Appointments"
            value={stats?.pendingAppointments ?? 0}
            color="amber"
            onClick={() => navigate('/receptionist/appointments')}
          />
          <StatsCard
            icon={CheckCircle}
            label="Approved Appointments"
            value={stats?.approvedAppointments ?? 0}
            color="blue"
            onClick={() => navigate('/receptionist/appointments')}
          />
          <StatsCard
            icon={CheckCircle}
            label="Completed Appointments"
            value={stats?.completedAppointments ?? 0}
            color="purple"
            onClick={() => navigate('/receptionist/appointments')}
          />
          <StatsCard
            icon={XCircle}
            label="Cancelled Appointments"
            value={stats?.cancelledAppointments ?? 0}
            color="rose"
            onClick={() => navigate('/receptionist/appointments')}
          />
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.path}
              onClick={() => navigate(action.path)}
              className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-blue-200"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-${action.color === 'blue' ? 'blue' : action.color === 'green' ? 'emerald' : action.color === 'amber' ? 'amber' : 'purple'}-100 transition-transform group-hover:scale-110`}>
                <action.icon className={`h-6 w-6 text-${action.color === 'blue' ? 'blue' : action.color === 'green' ? 'emerald' : action.color === 'amber' ? 'amber' : 'purple'}-600`} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800">{action.label}</h3>
                <p className="text-sm text-slate-500">{action.description}</p>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-blue-500" />
            </button>
          ))}
        </div>
      </div>

      {/* Profile summary card */}
      {profile && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Your Profile</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-slate-500">Full Name</span>
              <p className="font-medium text-slate-800">{profile.firstName} {profile.lastName}</p>
            </div>
            <div>
              <span className="text-slate-500">Email</span>
              <p className="font-medium text-slate-800">{profile.email}</p>
            </div>
            <div>
              <span className="text-slate-500">Mobile</span>
              <p className="font-medium text-slate-800">{profile.mobile}</p>
            </div>
            <div>
              <span className="text-slate-500">Gender</span>
              <p className="font-medium text-slate-800">{profile.gender}</p>
            </div>
            <div>
              <span className="text-slate-500">Qualification</span>
              <p className="font-medium text-slate-800">{profile.qualification || '—'}</p>
            </div>
            <div>
              <span className="text-slate-500">Shift</span>
              <p className="font-medium text-slate-800">{profile.shift || '—'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
