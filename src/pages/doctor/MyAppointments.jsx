/**
 * Doctor MyAppointments Page — Aligned with OpenAPI 3.1 Appointment Workflow
 * Features: Filter tabs (All, Pending, Approved, Completed)
 * Contextual Workflow Action Buttons per status:
 *   - PENDING: Approve, Reject
 *   - APPROVED: Record Consultation, Mark Consultation Completed, Order Lab Test
 *   - CONSULTATION_COMPLETED: View Consultation, Add Prescription, Order Lab Test, Complete Appointment
 *   - COMPLETED: View Consultation, View Prescription, Review Lab Report
 *   - REJECTED: Rejected Badge
 */
import { useState, useEffect, useCallback } from 'react';
import {
  CalendarCheck,
  RefreshCw,
  Stethoscope,
  Eye,
  CheckCircle2,
  XCircle,
  Pill,
  CheckCheck,
  Clock,
  Filter,
  FlaskConical,
  FileCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import doctorApi from '../../api/doctorApi';
import appointmentApi from '../../api/appointmentApi';
import labOrderApi from '../../api/labOrderApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import CreateConsultationModal from '../../components/doctor/CreateConsultationModal';
import ViewConsultationModal from '../../components/doctor/ViewConsultationModal';
import AddPrescriptionModal from '../../components/doctor/AddPrescriptionModal';
import ViewPrescriptionModal from '../../components/common/ViewPrescriptionModal';
import ViewAppointmentDetailsModal from '../../components/common/ViewAppointmentDetailsModal';
import CreateLabOrderModal from '../../components/doctor/CreateLabOrderModal';
import ReviewLabReportModal from '../../components/doctor/ReviewLabReportModal';
import { saveAppointmentName } from '../../utils/appointmentCache';

const STATUS_STYLES = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  APPROVED: 'bg-blue-100 text-blue-800 border-blue-200',
  CONSULTATION_COMPLETED: 'bg-purple-100 text-purple-800 border-purple-200',
  COMPLETED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  REJECTED: 'bg-rose-100 text-rose-800 border-rose-200',
};

