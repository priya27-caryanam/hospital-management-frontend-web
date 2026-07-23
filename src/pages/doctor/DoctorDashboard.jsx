/**
 * DoctorDashboard — Main dashboard for logged-in doctors
 * Shows welcome message, profile stats, and quick action links.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stethoscope,
  Building2,
  BriefcaseMedical,
  DollarSign,
  CalendarCheck,
  FileText,
  User,
  Activity,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import doctorApi from '../../api/doctorApi';
import dashboardApi from '../../api/dashboardApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatsCard from '../../components/common/StatsCard';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  /** Fetch doctor profile and stats */
  useEffect(() => {
    const fetchProfileAndStats = async () => {
      try {
        const [profileRes, statsRes] = await Promise.all([
          doctorApi.getById(user.userId),
          dashboardApi.getDoctorStats(user.userId),
        ]);
        setDoctor(profileRes.data);
        setStats(statsRes.data);
      } catch (err) {
        console.error('Failed to load doctor dashboard data:', err);
        toast.error('Unable to load full dashboard stats.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfileAndStats();
  }, [user.userId]);

  if (loading) return <LoadingSpinner fullPage />;

  /* ── Quick-action cards ───────────────────────────────── */
  const quickActions = [
    {
      icon: CalendarCheck,
      label: 'My Appointments',
      description: 'View & manage your upcoming appointments',
      path: '/doctor/appointments',
      color: 'blue',
    },
    {
      icon: FileText,
      label: 'Add Prescription',
      description: 'Write a new prescription for a patient',
      path: '/doctor/prescriptions/add',
      color: 'green',
    },
    {
      icon: User,
      label: 'My Profile',
      description: 'View your professional profile details',
      path: '/doctor/profile',
      color: 'purple',
    },
  ];

  return (
    <div className="space-y-8">
      {/* ── Header / Welcome ──────────────────────────────── */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <Stethoscope className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">
              Welcome back, Dr. {doctor?.firstName ?? user.name ?? 'Doctor'}{' '}
              {doctor?.lastName ?? ''}
            </h1>
            <p className="mt-1 text-blue-100">
              {doctor?.specialization
                ? `${doctor.specialization} Specialist`
                : 'Your dashboard overview'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Stats Cards ───────────────────────────────────── */}
      {doctor && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Profile Overview</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <StatsCard
                icon={Stethoscope}
                label="Specialization"
                value={doctor.specialization || '—'}
                color="blue"
              />
              <StatsCard
                icon={Building2}
                label="Department"
                value={doctor.departmentName || doctor.department || '—'}
                color="purple"
              />
              <StatsCard
                icon={BriefcaseMedical}
                label="Experience"
                value={doctor.experience ? `${doctor.experience} yrs` : '—'}
                color="green"
              />
              <StatsCard
                icon={DollarSign}
                label="Consultation Fee"
                value={doctor.consultationFee ? `₹${doctor.consultationFee}` : '—'}
                color="amber"
              />
            </div>
          </div>

          <div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Clinical Activity Stats</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <StatsCard
                icon={CalendarCheck}
                label="Total Appointments"
                value={stats?.totalAppointments ?? 0}
                color="blue"
                onClick={() => navigate('/doctor/appointments')}
              />
              <StatsCard
                icon={User}
                label="Total Patients"
                value={stats?.totalPatients ?? 0}
                color="green"
              />
              <StatsCard
                icon={Activity}
                label="Total Consultations"
                value={stats?.totalConsultations ?? 0}
                color="purple"
                onClick={() => navigate('/doctor/appointments')}
              />
              <StatsCard
                icon={FileText}
                label="Total Prescriptions"
                value={stats?.totalPrescriptions ?? 0}
                color="amber"
                onClick={() => navigate('/doctor/prescriptions')}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Quick Actions ─────────────────────────────────── */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.path}
                onClick={() => navigate(action.path)}
                className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${
                    action.color === 'blue'
                      ? 'bg-blue-100 text-blue-600'
                      : action.color === 'green'
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-purple-100 text-purple-600'
                  }`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">{action.label}</h3>
                  <p className="mt-1 text-sm text-slate-500">{action.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Activity Hint ─────────────────────────────────── */}
      <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
        <Activity className="h-5 w-5 text-blue-500" />
        <p className="text-sm text-blue-700">
          Navigate to <span className="font-medium">My Appointments</span> to view today's
          schedule and update appointment statuses.
        </p>
      </div>
    </div>
  );
}
