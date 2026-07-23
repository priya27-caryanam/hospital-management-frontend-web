/**
 * Patient Dashboard Page
 * Provides welcome overview, real-time metrics from GET /api/dashboard/patient/{patientId}, and quick action portal.
 * 100% Swagger Field Mapping for PatientDashboardResponse (9 fields).
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Calendar, ClipboardList, Receipt, Stethoscope, ArrowRight, TestTube, CheckCircle, HeartPulse, XCircle, Clock, FileCheck, CreditCard } from 'lucide-react';
import dashboardApi from '../../api/dashboardApi';
import StatsCard from '../../components/common/StatsCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function PatientDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.userId) return;
      try {
        const res = await dashboardApi.getPatientStats(user.userId);
        setStats(res.data);
      } catch (err) {
        console.error('Failed to load patient dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user?.userId]);

  const cards = [
    {
      title: 'Symptom Checker & Doctor Suggestion',
      desc: 'Pick your symptoms to get instant department and specialist recommendations.',
      path: '/patient/symptoms',
      icon: HeartPulse,
      color: 'rose',
    },
    {
      title: 'Search Specialist Doctor',
      desc: 'Browse hospital doctors list by department and check consulting fees.',
      path: '/patient/doctors',
      icon: Stethoscope,
      color: 'blue',
    },
    {
      title: 'Schedule Appointment',
      desc: 'Consult doctors or coordinate scheduling with receptionist desk.',
      path: '/patient/book-appointment',
      icon: Calendar,
      color: 'purple',
    },
    {
      title: 'Appointment Records',
      desc: 'Review history of appointments, status logs, and consulting doctor details.',
      path: '/patient/appointments',
      icon: ClipboardList,
      color: 'emerald',
    },
    {
      title: 'Prescriptions Directory',
      desc: 'View medical reports and prescriptions issued during doctor consults.',
      path: '/patient/prescriptions',
      icon: ClipboardList,
      color: 'cyan',
    },
    {
      title: 'Invoices & Payments',
      desc: 'Check bill statuses, invoice breakdowns, and payment history.',
      path: '/patient/bills',
      icon: Receipt,
      color: 'amber',
    },
  ];

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-white/5 rounded-l-full blur-2xl pointer-events-none" />
        <div className="relative space-y-2">
          <h1 className="text-2xl font-bold tracking-wide font-sans">Welcome Back, {user?.name || 'Patient'}!</h1>
          <p className="text-sm text-blue-100 max-w-xl">
            Access your medical bills, browse specialist practitioners, track scheduled doctor appointments, and check issued prescription guides.
          </p>
        </div>
      </div>

      {/* 100% Real Stats Cards from PatientDashboardResponse (9 fields) */}
      <div>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Your Medical Overview</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <StatsCard
            icon={Calendar}
            label="Total Appointments"
            value={stats?.totalAppointments ?? 0}
            color="blue"
          />
          <StatsCard
            icon={Clock}
            label="Upcoming Appointments"
            value={stats?.upcomingAppointments ?? 0}
            color="purple"
          />
          <StatsCard
            icon={CheckCircle}
            label="Completed Appointments"
            value={stats?.completedAppointments ?? 0}
            color="emerald"
          />
          <StatsCard
            icon={XCircle}
            label="Cancelled Appointments"
            value={stats?.cancelledAppointments ?? 0}
            color="rose"
          />
          <StatsCard
            icon={ClipboardList}
            label="Total Prescriptions"
            value={stats?.totalPrescriptions ?? 0}
            color="cyan"
          />
          <StatsCard
            icon={TestTube}
            label="Total Lab Tests"
            value={stats?.totalLabTests ?? 0}
            color="indigo"
          />
          <StatsCard
            icon={FileCheck}
            label="Total Lab Reports"
            value={stats?.totalLabReports ?? 0}
            color="amber"
          />
          <StatsCard
            icon={Receipt}
            label="Total Medical Bills"
            value={stats?.totalBills ?? 0}
            color="blue"
          />
          <StatsCard
            icon={CreditCard}
            label="Paid Bills"
            value={stats?.paidBills ?? 0}
            color="emerald"
          />
        </div>
      </div>

      {/* Grid of Shortcuts */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-slate-800">Quick Actions Portal</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c, idx) => (
            <Link
              key={idx}
              to={c.path}
              className="group border border-slate-200 bg-white rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${
                  c.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                  c.color === 'purple' ? 'bg-purple-50 text-purple-600' :
                  c.color === 'emerald' ? 'bg-emerald-50 text-emerald-600' :
                  c.color === 'cyan' ? 'bg-cyan-50 text-cyan-600' :
                  c.color === 'rose' ? 'bg-rose-50 text-rose-600' :
                  'bg-amber-50 text-amber-600'
                }`}>
                  <c.icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">{c.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{c.desc}</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 group-hover:underline pt-2">
                Launch Portal
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
