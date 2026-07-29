/**
 * DoctorDashboard — Main dashboard for logged-in doctors
 * Shows welcome message, profile stats, quick action links, and emergency status declaration.
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
  FlaskConical,
  AlertTriangle,
  ShieldAlert,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import doctorApi from '../../api/doctorApi';
import dashboardApi from '../../api/dashboardApi';
import doctorAvailabilityApi from '../../api/doctorAvailabilityApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatsCard from '../../components/common/StatsCard';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Emergency Modal state
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [submittingEmergency, setSubmittingEmergency] = useState(false);

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

  /** Handle Doctor Emergency Status Confirmation */
  const handleConfirmEmergency = async () => {
    const doctorId = doctor?.id || user?.userId;
    if (!doctorId) {
      toast.error('Doctor profile ID not found.');
      return;
    }
    setSubmittingEmergency(true);
    try {
      await doctorAvailabilityApi.markEmergency(doctorId);
      toast.success('Emergency mode activated! Status updated & today\'s affected appointments cancelled.');
      setShowEmergencyModal(false);
    } catch (err) {
      console.error('Emergency activation failed:', err);
      const errMsg = err.response?.data?.message || err.message || 'Failed to activate emergency mode.';
      toast.error(errMsg);
    } finally {
      setSubmittingEmergency(false);
    }
  };

  if (loading) return <LoadingSpinner fullPage />;

  /* ── Quick-action cards ───────────────────────────────── */
  const quickActions = [
    {
      icon: CalendarCheck,
      label: 'My Appointments & Consults',
      description: 'View schedule, record consultations & order lab tests',
      path: '/doctor/appointments',
      color: 'blue',
    },
    {
      icon: FlaskConical,
      label: 'Order Diagnostic Lab',
      description: 'Request blood tests, X-rays & diagnostic orders',
      path: '/doctor/appointments',
      color: 'purple',
    },
    {
      icon: FileText,
      label: 'Add Prescription',
      description: 'Write a new prescription for a patient',
      path: '/doctor/prescriptions',
      color: 'green',
    },
    {
      icon: User,
      label: 'My Profile',
      description: 'View your professional profile details',
      path: '/doctor/profile',
      color: 'blue',
    },
  ];

  return (
    <div className="space-y-8">
      {/* ── Header / Welcome + Emergency Button ──────────── */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 md:p-8 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm shrink-0">
            <Stethoscope className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">
              Welcome back, Dr. {doctor?.firstName ?? user.name ?? 'Doctor'}{' '}
              {doctor?.lastName ?? ''}
            </h1>
            <p className="mt-1 text-blue-100">
              {doctor?.specializationName || doctor?.specialization
                ? `${doctor.specializationName || doctor.specialization} Specialist`
                : 'Your dashboard overview'}
            </p>
          </div>
        </div>

        {/* Emergency Trigger Button */}
        <button
          onClick={() => setShowEmergencyModal(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white px-5 py-3 text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer border border-rose-400 shrink-0"
          title="Mark unavailable due to emergency"
        >
          <ShieldAlert className="h-5 w-5 animate-pulse" />
          Emergency Mode
        </button>
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
                value={doctor.specializationName || doctor.specialization || '—'}
                color="blue"
                onClick={() => navigate('/doctor/profile')}
              />
              <StatsCard
                icon={Building2}
                label="Department"
                value={doctor.departmentName || doctor.department || '—'}
                color="purple"
                onClick={() => navigate('/doctor/profile')}
              />
              <StatsCard
                icon={BriefcaseMedical}
                label="Experience"
                value={doctor.experience ? `${doctor.experience} yrs` : '—'}
                color="green"
                onClick={() => navigate('/doctor/profile')}
              />
              <StatsCard
                icon={DollarSign}
                label="Consultation Fee"
                value={doctor.consultationFee ? `₹${doctor.consultationFee}` : '—'}
                color="amber"
                onClick={() => navigate('/doctor/profile')}
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
                onClick={() => navigate('/doctor/appointments')}
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

      {/* ── Emergency Confirmation Modal (Step 4) ──────────── */}
      {showEmergencyModal && (
        <div
          onClick={() => setShowEmergencyModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-rose-100 cursor-default space-y-5"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 shrink-0">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Emergency Mode</h3>
                  <p className="text-xs text-rose-600 font-semibold">Doctor Availability Alert</p>
                </div>
              </div>
              <button
                onClick={() => setShowEmergencyModal(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                title="Cancel"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Confirmation Dialog Body */}
            <div className="space-y-3 rounded-2xl bg-rose-50/60 border border-rose-200/80 p-4 text-slate-700 text-sm leading-relaxed">
              <p className="font-semibold text-rose-900">
                You are about to mark yourself as unavailable due to an emergency.
              </p>
              <p className="text-xs text-rose-700">
                This action may affect today's scheduled appointments.
              </p>
              <p className="font-bold text-slate-900 pt-1">Continue?</p>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowEmergencyModal(false)}
                disabled={submittingEmergency}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmEmergency}
                disabled={submittingEmergency}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {submittingEmergency ? (
                  <>
                    <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Updating Status...
                  </>
                ) : (
                  'Confirm Emergency'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

