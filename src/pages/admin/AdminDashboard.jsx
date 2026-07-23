/**
 * Admin Dashboard Page
 *
 * Implements GET /api/dashboard/admin
 * Swagger Response Schema (AdminDashboardResponse):
 *   { totalPatients, totalDoctors, totalNurses, totalReceptionists, totalLabTechnicians, totalPharmacists, totalAppointments, totalMedicines, totalRevenue }
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  UserPlus,
  Users,
  CalendarCheck,
  Stethoscope,
  Activity,
  Receipt,
  HeartPulse,
  BarChart3,
  TestTube,
  Pill,
  ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import departmentApi from '../../api/departmentApi';
import dashboardApi from '../../api/dashboardApi';
import StatsCard from '../../components/common/StatsCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function AdminDashboard() {
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
        toast.error('Failed to load dashboard data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  /** Quick action buttons for common admin tasks */
  const quickActions = [
    { label: 'Manage Departments', icon: Building2, path: '/admin/departments' },
    { label: 'Register Doctor', icon: Stethoscope, path: '/admin/register-doctor' },
    { label: 'Register Nurse', icon: HeartPulse, path: '/admin/register-nurse' },
    { label: 'Register Receptionist', icon: UserPlus, path: '/admin/register-receptionist' },
    { label: 'Register Pharmacist', icon: Pill, path: '/admin/register-pharmacist' },
    { label: 'Register Lab Tech', icon: TestTube, path: '/admin/register-lab-technician' },
    { label: 'Search Patients', icon: Users, path: '/admin/patients' },
    { label: 'Appointments', icon: CalendarCheck, path: '/admin/appointments' },
    { label: 'Billing & Revenue', icon: Receipt, path: '/admin/billing' },
  ];

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="space-y-8">
      {/* ─── Welcome Header ─── */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold">
          Welcome back, {user?.name || 'Admin'} 👋
        </h1>
        <p className="mt-2 text-blue-100">
          Hospital System Overview — 100% synchronized with OpenAPI backend telemetry metrics
        </p>
      </div>

      {/* ─── All 9 Admin Dashboard Stats Cards ─── */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatsCard
          icon={Building2}
          label="Total Departments"
          value={departmentCount}
          color="blue"
          onClick={() => navigate('/admin/departments')}
        />
        <StatsCard
          icon={Users}
          label="Total Patients"
          value={stats?.totalPatients ?? 0}
          color="cyan"
          onClick={() => navigate('/admin/patients')}
        />
        <StatsCard
          icon={Stethoscope}
          label="Total Doctors"
          value={stats?.totalDoctors ?? 0}
          color="green"
          onClick={() => navigate('/admin/register-doctor')}
        />
        <StatsCard
          icon={HeartPulse}
          label="Total Nurses"
          value={stats?.totalNurses ?? 0}
          color="purple"
          onClick={() => navigate('/admin/register-nurse')}
        />
        <StatsCard
          icon={UserPlus}
          label="Total Receptionists"
          value={stats?.totalReceptionists ?? 0}
          color="amber"
          onClick={() => navigate('/admin/register-receptionist')}
        />
        <StatsCard
          icon={TestTube}
          label="Total Lab Techs"
          value={stats?.totalLabTechnicians ?? 0}
          color="rose"
          onClick={() => navigate('/admin/register-lab-technician')}
        />
        <StatsCard
          icon={Pill}
          label="Total Pharmacists"
          value={stats?.totalPharmacists ?? 0}
          color="indigo"
          onClick={() => navigate('/admin/register-pharmacist')}
        />
        <StatsCard
          icon={CalendarCheck}
          label="Total Appointments"
          value={stats?.totalAppointments ?? 0}
          color="blue"
          onClick={() => navigate('/admin/appointments')}
        />
        <StatsCard
          icon={Pill}
          label="Total Medicines Catalog"
          value={stats?.totalMedicines ?? 0}
          color="green"
        />
        <StatsCard
          icon={Receipt}
          label="Total Revenue"
          value={stats?.totalRevenue !== undefined && stats?.totalRevenue !== null ? `₹${stats.totalRevenue}` : '₹0'}
          color="amber"
          onClick={() => navigate('/admin/billing')}
        />
      </div>

      {/* ─── Quick Actions Grid ─── */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.path}
                onClick={() => navigate(action.path)}
                className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-blue-200"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-transform group-hover:scale-110">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{action.label}</p>
                  <p className="text-xs text-slate-400">Click to navigate</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
