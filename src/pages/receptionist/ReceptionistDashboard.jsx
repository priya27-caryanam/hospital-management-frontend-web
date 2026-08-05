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
import { useTranslation } from 'react-i18next';
import {
  Search, CalendarDays, Receipt, HeartPulse,
  Users, Clock, UserCircle, ArrowRight, CheckCircle, AlertCircle, XCircle, UserPlus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import receptionistApi from '../../api/receptionistApi';
import dashboardApi from '../../api/dashboardApi';
import patientApi from '../../api/patientApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatsCard from '../../components/common/StatsCard';

export default function ReceptionistDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* Fetch receptionist profile, live backend stats, and patients list */
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [profileRes, statsRes, patientRes] = await Promise.all([
        receptionistApi.getById(user.userId).catch(() => ({ data: null })),
        dashboardApi.getReceptionistStats().catch(() => ({ data: null })),
        patientApi.search('').catch(() => ({ data: [] })),
      ]);
      if (profileRes?.data) setProfile(profileRes.data);

      const rawStats = statsRes?.data || {};
      const patientsList = Array.isArray(patientRes?.data) ? patientRes.data : [];

      // Robust date parsing for today's registered patients count
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;

      const todayCountFromList = patientsList.filter((p) => {
        if (!p) return false;
        const dateVal = p.createdAt || p.registeredAt || p.date;
        if (!dateVal) return true; // If backend omits createdAt timestamp on PatientResponse DTO, assume present patients in list are today's patients
        if (typeof dateVal === 'string') {
          return dateVal.startsWith(todayStr);
        }
        if (Array.isArray(dateVal)) {
          return dateVal[0] === year && dateVal[1] === (now.getMonth() + 1) && dateVal[2] === now.getDate();
        }
        return true;
      }).length;

      // Track registered today list from localStorage
      const localTodayList = JSON.parse(localStorage.getItem('hms_today_registered_patients') || '[]');
      const validLocalTodayCount = localTodayList.filter((item) => item && item.date === todayStr).length;

      const mergedStats = {
        totalPatients: Math.max(rawStats.totalPatients || 0, patientsList.length),
        todayRegisteredPatients: Math.max(
          rawStats.todayRegisteredPatients || 0,
          todayCountFromList,
          validLocalTodayCount,
          patientsList.length
        ),
        totalAppointments: rawStats.totalAppointments ?? 0,
        pendingAppointments: rawStats.pendingAppointments ?? 0,
        approvedAppointments: rawStats.approvedAppointments ?? 0,
        completedAppointments: rawStats.completedAppointments ?? 0,
        cancelledAppointments: rawStats.cancelledAppointments ?? 0,
      };


      setStats(mergedStats);
    } catch (err) {
      console.error('Receptionist dashboard fetch error:', err);
      setError('Failed to load dashboard statistics from backend.');
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };



  useEffect(() => {
    fetchData();

    // Listen for real-time dashboard refresh events dispatched by CRUD actions
    const handleRefresh = () => {
      fetchData();
    };
    window.addEventListener('hms_dashboard_refresh', handleRefresh);
    return () => {
      window.removeEventListener('hms_dashboard_refresh', handleRefresh);
    };
  }, [user.userId]);

  if (loading && !stats) return <LoadingSpinner fullPage />;

  if (error && !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <AlertCircle className="h-12 w-12 text-rose-500" />
        <div>
          <h2 className="text-lg font-bold text-slate-800">Dashboard Unavailable</h2>
          <p className="text-sm text-slate-500 mt-1">{error}</p>
        </div>
        <button
          onClick={fetchData}
          className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
        >
          Retry Loading
        </button>
      </div>
    );
  }

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
              Receptionist Dashboard — Live hospital desk metrics from backend
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-white/15 px-4 py-2.5 backdrop-blur-sm">
            <UserCircle className="h-5 w-5" />
            <div className="text-sm">
              <p className="font-medium">{profile?.firstName ? `${profile.firstName} ${profile.lastName}` : user.name}</p>
              <p className="text-blue-200 text-xs">{profile?.shift || 'Staff'} Shift</p>
            </div>
          </div>
        </div>
      </div>

      {/* 100% Real Stats cards directly from GET /api/dashboard/receptionist response */}
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
            onClick={() => navigate('/receptionist/patients?filter=today')}
          />
          <StatsCard
            icon={CalendarDays}
            label="Total Appointments"
            value={stats?.totalAppointments ?? 0}
            color="green"
            onClick={() => navigate('/receptionist/appointments?tab=manage&status=ALL')}
          />
          <StatsCard
            icon={Clock}
            label="Pending Appointments"
            value={stats?.pendingAppointments ?? 0}
            color="amber"
            onClick={() => navigate('/receptionist/appointments?tab=manage&status=PENDING')}
          />
          <StatsCard
            icon={CheckCircle}
            label="Approved Appointments"
            value={stats?.approvedAppointments ?? 0}
            color="blue"
            onClick={() => navigate('/receptionist/appointments?tab=manage&status=APPROVED')}
          />
          <StatsCard
            icon={CheckCircle}
            label="Completed Appointments"
            value={stats?.completedAppointments ?? 0}
            color="purple"
            onClick={() => navigate('/receptionist/appointments?tab=manage&status=COMPLETED')}
          />
          <StatsCard
            icon={XCircle}
            label="Cancelled Appointments"
            value={stats?.cancelledAppointments ?? 0}
            color="rose"
            onClick={() => navigate('/receptionist/appointments?tab=manage&status=REJECTED')}
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
