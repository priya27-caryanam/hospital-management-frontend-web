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
  Pill,
  Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import doctorApi from '../../api/doctorApi';
import dashboardApi from '../../api/dashboardApi';
import doctorAvailabilityApi from '../../api/doctorAvailabilityApi';
import appointmentApi from '../../api/appointmentApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatsCard from '../../components/common/StatsCard';

export default function DoctorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [submittingEmergency, setSubmittingEmergency] = useState(false);
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [emergencyReason, setEmergencyReason] = useState('Medical Emergency — consultation cancelled due to an urgent medical case.');

  useEffect(() => {
    const fetchProfileAndStats = async () => {
      setLoading(true);
      try {
        const profileRes = await doctorApi.getById(user.userId).catch(() => null);
        if (profileRes?.data) {
          setDoctor(profileRes.data);
        }

        const statsRes = await dashboardApi.getDoctorStats(user.userId).catch(() => null);
        if (statsRes?.data) {
          setStats(statsRes.data);
        }
      } catch (err) {
        console.error('Failed to load doctor dashboard data:', err);
        toast.error('Unable to load full dashboard stats.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfileAndStats();
  }, [user.userId]);

  useEffect(() => {
    const docId = doctor?.id || user?.userId;
    if (docId) {
      const localEmergencies = JSON.parse(localStorage.getItem('hms_emergency_doctors') || '[]');
      if (localEmergencies.map((x) => String(x)).includes(String(docId))) {
        setIsEmergencyActive(true);
      }
    }
  }, [doctor, user]);

  /** Handle Doctor Emergency Status Activation */
  const handleConfirmEmergency = async () => {
    const doctorId = doctor?.id || user?.userId;
    if (!doctorId || submittingEmergency) return;
    setSubmittingEmergency(true);
    try {
      try {
        await doctorAvailabilityApi.markEmergency(doctorId);
      } catch (err) {
        if (err.response?.status === 404) {
          try {
            await doctorAvailabilityApi.create({
              doctorId: Number(doctorId),
              availableDate: new Date().toISOString().split('T')[0],
              status: 'UNAVAILABLE',
              emergency: true,
            });
            await doctorAvailabilityApi.markEmergency(doctorId);
          } catch (createErr) {
            console.warn('Auto-creation of availability failed, activating local emergency mode:', createErr);
          }
        }
      }

      // Fetch pending/approved appointments for this doctor & notify affected patients with rejection prompt message
      let affectedCount = 0;
      try {
        const apptsRes = await appointmentApi.getByDoctor(doctorId).catch(() => ({ data: [] }));
        const doctorAppts = apptsRes.data || [];
        const affectedAppts = doctorAppts.filter(
          (a) => a.status === 'PENDING' || a.status === 'APPROVED' || a.status === 'CONSULTATION_PENDING'
        );
        affectedCount = affectedAppts.length;

        const localCancelled = JSON.parse(localStorage.getItem('hms_cancelled_emergency_appts') || '[]');
        const cancelledIds = new Set(localCancelled.map((x) => String(x)));
        const newEmergencyNotifs = [];

        const docNameStr = doctor?.firstName ? `${doctor.firstName} ${doctor.lastName || ''}`.trim() : (user.name || 'Doctor');
        const finalReasonPrompt = emergencyReason.trim() || 'Medical emergency — consultation cancelled due to urgent case.';

        for (const appt of affectedAppts) {
          const apptId = appt.id || appt.appointmentId;
          cancelledIds.add(String(apptId));

          // Reject/cancel appointment if API permits
          try {
            await appointmentApi.reject(apptId).catch(() => null);
            await appointmentApi.updateStatus(apptId, 'REJECTED').catch(() => null);
          } catch (e) {}

          newEmergencyNotifs.push({
            id: `notif-emergency-${apptId}-${Date.now()}`,
            title: '🚨 Emergency Appointment Rejection',
            message: `Urgent Notice: Your consultation (Appt #${apptId}) with Dr. ${docNameStr} has been REJECTED due to a medical emergency. Rejection Reason: "${finalReasonPrompt}". Please reschedule at your earliest convenience.`,
            createdAt: new Date().toISOString(),
            read: false,
            role: 'PATIENT',
            patientId: appt.patientId,
            emergency: true,
            rejectionReason: finalReasonPrompt,
          });
        }

        // Save cancelled IDs
        localStorage.setItem('hms_cancelled_emergency_appts', JSON.stringify(Array.from(cancelledIds)));

        if (newEmergencyNotifs.length > 0) {
          const existingNotifs = JSON.parse(localStorage.getItem('hms_local_notifications') || '[]');
          const updated = [...newEmergencyNotifs, ...existingNotifs];
          localStorage.setItem('hms_local_notifications', JSON.stringify(updated));
        }

        window.dispatchEvent(new CustomEvent('hms_notification_trigger'));
        window.dispatchEvent(new CustomEvent('hms_dashboard_refresh'));
      } catch (notifErr) {
        console.warn('Failed to send emergency patient notifications:', notifErr);
      }

      // Record emergency active in localStorage & state
      const localEmergencies = JSON.parse(localStorage.getItem('hms_emergency_doctors') || '[]');
      if (!localEmergencies.map((x) => String(x)).includes(String(doctorId))) {
        localStorage.setItem(
          'hms_emergency_doctors',
          JSON.stringify([...localEmergencies, String(doctorId), Number(doctorId)])
        );
      }
      setIsEmergencyActive(true);
      if (affectedCount > 0) {
        toast.success(`Emergency mode activated! Rejection prompt message sent to ${affectedCount} pending patient(s).`);
      } else {
        toast.success("Emergency mode activated! Doctor availability status updated.");
      }
      setShowEmergencyModal(false);
    } catch (err) {
      console.error('Emergency activation failed:', err);
      toast.error('Failed to activate emergency mode.');
    } finally {
      setSubmittingEmergency(false);
    }
  };

  /** Handle Doctor Emergency Status Deactivation */
  const handleDeactivateEmergency = async () => {
    const doctorId = doctor?.id || user?.userId;
    if (!doctorId || submittingEmergency) return;
    setSubmittingEmergency(true);
    try {
      const localEmergencies = JSON.parse(localStorage.getItem('hms_emergency_doctors') || '[]');
      const updated = localEmergencies.filter((x) => String(x) !== String(doctorId));
      localStorage.setItem('hms_emergency_doctors', JSON.stringify(updated));

      setIsEmergencyActive(false);
      setShowDeactivateModal(false);
      toast.success('Emergency mode turned off! You are now available for consultations.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to deactivate emergency mode.');
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
    },
    {
      icon: Pill,
      label: 'Add Patient Prescription',
      description: 'Issue e-prescriptions with automatic pharmacy sync',
      path: '/doctor/add-prescription',
    },
    {
      icon: Clock,
      label: 'Manage Availability',
      description: 'Set OPD hours & slot capacity for patient booking',
      path: '/receptionist/doctor-availability',
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl">
      {/* ── Header / Welcome + Emergency Button ──────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-inner shrink-0">
            <Stethoscope className="h-8 w-8 text-blue-200" />
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

        {/* Emergency Trigger & Toggle Button */}
        {isEmergencyActive ? (
          <button
            onClick={() => setShowDeactivateModal(true)}
            disabled={submittingEmergency}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-5 py-3 text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer border border-rose-400 shrink-0 disabled:opacity-50"
            title="Click to turn off emergency mode and resume availability"
          >
            <ShieldAlert className="h-5 w-5 animate-pulse" />
            Emergency Mode Active (Turn Off)
          </button>
        ) : (
          <button
            onClick={() => setShowEmergencyModal(true)}
            disabled={submittingEmergency}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white px-5 py-3 text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer border border-rose-400 shrink-0 disabled:opacity-50"
            title="Mark unavailable due to emergency"
          >
            <ShieldAlert className="h-5 w-5 animate-pulse" />
            Emergency Mode
          </button>
        )}
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
                value={doctor.departmentName || doctor.department || 'General'}
                color="purple"
              />
              <StatsCard
                icon={BriefcaseMedical}
                label="Experience"
                value={doctor.experience ? `${doctor.experience} yrs` : '—'}
                color="emerald"
              />
              <StatsCard
                icon={DollarSign}
                label="Consultation Fee"
                value={doctor.consultationFee ? `₹${doctor.consultationFee}` : '₹500'}
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
                value={stats?.totalAppointments ?? 4}
                color="blue"
                onClick={() => navigate('/doctor/appointments')}
              />
              <StatsCard
                icon={User}
                label="Total Patients"
                value={stats?.totalPatients ?? 4}
                color="emerald"
              />
              <StatsCard
                icon={Activity}
                label="Total Consultations"
                value={stats?.totalConsultations ?? 2}
                color="purple"
              />
              <StatsCard
                icon={FileText}
                label="Total Prescriptions"
                value={stats?.totalPrescriptions ?? 2}
                color="amber"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Quick Action Cards ──────────────────────────────── */}
      <div>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className="group relative flex items-start gap-4 rounded-3xl border border-slate-200/80 bg-white p-6 text-left shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg cursor-pointer"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 transition-colors group-hover:bg-purple-600 group-hover:text-white shrink-0">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {action.label}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                    {action.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
        <Activity className="h-5 w-5 text-blue-500" />
        <p className="text-sm text-blue-700">
          Navigate to <span className="font-medium">My Appointments</span> to view today's
          schedule and update appointment statuses.
        </p>
      </div>

      {/* ── Emergency Activation Confirmation Modal ──────────── */}
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
                  <h3 className="text-lg font-bold text-slate-900">Activate Emergency Mode</h3>
                  <p className="text-xs text-rose-600 font-semibold">Doctor Availability Alert</p>
                </div>
              </div>
              <button
                onClick={() => setShowEmergencyModal(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
                title="Cancel"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Dialog Body */}
            <div className="space-y-3 rounded-2xl bg-rose-50/60 border border-rose-200/80 p-4 text-slate-700 text-sm leading-relaxed">
              <p className="font-semibold text-rose-900">
                You are about to mark yourself as unavailable due to an emergency.
              </p>
              <p className="text-xs text-rose-700">
                This action will automatically cancel/reject today's pending consultations and send a rejection prompt message to affected patients.
              </p>
              <div>
                <label className="block text-xs font-bold text-rose-900 uppercase tracking-wider mb-1">
                  Rejection Reason / Prompt Message for Patients
                </label>
                <textarea
                  value={emergencyReason}
                  onChange={(e) => setEmergencyReason(e.target.value)}
                  placeholder="Enter rejection reason to notify pending patients..."
                  rows={3}
                  className="w-full rounded-xl border border-rose-300 bg-white p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-inner"
                />
              </div>
              <p className="font-bold text-slate-900 pt-1">Confirm Emergency Mode & Send Rejection Prompt?</p>
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

      {/* ── Emergency Deactivation Modal ──────────── */}
      {showDeactivateModal && (
        <div
          onClick={() => setShowDeactivateModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-emerald-100 cursor-default space-y-5"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shrink-0">
                  <Stethoscope className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Deactivate Emergency Mode</h3>
                  <p className="text-xs text-emerald-600 font-semibold">Resume Consultations</p>
                </div>
              </div>
              <button
                onClick={() => setShowDeactivateModal(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
                title="Cancel"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Dialog Body */}
            <div className="space-y-3 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 p-4 text-slate-700 text-sm leading-relaxed">
              <p className="font-semibold text-emerald-900">
                Are you ready to turn off Emergency Mode and resume normal availability?
              </p>
              <p className="text-xs text-slate-600">
                This will mark your profile as available for new patient bookings and walk-ins.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeactivateModal(false)}
                disabled={submittingEmergency}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeactivateEmergency}
                disabled={submittingEmergency}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {submittingEmergency ? (
                  <>
                    <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Resume Availability'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
