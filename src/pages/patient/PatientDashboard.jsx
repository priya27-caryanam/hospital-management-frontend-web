/**
 * Patient Dashboard Page
 * Provides welcome overview, real-time metrics from GET /api/dashboard/patient/{patientId}, and quick action portal.
 * 100% Swagger Field Mapping for PatientDashboardResponse (9 fields).
 */
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Calendar, ClipboardList, Receipt, Stethoscope, ArrowRight, TestTube, CheckCircle, HeartPulse, XCircle, Clock, FileCheck, CreditCard, Bell, ShieldAlert, AlertTriangle, X, Printer, Download } from 'lucide-react';
import dashboardApi from '../../api/dashboardApi';
import appointmentApi from '../../api/appointmentApi';
import billingApi from '../../api/billingApi';
import prescriptionApi from '../../api/prescriptionApi';
import labOrderApi from '../../api/labOrderApi';
import toast from 'react-hot-toast';
import StatsCard from '../../components/common/StatsCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PatientNotificationsModal from '../../components/patient/PatientNotificationsModal';

export default function PatientDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [emergencyRejections, setEmergencyRejections] = useState([]);
  const [acknowledgedRejections, setAcknowledgedRejections] = useState(() => {
    return JSON.parse(localStorage.getItem('hms_acknowledged_rejections') || '[]');
  });
  const [showPopupModal, setShowPopupModal] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  useEffect(() => {
    if (emergencyRejections.length > 0) {
      const activeUnack = emergencyRejections.filter(
        (item) => !acknowledgedRejections.map(String).includes(String(item.id))
      );
      if (activeUnack.length > 0) {
        setShowPopupModal(true);
      }
    }
  }, [emergencyRejections, acknowledgedRejections]);

  const handleDismissAllRejections = () => {
    const updated = [...acknowledgedRejections, ...emergencyRejections.map((item) => String(item.id))];
    setAcknowledgedRejections(updated);
    localStorage.setItem('hms_acknowledged_rejections', JSON.stringify(updated));
    setShowPopupModal(false);
  };

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

        // Fetch lab orders and payment history receipts
        setLoadingHistory(true);
        const labRes = await labOrderApi.getByPatient(patientId).catch(() => ({ data: [] }));
        const rawLabs = labRes.data || [];

        const historyItems = [];

        // Gather paid consultations
        const paidAppts = rawAppts.filter((a) => a.isPaid);
        await Promise.allSettled(
          paidAppts.slice(0, 3).map(async (appt) => {
            try {
              const rRes = await billingApi.consultationReceipt(appt.id || appt.appointmentId);
              if (rRes?.data) {
                historyItems.push({
                  id: appt.id || appt.appointmentId,
                  receiptNumber: rRes.data.receiptNumber,
                  transactionId: rRes.data.transactionId,
                  paymentType: 'CONSULTATION',
                  paymentDate: rRes.data.paymentDate,
                  amount: rRes.data.amount,
                  paymentStatus: rRes.data.paymentStatus,
                  paymentMode: rRes.data.paymentMode,
                  doctorName: appt.doctorName || 'Specialist Practitioner',
                  patientName: user?.name,
                  rawReceipt: rRes.data,
                });
              }
            } catch (e) {
              console.error('Consultation receipt fetch failed:', e);
            }
          })
        );

        // Gather pharmacy receipts
        const completedAppts = rawAppts.filter((a) => a.status === 'COMPLETED' || a.status === 'CONSULTATION_DONE');
        await Promise.allSettled(
          completedAppts.slice(0, 3).map(async (appt) => {
            try {
              const pRes = await prescriptionApi.getByAppointment(appt.id || appt.appointmentId).catch(() => null);
              if (pRes?.data) {
                const rx = pRes.data;
                const localPaidPharmacy = JSON.parse(localStorage.getItem('hms_paid_prescriptions') || '[]');
                const isLocalPaid = localPaidPharmacy.map(String).includes(String(rx.prescriptionId || rx.id));
                if (rx.status === 'DISPENSED' || isLocalPaid) {
                  const rRes = await billingApi.pharmacyReceipt(rx.prescriptionId || rx.id);
                  if (rRes?.data) {
                    historyItems.push({
                      id: rx.prescriptionId || rx.id,
                      receiptNumber: rRes.data.receiptNumber,
                      transactionId: rRes.data.transactionId,
                      paymentType: 'PHARMACY',
                      paymentDate: rRes.data.paymentDate,
                      amount: rRes.data.amount,
                      paymentStatus: rRes.data.paymentStatus,
                      paymentMode: rRes.data.paymentMode,
                      doctorName: appt.doctorName || 'Specialist Practitioner',
                      patientName: user?.name,
                      rawReceipt: rRes.data,
                    });
                  }
                }
              }
            } catch (e) {
              console.error('Pharmacy receipt fetch failed:', e);
            }
          })
        );

        // Gather paid laboratory receipts
        const paidLabs = rawLabs.filter((l) => l.isPaid || l.paymentStatus === 'PAID');
        await Promise.allSettled(
          paidLabs.slice(0, 3).map(async (lab) => {
            try {
              const rRes = await billingApi.labReceipt(lab.id);
              if (rRes?.data) {
                historyItems.push({
                  id: lab.id,
                  receiptNumber: rRes.data.receiptNumber,
                  transactionId: rRes.data.transactionId,
                  paymentType: 'LABORATORY',
                  paymentDate: rRes.data.paymentDate,
                  amount: rRes.data.amount,
                  paymentStatus: rRes.data.paymentStatus,
                  paymentMode: rRes.data.paymentMode,
                  doctorName: lab.doctorName || 'Laboratory Practitioner',
                  patientName: user?.name,
                  rawReceipt: rRes.data,
                });
              }
            } catch (e) {
              console.error('Laboratory receipt fetch failed:', e);
            }
          })
        );

        historyItems.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));
        setPaymentHistory(historyItems);
      } catch (err) {
        console.error('Failed to load patient dashboard stats:', err);
      } finally {
        setLoading(false);
        setLoadingHistory(false);
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

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = (receipt) => {
    if (!receipt) return;
    const content = `
HOSPITAL MANAGEMENT SYSTEM
-----------------------------------
Official Payment Receipt
Receipt Number: ${receipt.receiptNumber}
Transaction ID: ${receipt.transactionId || 'N/A'}
Patient Name: ${receipt.patientName || user?.name || 'N/A'}
Doctor Name: ${receipt.doctorName || 'N/A'}
Payment Type: ${receipt.paymentType}
Payment Mode: ${receipt.paymentMode || 'CASH'}
Payment Date: ${formatDate(receipt.paymentDate)}
Amount: ₹${receipt.amount}
Payment Status: ${receipt.paymentStatus}
-----------------------------------
This is a verified computer-generated receipt.
`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Receipt_${receipt.receiptNumber}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Receipt details downloaded.');
  };

  const cards = [
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

  const activeRejections = emergencyRejections.filter(
    (item) => !acknowledgedRejections.map(String).includes(String(item.id))
  );

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
      {activeRejections.length > 0 && (
        <div className="rounded-3xl border border-rose-200/80 bg-gradient-to-br from-rose-50/95 via-red-50/70 to-rose-50/95 p-6 shadow-[0_20px_50px_rgba(244,63,94,0.05)] relative overflow-hidden animate-fade-in space-y-5">
          {/* Decorative backdrop glow */}
          <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-rose-500/5 rounded-l-full blur-3xl pointer-events-none" />
          
          {/* Top Line Accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-rose-500 to-amber-500" />

          {/* Dismiss Banner Button */}
          <button
            onClick={handleDismissAllRejections}
            className="absolute top-4 right-4 rounded-xl p-1.5 text-rose-400 hover:bg-rose-100/50 hover:text-rose-700 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title="Dismiss all alerts"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-start gap-4 pr-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 border border-rose-100 text-rose-500 shadow-sm shrink-0 animate-pulse-soft">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="rounded-full bg-rose-600 px-3 py-0.5 text-[9px] font-black text-white uppercase tracking-widest shadow-xs">
                  🚨 URGENT NOTICE
                </span>
                <span className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping"></span>
                  {activeRejections.length} Consultation Request{activeRejections.length > 1 ? 's' : ''} Rejected
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Appointment Cancelled Due to Doctor Emergency
              </h2>
              <p className="text-xs font-semibold text-rose-800/90 leading-relaxed max-w-2xl">
                We regret to inform you that your physician has been called to attend an urgent medical case. Rejection details are shown below:
              </p>
            </div>
          </div>

          {/* List of Rejections */}
          <div className="space-y-3 pt-1">
            {activeRejections.map((item, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-white/95 p-4 border border-rose-100/70 shadow-xs hover:shadow-sm hover:border-rose-200 transition-all">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200/50">
                      Appt #{item.id}
                    </span>
                    <span className="text-sm font-extrabold text-slate-800">{item.doctorName}</span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium italic pl-1">
                    "{item.reason}"
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => setShowNotifications(true)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/60 text-slate-600 px-4 py-2 text-xs font-bold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  >
                    <Bell className="h-3.5 w-3.5" />
                    <span>View Notifications</span>
                  </button>
                  <button
                    onClick={() => navigate('/patient/book-appointment')}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white px-5 py-2 text-xs font-bold shadow-md shadow-rose-100 transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0 cursor-pointer border border-rose-500/20 flex items-center gap-1"
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

      {/* ── EMERGENCY REJECTION POPUP MODAL FOR PATIENT ── */}
      {showPopupModal && activeRejections.length > 0 && (
        <div
          onClick={handleDismissAllRejections}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md transition-all duration-300 ease-out cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-[0_24px_60px_-15px_rgba(244,63,94,0.18)] border border-rose-100 cursor-default space-y-6 animate-scale-in overflow-hidden"
          >
            {/* Top Accent Gradient Line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-rose-500 to-amber-500 rounded-t-3xl" />

            {/* Header */}
            <div className="flex items-start justify-between pt-1">
              <div className="flex items-center gap-3.5">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 shrink-0 shadow-xs shadow-rose-100 animate-pulse-soft">
                  <ShieldAlert className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Emergency Notice</h3>
                  <p className="text-[11px] text-rose-600 font-bold uppercase tracking-wider">Appointment Cancellation Update</p>
                </div>
              </div>
              <button
                onClick={handleDismissAllRejections}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4">
              <div className="rounded-2xl bg-gradient-to-br from-rose-50/80 to-rose-100/30 border border-rose-100/70 p-4 text-slate-700 text-sm leading-relaxed shadow-xs space-y-3">
                <p className="font-semibold text-rose-950 text-[13px] flex items-start gap-2">
                  <span className="mt-1 flex h-2 w-2 shrink-0 rounded-full bg-rose-500 animate-ping" />
                  Your appointment could not proceed due to a doctor emergency.
                </p>
                <p className="text-xs text-rose-800 leading-normal font-medium bg-white/60 p-3 rounded-xl border border-rose-100/40">
                  We apologize for the inconvenience. Your physician was called to attend an urgent medical procedure. You can easily reschedule with any available practitioner.
                </p>
              </div>

              {/* Cancellation list details */}
              <div className="max-h-48 overflow-y-auto space-y-2.5 pr-1">
                {activeRejections.map((item, idx) => (
                  <div key={idx} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 shadow-2xs animate-fade-in">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[9px] font-bold text-rose-600 bg-rose-50 border border-rose-200/50 px-2 py-0.5 rounded-md">
                        Appt #{item.id}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">Cancellation Reason</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 mb-1">{item.doctorName}</h4>
                    <p className="text-[11px] text-slate-600 bg-white border border-slate-100 p-2.5 rounded-lg font-medium italic">
                      "{item.reason}"
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={handleDismissAllRejections}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-800 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                Acknowledge & Close
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDismissAllRejections();
                  navigate('/patient/book-appointment');
                }}
                className="rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white px-5 py-2.5 text-xs font-bold shadow-md hover:shadow-lg shadow-rose-100 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer border border-rose-500/20 flex items-center gap-1.5"
              >
                <span>Reschedule Now</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
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

      {/* Payment History Section */}
      <div className="space-y-4 pt-6 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Payment History & Receipts</h2>
            <p className="text-xs text-slate-500">Access official billing records and payment receipts</p>
          </div>
          {loadingHistory && (
            <span className="text-xs text-blue-600 font-semibold animate-pulse">Updating records...</span>
          )}
        </div>

        {paymentHistory.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 text-center text-slate-400 text-xs font-semibold">
            No paid receipts found in your history logs.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paymentHistory.map((receipt) => (
              <div
                key={`${receipt.paymentType}-${receipt.id}`}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`rounded-full px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${
                      receipt.paymentType === 'CONSULTATION' ? 'bg-blue-100 text-blue-800' :
                      receipt.paymentType === 'PHARMACY' ? 'bg-emerald-100 text-emerald-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {receipt.paymentType}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 font-bold">
                      #{receipt.receiptNumber}
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-1.5 text-xs text-slate-600 font-medium">
                    <div className="flex justify-between">
                      <span>Receipt Number:</span>
                      <span className="font-bold text-slate-800">{receipt.receiptNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Payment Date:</span>
                      <span className="font-semibold text-slate-800">{formatDate(receipt.paymentDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Amount Paid:</span>
                      <span className="font-bold text-slate-800">₹{Number(receipt.amount).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Payment Status:</span>
                      <span className="font-bold text-emerald-600 uppercase">{receipt.paymentStatus}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setSelectedReceipt(receipt);
                      setShowReceiptModal(true);
                    }}
                    className="flex-1 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-700 py-2 text-[11px] font-bold transition-all cursor-pointer text-center"
                  >
                    View Receipt
                  </button>
                  <button
                    onClick={() => {
                      setSelectedReceipt(receipt);
                      setTimeout(() => window.print(), 100);
                    }}
                    title="Print Receipt"
                    className="rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-600 p-2 transition-all cursor-pointer"
                  >
                    <Printer className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDownloadPDF(receipt)}
                    title="Download Receipt"
                    className="rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-600 p-2 transition-all cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Premium Printable Receipt Modal */}
      {showReceiptModal && selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-6 animate-scale-in relative border border-slate-100">
            {/* Top Accent Gradient Line */}
            <div className={`absolute top-0 left-0 right-0 h-1.5 rounded-t-3xl bg-gradient-to-r ${
              selectedReceipt.paymentType === 'CONSULTATION' ? 'from-blue-500 to-indigo-600' :
              selectedReceipt.paymentType === 'PHARMACY' ? 'from-emerald-500 to-teal-600' :
              'from-purple-500 to-indigo-600'
            }`} />

            <div className="flex items-center justify-between border-b border-slate-100 pb-3 print:hidden">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-blue-600" />
                <h3 className="text-sm font-extrabold text-slate-900">Official Payment Receipt</h3>
              </div>
              <button
                onClick={() => {
                  setShowReceiptModal(false);
                  setSelectedReceipt(null);
                }}
                className="rounded-full p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Printable Receipt Area */}
            <div className="space-y-4 p-5 rounded-2xl border border-slate-200/80 bg-white text-left text-xs shadow-xs relative">
              <div className="border-b border-slate-150 pb-3.5 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-black tracking-wide text-blue-600 font-sans">HMS HOSPITAL</h2>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Official Medical Billing</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <HeartPulse className="h-6 w-6" />
                </div>
              </div>

              <div className="space-y-2.5 font-medium divide-y divide-slate-100">
                <div className="flex justify-between pt-1">
                  <span className="text-slate-500">Receipt No:</span>
                  <span className="font-extrabold text-slate-800">{selectedReceipt.receiptNumber}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-slate-500">Transaction ID:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedReceipt.transactionId || '—'}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-slate-500">Patient Name:</span>
                  <span className="font-bold text-slate-800">{selectedReceipt.patientName || user?.name}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-slate-500">Physician / Doctor:</span>
                  <span className="font-bold text-slate-800">{selectedReceipt.doctorName || 'N/A'}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-slate-500">Payment Type:</span>
                  <span className="font-bold text-slate-800">{selectedReceipt.paymentType}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-slate-500">Payment Mode:</span>
                  <span className="font-bold text-slate-800">{selectedReceipt.paymentMode || 'CASH'}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-bold text-emerald-600">{selectedReceipt.paymentStatus}</span>
                </div>
                <div className="flex justify-between pt-2">
                  <span className="text-slate-500">Payment Date:</span>
                  <span className="font-bold text-slate-800">{formatDate(selectedReceipt.paymentDate)}</span>
                </div>
                <div className="flex justify-between pt-3 text-sm font-black text-slate-900 border-t border-slate-200">
                  <span>Total Amount Paid:</span>
                  <span className="text-emerald-600">₹{Number(selectedReceipt.amount).toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="text-center pt-3 text-[10px] text-slate-400 font-semibold tracking-wide">
                This is a computer-verified payment statement.
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3 pt-1 print:hidden">
              <button
                onClick={() => handleDownloadPDF(selectedReceipt)}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 py-2.5 text-xs font-bold transition-all cursor-pointer"
              >
                <Download className="h-4 w-4" />
                <span>Download PDF</span>
              </button>
              <button
                onClick={handlePrint}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white py-2.5 text-xs font-bold transition-all shadow-sm hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>Print Receipt</span>
              </button>
            </div>
            <button
              onClick={() => {
                setShowReceiptModal(false);
                setSelectedReceipt(null);
              }}
              className="w-full rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs font-bold py-2.5 transition-colors print:hidden cursor-pointer"
            >
              Close Window
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
