/**
 * Patient Dashboard Page
 * Provides welcome overview, real-time metrics from GET /api/dashboard/patient/{patientId}, and quick action portal.
 * 100% Swagger Field Mapping for PatientDashboardResponse (9 fields).
 */
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Calendar, ClipboardList, Receipt, Stethoscope, ArrowRight, TestTube, CheckCircle, HeartPulse, XCircle, Clock, FileCheck, CreditCard, Bell, ShieldAlert, AlertTriangle } from 'lucide-react';
import dashboardApi from '../../api/dashboardApi';
import appointmentApi from '../../api/appointmentApi';
import StatsCard from '../../components/common/StatsCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PatientNotificationsModal from '../../components/patient/PatientNotificationsModal';

export default function PatientDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [emergencyRejections, setEmergencyRejections] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const patientId = user?.patientId || user?.userId || user?.id;
      if (!patientId) return;
      try {
        const res = await dashboardApi.getPatientStats(patientId).catch(() => null);
        if (res?.data) {
          setStats(res.data);
        }

        // Fetch patient appointments & local emergency notifications
        const apptRes = await appointmentApi.getByPatient(patientId).catch(() => ({ data: [] }));
        const rawAppts = apptRes.data || [];
        const localEmergencies = JSON.parse(localStorage.getItem('hms_emergency_doctors') || '[]');
        const localCancelled = JSON.parse(localStorage.getItem('hms_cancelled_emergency_appts') || '[]');
        const localNotifs = JSON.parse(localStorage.getItem('hms_local_notifications') || '[]');

        // Filter notifications for this patient
        const myEmergencyNotifs = localNotifs.filter(
          (n) => (String(n.patientId) === String(patientId) || n.role === 'PATIENT') && (n.emergency || n.title?.includes('Emergency'))
        );

        const rejectedItems = [];

        for (const item of rawAppts) {
          const id = item.id || item.appointmentId;
          const isDocInEmergency = localEmergencies.map((x) => String(x)).includes(String(item.doctorId));
          const isApptCancelled = localCancelled.map((x) => String(x)).includes(String(id));
          const matchingNotif = myEmergencyNotifs.find((n) => n.message?.includes(`#${id}`));

          if (isDocInEmergency || isApptCancelled || item.status === 'REJECTED' || matchingNotif) {
            rejectedItems.push({
              id,
              doctorName: item.doctorName || (item.doctorFirstName ? `Dr. ${item.doctorFirstName} ${item.doctorLastName || ''}` : 'Specialist Practitioner'),
              appointmentDate: item.appointmentDate || item.date,
              reason: matchingNotif?.rejectionReason || matchingNotif?.message || item.reason || 'Consultation cancelled due to Doctor Emergency.',
            });
          }
        }

        // If no appts in API match, but local emergency notifications exist for this patient
        if (rejectedItems.length === 0 && myEmergencyNotifs.length > 0) {
          myEmergencyNotifs.forEach((n) => {
            rejectedItems.push({
              id: n.id,
              doctorName: 'Specialist Practitioner',
              reason: n.rejectionReason || n.message || 'Consultation cancelled due to Doctor Emergency.',
            });
          });
        }

        setEmergencyRejections(rejectedItems);
      } catch (err) {
        console.error('Failed to load patient dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    const handleRefresh = () => fetchData();
    window.addEventListener('hms_notification_trigger', handleRefresh);
    window.addEventListener('hms_dashboard_refresh', handleRefresh);
    return () => {
      window.removeEventListener('hms_notification_trigger', handleRefresh);
      window.removeEventListener('hms_dashboard_refresh', handleRefresh);
    };
  }, [user]);

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
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white shadow-md relative overflow-hidden flex items-center justify-between">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-white/5 rounded-l-full blur-2xl pointer-events-none" />
        <div className="relative space-y-2 max-w-xl">
          <h1 className="text-2xl font-bold tracking-wide font-sans">Welcome Back, {user?.name || 'Patient'}!</h1>
          <p className="text-sm text-blue-100">
            Access your medical bills, browse specialist practitioners, track scheduled doctor appointments, and check issued prescription guides.
          </p>
        </div>
        <button
          onClick={() => setShowNotifications(true)}
          className="relative inline-flex items-center gap-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 text-sm font-semibold text-white transition-all cursor-pointer shadow-xs shrink-0"
        >
          <Bell className="h-4 w-4" />
          <span>Notifications</span>
        </button>
      </div>

      <PatientNotificationsModal
        patientId={user?.userId}
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      {/* ── BIG EMERGENCY REJECTION ALERT BANNER FOR PATIENT ── */}
      {emergencyRejections.length > 0 && (
        <div className="rounded-3xl border-2 border-rose-500 bg-gradient-to-r from-rose-500/10 via-red-500/5 to-rose-500/10 p-6 shadow-xl relative overflow-hidden animate-fade-in space-y-4">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-lg shrink-0 animate-pulse">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="rounded-full bg-rose-600 px-3 py-0.5 text-xs font-black text-white uppercase tracking-wider shadow-xs">
                  🚨 URGENT NOTICE
                </span>
                <span className="text-xs font-bold text-rose-700">
                  {emergencyRejections.length} Consultation Request{emergencyRejections.length > 1 ? 's' : ''} Rejected
                </span>
              </div>
              <h2 className="text-xl font-black text-rose-950 tracking-tight">
                Appointment Rejected Due to Doctor Emergency
              </h2>
              <p className="text-xs font-medium text-rose-800 leading-relaxed">
                Your consultation booking could not proceed as your physician was called for an emergency procedure. Rejection prompt details:
              </p>
            </div>
          </div>

          {/* List of Rejections */}
          <div className="space-y-2.5 pt-1">
            {emergencyRejections.map((item, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-white/95 p-4 border border-rose-200 shadow-sm">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                      Appt #{item.id}
                    </span>
                    <span className="text-sm font-bold text-slate-800">{item.doctorName}</span>
                  </div>
                  <p className="text-xs text-rose-900 font-medium">
                    "{item.reason}"
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setShowNotifications(true)}
                    className="inline-flex items-center justify-center gap-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Bell className="h-3.5 w-3.5" />
                    <span>View Bell Msg</span>
                  </button>
                  <button
                    onClick={() => navigate('/patient/book-appointment')}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 text-xs font-bold shadow-md transition-all shrink-0 cursor-pointer"
                  >
                    <span>Reschedule Now</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 100% Real Stats Cards from PatientDashboardResponse (9 fields) */}
      <div>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Your Medical Overview</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <StatsCard
            icon={Calendar}
            label="Total Appointments"
            value={stats?.totalAppointments ?? 0}
            color="blue"
            onClick={() => navigate('/patient/appointments')}
          />
          <StatsCard
            icon={Clock}
            label="Upcoming Appointments"
            value={stats?.upcomingAppointments ?? 0}
            color="purple"
            onClick={() => navigate('/patient/appointments')}
          />
          <StatsCard
            icon={CheckCircle}
            label="Completed Appointments"
            value={stats?.completedAppointments ?? 0}
            color="emerald"
            onClick={() => navigate('/patient/appointments')}
          />
          <StatsCard
            icon={XCircle}
            label="Cancelled Appointments"
            value={stats?.cancelledAppointments ?? 0}
            color="rose"
            onClick={() => navigate('/patient/appointments')}
          />
          <StatsCard
            icon={ClipboardList}
            label="Total Prescriptions"
            value={stats?.totalPrescriptions ?? 0}
            color="cyan"
            onClick={() => navigate('/patient/prescriptions')}
          />
          <StatsCard
            icon={TestTube}
            label="Total Lab Tests"
            value={stats?.totalLabTests ?? 0}
            color="indigo"
            onClick={() => navigate('/patient/lab-tests')}
          />
          <StatsCard
            icon={FileCheck}
            label="Total Lab Reports"
            value={stats?.totalLabReports ?? 0}
            color="amber"
            onClick={() => navigate('/patient/lab-reports')}
          />
          <StatsCard
            icon={Receipt}
            label="Total Medical Bills"
            value={stats?.totalBills ?? 0}
            color="blue"
            onClick={() => navigate('/patient/bills')}
          />
          <StatsCard
            icon={CreditCard}
            label="Paid Bills"
            value={stats?.paidBills ?? 0}
            color="emerald"
            onClick={() => navigate('/patient/bills')}
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