export default function MyAppointments() {
  const { user } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [doctorId, setDoctorId] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'PENDING' | 'APPROVED' | 'COMPLETED'

  // Modals state
  const [selectedDetailsApptId, setSelectedDetailsApptId] = useState(null);
  const [createConsultModalId, setCreateConsultModalId] = useState(null);
  const [viewConsultModalId, setViewConsultModalId] = useState(null);
  const [addPrescriptionModalId, setAddPrescriptionModalId] = useState(null);
  const [viewPrescriptionModalId, setViewPrescriptionModalId] = useState(null);
  const [createLabOrderApptId, setCreateLabOrderApptId] = useState(null);
  const [reviewLabReportOrderId, setReviewLabReportOrderId] = useState(null);

  const [labOrdersMap, setLabOrdersMap] = useState({});

  /** Fetch doctor ID and appointments based on active tab */
  const fetchAppointments = useCallback(async () => {
    if (!user?.userId) return;
    setLoading(true);
    try {
      let docId = doctorId;
      if (!docId) {
        const profileRes = await doctorApi.getById(user.userId).catch(() => ({ data: { id: user.userId } }));
        docId = profileRes.data.id ?? profileRes.data.doctorId ?? user.userId;
        setDoctorId(docId);
      }

      let res;
      if (activeTab === 'PENDING') {
        res = await appointmentApi.getPendingAppointments(docId);
      } else if (activeTab === 'APPROVED') {
        res = await appointmentApi.getApprovedAppointments(docId);
      } else if (activeTab === 'COMPLETED') {
        res = await appointmentApi.getCompletedAppointments(docId);
      } else {
        res = await appointmentApi.getByDoctor(docId);
      }

      const list = res.data || [];
      setAppointments(list);

      // Check existing lab orders per appointment using GET /api/lab-orders/appointment/{appointmentId}
      const map = {};
      await Promise.all(
        list.map(async (a) => {
          const apptId = a.id || a.appointmentId;
          if (apptId) {
            try {
              const loRes = await labOrderApi.getByAppointment(apptId);
              if (loRes.data) {
                const loObj = Array.isArray(loRes.data) ? loRes.data[0] : loRes.data;
                if (loObj && loObj.id) {
                  map[apptId] = loObj.id;
                } else if (loRes.data && (Array.isArray(loRes.data) ? loRes.data.length > 0 : !!loRes.data.id)) {
                  map[apptId] = true;
                }
              }
            } catch (e) {
              // No lab order found
            }
          }
        })
      );
      setLabOrdersMap(map);
    } catch (err) {
      console.error('Failed to load appointments:', err);
      toast.error('Unable to load appointments.');
    } finally {
      setLoading(false);
    }
  }, [user.userId, doctorId, activeTab]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  /** Workflow Action Handlers */
  const handleApprove = async (id) => {
    setActionLoadingId(id);
    try {
      await appointmentApi.approve(id);
      const appt = appointments.find((a) => a.id === id);
      const patientName = appt ? `${appt.patientName || appt.patientFirstName || ''}`.trim() : '';
      toast.success(`Appointment #${id} approved successfully`);
      fetchAppointments();

      // Trigger Receptionist Notification & Dashboard Refresh
      const notif = {
        id: `notif-${Date.now()}`,
        title: 'Appointment Approved',
        message: `Appointment #${id} ${patientName ? `(${patientName})` : ''} has been APPROVED by Dr. ${user.name || 'Doctor'}.`,
        createdAt: new Date().toISOString(),
        read: false,
        role: 'RECEPTIONIST',
      };
      const existingNotifs = JSON.parse(localStorage.getItem('hms_local_notifications') || '[]');
      localStorage.setItem('hms_local_notifications', JSON.stringify([notif, ...existingNotifs]));

      window.dispatchEvent(new CustomEvent('hms_notification_trigger', { detail: notif }));
      window.dispatchEvent(new Event('hms_dashboard_refresh'));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve appointment');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id) => {
    setActionLoadingId(id);
    try {
      await appointmentApi.reject(id);
      const appt = appointments.find((a) => a.id === id);
      const patientName = appt ? `${appt.patientName || appt.patientFirstName || ''}`.trim() : '';
      toast.success(`Appointment #${id} rejected`);
      fetchAppointments();

      const notif = {
        id: `notif-${Date.now()}`,
        title: 'Appointment Rejected',
        message: `Appointment #${id} ${patientName ? `(${patientName})` : ''} has been REJECTED by Dr. ${user.name || 'Doctor'}.`,
        createdAt: new Date().toISOString(),
        read: false,
        role: 'RECEPTIONIST',
      };
      const existingNotifs = JSON.parse(localStorage.getItem('hms_local_notifications') || '[]');
      localStorage.setItem('hms_local_notifications', JSON.stringify([notif, ...existingNotifs]));

      window.dispatchEvent(new CustomEvent('hms_notification_trigger', { detail: notif }));
      window.dispatchEvent(new Event('hms_dashboard_refresh'));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject appointment');
    } finally {
      setActionLoadingId(null);
    }
  };


  const handleMarkConsultationCompleted = async (id) => {
    setActionLoadingId(id);
    try {
      await appointmentApi.consultationCompleted(id);
      toast.success(`Appointment #${id} marked as Consultation Completed`);
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update consultation status');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCompleteAppointment = async (id) => {
    setActionLoadingId(id);
    try {
      await appointmentApi.complete(id);
      toast.success(`Appointment #${id} marked as COMPLETED`);
      fetchAppointments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete appointment');
    } finally {
      setActionLoadingId(null);
    }
  };

  /* ── Table column definitions ────────────────────────── */
  const columns = [
    {
      header: 'ID',
      accessor: 'id',
      render: (row) => (
        <button
          onClick={() => setSelectedDetailsApptId(row.id ?? row.appointmentId)}
          className="font-mono text-xs font-semibold text-blue-600 hover:underline"
        >
          #{row.id ?? row.appointmentId ?? '—'}
        </button>
      ),
    },
    {
      header: 'Patient',
      render: (row) => (
        <div>
          <p className="font-bold text-slate-800 text-sm">{row.patientName || `Patient #${row.patientId ?? '—'}`}</p>
          {row.patientPhone && <p className="text-[11px] text-slate-400">{row.patientPhone}</p>}
        </div>
      ),
    },
    {
      header: 'Date & Time',
      render: (row) => {
        const raw = row.appointmentDate || row.date;
        if (!raw) return '—';
        return (
          <span className="text-xs text-slate-700 font-medium">
            {new Date(raw).toLocaleString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        );
      },
    },
    {
      header: 'Status',
      render: (row) => {
        const status = row.status || 'PENDING';
        return (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide shadow-2xs ${
              STATUS_STYLES[status] || 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {status.replace('_', ' ')}
          </span>
        );
      },
    },
    {
      header: 'Symptoms',
      render: (row) => (
        <span className="max-w-[160px] truncate text-xs text-slate-600 block" title={row.symptoms || row.reason}>
          {row.symptoms || row.reason || '—'}
        </span>
      ),
    },
    {
      header: 'Workflow Actions',
      render: (row) => {
        const apptId = row.id ?? row.appointmentId;
        const status = row.status || 'PENDING';
        const isProcessing = actionLoadingId === apptId;

        // PENDING -> Doctor can Approve or Reject
        if (status === 'PENDING') {
          return (
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => handleApprove(apptId)}
                disabled={isProcessing}
                className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Approve
              </button>
              <button
                onClick={() => handleReject(apptId)}
                disabled={isProcessing}
                className="inline-flex items-center gap-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 text-xs font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                <XCircle className="h-3.5 w-3.5" />
                Reject
              </button>
            </div>
          );
        }

        // APPROVED / SCHEDULED -> Record Consult / Order Lab Test / Consult Done
        if (status === 'APPROVED' || status === 'SCHEDULED') {
          return (
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setCreateConsultModalId(apptId)}
                className="inline-flex items-center gap-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-xs font-semibold shadow-xs transition-all"
              >
                <Stethoscope className="h-3.5 w-3.5" />
                Record Consult
              </button>
              <button
                onClick={() => setCreateLabOrderApptId(apptId)}
                className="inline-flex items-center gap-1 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 px-2.5 py-1.5 text-xs font-semibold transition-all"
              >
                <FlaskConical className="h-3.5 w-3.5" />
                Order Lab Test
              </button>
              <button
                disabled={isProcessing}
                onClick={() => handleMarkConsultationCompleted(apptId)}
                className="inline-flex items-center gap-1 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100 px-2.5 py-1.5 text-xs font-semibold transition-all disabled:opacity-50"
                title="Mark consultation completed"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Consult Done
              </button>
            </div>
          );
        }

        // CONSULTATION_DONE / CONSULTATION_COMPLETED -> Create Prescription + Create Lab Test / Lab Test Ordered badge
        if (status === 'CONSULTATION_DONE' || status === 'CONSULTATION_COMPLETED') {
          const hasLabOrder = !!labOrdersMap[apptId];
          return (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setViewConsultModalId(apptId)}
                className="inline-flex items-center gap-1 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 px-2.5 py-1.5 text-xs font-semibold transition-all"
                title="View Consultation Record"
              >
                <Eye className="h-3.5 w-3.5" />
                View Consult
              </button>
              <button
                onClick={() => setAddPrescriptionModalId(apptId)}
                className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-semibold shadow-xs transition-all cursor-pointer"
              >
                <Pill className="h-3.5 w-3.5" />
                Create Prescription
              </button>
              {!hasLabOrder ? (
                <button
                  onClick={() => setCreateLabOrderApptId(apptId)}
                  className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 text-xs font-semibold shadow-xs transition-all cursor-pointer"
                >
                  <FlaskConical className="h-3.5 w-3.5" />
                  Create Lab Test
                </button>
              ) : (
                <button
                  onClick={() => setReviewLabReportOrderId(typeof hasLabOrder === 'number' ? hasLabOrder : apptId)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 text-xs font-bold text-indigo-700 shadow-2xs transition-colors cursor-pointer"
                  title="View & Review Uploaded Diagnostic Lab Report"
                >
                  <FileCheck className="h-3.5 w-3.5 text-indigo-600" />
                  View / Review Lab Report
                </button>
              )}
              <button
                disabled={isProcessing}
                onClick={() => handleCompleteAppointment(apptId)}
                className="inline-flex items-center gap-1 rounded-xl bg-slate-800 hover:bg-slate-900 text-white px-2.5 py-1.5 text-xs font-semibold transition-all disabled:opacity-50"
                title="Mark Appointment Completed"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Complete
              </button>
            </div>
          );
        }

        // COMPLETED -> View Consult / View Prescription / Review Lab Report
        if (status === 'COMPLETED') {
          return (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewConsultModalId(apptId)}
                className="inline-flex items-center gap-1 text-xs text-purple-700 font-semibold hover:underline"
              >
                <Eye className="h-3.5 w-3.5" />
                Consultation
              </button>
              <button
                onClick={() => setViewPrescriptionModalId(apptId)}
                className="inline-flex items-center gap-1 text-xs text-emerald-700 font-semibold hover:underline"
              >
                <Pill className="h-3.5 w-3.5" />
                Prescription
              </button>
              <button
                onClick={() => setReviewLabReportOrderId(apptId)}
                className="inline-flex items-center gap-1 text-xs text-indigo-700 font-semibold hover:underline"
              >
                <FileCheck className="h-3.5 w-3.5" />
                Review Report
              </button>
            </div>
          );
        }

        // REJECTED / CANCELLED
        return (
          <span className="text-xs text-slate-400 font-medium italic">Actions locked</span>
        );
      },
    },
  ];

  const filterTabs = [
    { id: 'ALL', label: 'All Appointments' },
    { id: 'PENDING', label: 'Pending Approval' },
    { id: 'APPROVED', label: 'Approved' },
    { id: 'COMPLETED', label: 'Completed' },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Appointments & Patient Consultations</h1>
          <p className="mt-1 text-sm text-slate-500">
            OpenAPI 3.1 Lifecycle: Approve → Consult → Lab Order → Prescribe → Complete
          </p>
        </div>
        <button
          onClick={fetchAppointments}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:bg-blue-700"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Queue
        </button>
      </div>

      {/* ── Filter Tabs ──────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-1">
        <Filter className="h-4 w-4 text-slate-400 mr-2" />
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setCurrentPage(1);
            }}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Table or Empty State ──────────────────────────── */}
      {appointments.length === 0 && !loading ? (
        <EmptyState
          icon={CalendarCheck}
          title={`No ${activeTab !== 'ALL' ? activeTab.toLowerCase() : ''} appointments`}
          message="No appointment records found matching this status filter."
        />
      ) : (
        <DataTable
          columns={columns}
          data={appointments}
          loading={loading}
          emptyMessage="No appointments found"
          pageSize={10}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Appointment Full Details Modal (GET /api/appointments/{id}) */}
      <ViewAppointmentDetailsModal
        appointmentId={selectedDetailsApptId}
        isOpen={Boolean(selectedDetailsApptId)}
        onClose={() => setSelectedDetailsApptId(null)}
      />

      {/* Record Consultation Modal */}
      <CreateConsultationModal
        appointmentId={createConsultModalId}
        isOpen={Boolean(createConsultModalId)}
        onClose={() => setCreateConsultModalId(null)}
        onSuccess={fetchAppointments}
      />

      {/* View Consultation Modal */}
      <ViewConsultationModal
        appointmentId={viewConsultModalId}
        isOpen={Boolean(viewConsultModalId)}
        onClose={() => setViewConsultModalId(null)}
      />

      {/* Add Prescription Modal */}
      <AddPrescriptionModal
        appointmentId={addPrescriptionModalId}
        isOpen={Boolean(addPrescriptionModalId)}
        onClose={() => setAddPrescriptionModalId(null)}
        onSuccess={fetchAppointments}
      />

      {/* View Prescription Modal */}
      <ViewPrescriptionModal
        appointmentId={viewPrescriptionModalId}
        isOpen={Boolean(viewPrescriptionModalId)}
        onClose={() => setViewPrescriptionModalId(null)}
      />



      {/* Order Diagnostic Lab Test Modal (POST /api/lab-orders) */}
      <CreateLabOrderModal
        appointmentId={createLabOrderApptId}
        patientName={appointments.find((a) => (a.id || a.appointmentId) === createLabOrderApptId)?.patientName}
        doctorName={user.name ? (user.name.startsWith('Dr.') ? user.name : `Dr. ${user.name}`) : 'Doctor'}
        isOpen={Boolean(createLabOrderApptId)}
        onClose={() => setCreateLabOrderApptId(null)}
        onSuccess={() => {
          if (createLabOrderApptId) {
            setLabOrdersMap((prev) => ({ ...prev, [createLabOrderApptId]: true }));
          }
          fetchAppointments();
        }}
      />

      {/* Review Lab Report Modal (PUT /api/lab-reports/{id}/review) */}
      <ReviewLabReportModal
        labOrderId={reviewLabReportOrderId}
        isOpen={Boolean(reviewLabReportOrderId)}
        onClose={() => setReviewLabReportOrderId(null)}
        onSuccess={fetchAppointments}
      />
    </div>
  );
}
