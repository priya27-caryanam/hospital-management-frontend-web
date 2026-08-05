/**
 * Admin Dashboard Page
 *
 * Displays hospital aggregate metrics via StatsCards.
 * Clicking ANY metric card navigates directly to its dedicated detail/list page!
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Building2,
  UserPlus,
  Users,
  CalendarCheck,
  Stethoscope,
  Receipt,
  HeartPulse,
  TestTube,
  Pill,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import departmentApi from '../../api/departmentApi';
import dashboardApi from '../../api/dashboardApi';
import StatsCard from '../../components/common/StatsCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [departmentCount, setDepartmentCount] = useState(0);
  const [stats, setStats] = useState(null);

  /** Fetch aggregate stats on mount */
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [deptRes, statsRes] = await Promise.all([
          departmentApi.getAll(),
          dashboardApi.getAdminStats(),
        ]);
        setDepartmentCount(deptRes.data?.length || 0);
        setStats(statsRes.data);
      } catch (err) {
        toast.error(t('common.error'));
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [t]);

  /** Quick action buttons for common admin tasks */
  const quickActions = [
    { label: t('nav.manageDepartments'), icon: Building2, path: '/admin/departments' },
    { label: t('nav.registerDoctor'), icon: Stethoscope, path: '/admin/register-doctor' },
    { label: t('nav.registerNurse'), icon: HeartPulse, path: '/admin/register-nurse' },
    { label: t('nav.registerReceptionist'), icon: UserPlus, path: '/admin/register-receptionist' },
    { label: t('nav.registerPharmacist'), icon: Pill, path: '/admin/register-pharmacist' },
    { label: t('nav.registerLabTech'), icon: TestTube, path: '/admin/register-lab-technician' },
    { label: t('nav.patientSearch'), icon: Users, path: '/admin/patients' },
    { label: t('nav.appointments'), icon: CalendarCheck, path: '/admin/appointments' },
    { label: t('nav.billing'), icon: Receipt, path: '/admin/billing' },
  ];

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="space-y-8">
      {/* ─── Welcome Header ─── */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold">
          {t('admin.welcomeAdmin', { name: user?.name || 'Admin' })}
        </h1>
        <p className="mt-2 text-blue-100">
          {t('admin.dashboardSubtitle')}
        </p>
      </div>

      {/* ─── Metric Cards Grid ─── */}
      <div>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
          {t('admin.statsOverview')}
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <StatsCard
            icon={Building2}
            label={t('admin.totalDepartments')}
            value={departmentCount}
            color="blue"
            onClick={() => navigate('/admin/departments')}
          />
          <StatsCard
            icon={Users}
            label={t('admin.totalPatients')}
            value={stats?.totalPatients ?? 0}
            color="cyan"
            onClick={() => navigate('/admin/patients')}
          />
          <StatsCard
            icon={Stethoscope}
            label={t('admin.totalDoctors')}
            value={stats?.totalDoctors ?? 0}
            color="green"
            onClick={() => navigate('/admin/register-doctor')}
          />
          <StatsCard
            icon={HeartPulse}
            label={t('admin.totalNurses')}
            value={stats?.totalNurses ?? 0}
            color="purple"
            onClick={() => navigate('/admin/register-nurse')}
          />
          <StatsCard
            icon={UserPlus}
            label={t('admin.totalReceptionists')}
            value={stats?.totalReceptionists ?? 0}
            color="amber"
            onClick={() => navigate('/admin/register-receptionist')}
          />
          <StatsCard
            icon={TestTube}
            label={t('admin.totalLabTechs')}
            value={stats?.totalLabTechnicians ?? 0}
            color="rose"
            onClick={() => navigate('/admin/register-lab-technician')}
          />
          <StatsCard
            icon={Pill}
            label={t('admin.totalPharmacists')}
            value={stats?.totalPharmacists ?? 0}
            color="indigo"
            onClick={() => navigate('/admin/register-pharmacist')}
          />
          <StatsCard
            icon={CalendarCheck}
            label={t('admin.totalAppointments')}
            value={stats?.totalAppointments ?? 0}
            color="blue"
            onClick={() => navigate('/admin/appointments')}
          />
          <StatsCard
            icon={Pill}
            label={t('admin.totalMedicines')}
            value={stats?.totalMedicines ?? 0}
            color="green"
            onClick={() => navigate('/admin/medicines')}
          />
          <StatsCard
            icon={Receipt}
            label={t('admin.totalRevenue')}
            value={stats?.totalRevenue !== undefined && stats?.totalRevenue !== null ? `₹${stats.totalRevenue}` : '₹0'}
            color="amber"
            onClick={() => navigate('/admin/billing')}
          />
        </div>
      </div>

      {/* ─── Quick Actions Grid ─── */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-800">{t('admin.quickActions')}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.path}
                onClick={() => navigate(action.path)}
                className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-blue-200 cursor-pointer"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-transform group-hover:scale-110">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{action.label}</p>
                  <p className="text-xs text-slate-400">{t('admin.clickToNavigate')}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
