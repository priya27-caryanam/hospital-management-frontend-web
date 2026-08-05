/**
 * NurseDashboard — Main dashboard for logged-in nurses
 * Shows welcome message, profile stats, and quick links.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  HeartPulse,
  Building2,
  Clock,
  GraduationCap,
  User,
  Users,
  Activity,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import nurseApi from '../../api/nurseApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatsCard from '../../components/common/StatsCard';

export default function NurseDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [nurse, setNurse] = useState(null);
  const [loading, setLoading] = useState(true);

  /** Fetch nurse profile */
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await nurseApi.getById(user.userId);
        setNurse(res.data);
      } catch (err) {
        console.error('Failed to load nurse profile:', err);
        toast.error('Unable to load your profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user.userId]);

  if (loading) return <LoadingSpinner fullPage />;

  /* ── Quick-action cards ───────────────────────────────── */
  const quickActions = [
    {
      icon: User,
      label: 'My Profile',
      description: 'View your professional profile information',
      path: '/nurse/profile',
      color: 'purple',
    },
    {
      icon: Users,
      label: 'Assigned Patients',
      description: 'View patients assigned to your care',
      path: '/nurse/patients',
      color: 'blue',
    },
  ];

  return (
    <div className="space-y-8">
      {/* ── Welcome Header ────────────────────────────────── */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 p-8 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
            <HeartPulse className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">
              Welcome back, {nurse?.firstName ?? user.name ?? 'Nurse'}{' '}
              {nurse?.lastName ?? ''}
            </h1>
            <p className="mt-1 text-emerald-100">
              {nurse?.shift ? `${nurse.shift} Shift` : 'Your dashboard overview'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Stats Cards ───────────────────────────────────── */}
      {nurse && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <StatsCard
            icon={Building2}
            label="Department"
            value={nurse.departmentName || nurse.department || '—'}
            color="blue"
            onClick={() => navigate('/nurse/profile')}
          />
          <StatsCard
            icon={Clock}
            label="Shift"
            value={nurse.shift || '—'}
            color="amber"
            onClick={() => navigate('/nurse/profile')}
          />
          <StatsCard
            icon={GraduationCap}
            label="Qualification"
            value={nurse.qualification || '—'}
            color="green"
            onClick={() => navigate('/nurse/profile')}
          />
        </div>
      )}

      {/* ── Quick Actions ─────────────────────────────────── */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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

      {/* ── Shift Hint ────────────────────────────────────── */}
      <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
        <Activity className="h-5 w-5 text-emerald-500" />
        <p className="text-sm text-emerald-700">
          Check <span className="font-medium">Assigned Patients</span> to see your current
          patient care list.
        </p>
      </div>
    </div>
  );
}
