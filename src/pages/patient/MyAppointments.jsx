/**
 * Patient MyAppointments Page
 * Displays historical list of appointments with 100% Swagger field mapping.
 * Includes View Details modal (GET /api/appointments/{id}) to view all 12 response fields.
 */
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Eye, Receipt, Stethoscope, Pill, X, AlertTriangle, BedDouble, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import appointmentApi from '../../api/appointmentApi';
import billingApi from '../../api/billingApi';
import admissionApi from '../../api/admissionApi';
import patientApi from '../../api/patientApi';
import DataTable from '../../components/common/DataTable';
import ViewConsultationModal from '../../components/doctor/ViewConsultationModal';
import ViewPrescriptionModal from '../../components/common/ViewPrescriptionModal';
import ViewAppointmentDetailsModal from '../../components/common/ViewAppointmentDetailsModal';

export default function MyAppointments() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [ipdAdmissions, setIpdAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedApptId, setSelectedApptId] = useState(null);
  const [consultModalId, setConsultModalId] = useState(null);
  const [prescriptionModalId, setPrescriptionModalId] = useState(null);
  const [billingModalData, setBillingModalData] = useState(null);

  const fetchAppointments = async () => {
    try {
      let pId = user?.userId;
      const pProfileRes = await patientApi.getById(user.userId).catch(() => null);
      if (pProfileRes?.data?.id) {
        pId = pProfileRes.data.id;
      }

      const [res, admissionRes] = await Promise.all([
        appointmentApi.getByPatient(user.userId).catch(() => ({ data: [] })),
        admissionApi.getAll().catch(() => ({ data: [] })),
      ]);

      const rawList = res.data || [];
      const apiAdmissions = Array.isArray(admissionRes?.data) ? admissionRes.data : [];
      const localAdmissions = JSON.parse(localStorage.getItem('hms_created_admissions') || '[]');

      const mergedMap = new Map();
      [...apiAdmissions, ...localAdmissions].forEach((item) => {
        if (item && item.id) {
          mergedMap.set(String(item.id), item);
        }
      });
      const allAdmissions = Array.from(mergedMap.values());

      const userName = user?.name ? user.name.toLowerCase() : '';
      const userFirstName = userName.split(' ')[0] || '';

      const myAdmissions = allAdmissions.filter(
        (a) =>
          (pId && String(a.patientId) === String(pId)) ||
          (user?.userId && String(a.patientId) === String(user.userId)) ||
          (a.patientEmail && user?.email && a.patientEmail.toLowerCase() === user.email.toLowerCase()) ||
          (a.patientName && userName && a.patientName.toLowerCase().includes(userName)) ||
          (a.patientName && userFirstName && a.patientName.toLowerCase().includes(userFirstName)) ||
          !a.patientId
      );
      setIpdAdmissions(myAdmissions.length > 0 ? myAdmissions : allAdmissions);

      const localEmergencies = JSON.parse(localStorage.getItem('hms_emergency_doctors') || '[]');
      const localCancelled = JSON.parse(localStorage.getItem('hms_cancelled_emergency_appts') || '[]');

      const updatedList = rawList.map((item) => {
        const id = item.id || item.appointmentId;
        const isDocInEmergency = localEmergencies.map((x) => String(x)).includes(String(item.doctorId));
        const isApptCancelled = localCancelled.map((x) => String(x)).includes(String(id));

        if (isDocInEmergency || isApptCancelled) {
          if (item.status === 'PENDING' || item.status === 'APPROVED' || item.status === 'CONSULTATION_PENDING') {
            return {
              ...item,
              status: 'REJECTED',
              emergencyCancelled: true,
            };
          }
        }
        return item;
      });

      setAppointments(updatedList);
    } catch (err) {
      toast.error('Failed to load your appointments logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();

    const handleRefresh = () => fetchAppointments();
    window.addEventListener('hms_notification_trigger', handleRefresh);
    window.addEventListener('hms_dashboard_refresh', handleRefresh);

    return () => {
      window.removeEventListener('hms_notification_trigger', handleRefresh);
      window.removeEventListener('hms_dashboard_refresh', handleRefresh);
    };
  }, [user]);

  const handleViewBill = async (appId) => {
    setBillingModalData(null);
    try {
      const res = await billingApi.consultationReceipt(appId);
      setBillingModalData(res.data);
    } catch (err) {
      console.error(err);
      toast.error('No receipt generated for this appointment slot yet.');
    }
  };

  const statusColors = {
    PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
    APPROVED: 'bg-blue-100 text-blue-800 border-blue-200',
    CONSULTATION_COMPLETED: 'bg-purple-100 text-purple-800 border-purple-200',
    COMPLETED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    REJECTED: 'bg-rose-100 text-rose-800 border-rose-200',
    CANCELLED: 'bg-rose-100 text-rose-800 border-rose-200',
  };

  const columns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Physician / Doctor', accessor: 'doctorName' },
    { header: 'Department', accessor: 'departmentName' },
    {
      header: 'Scheduled Date',
      render: (row) => new Date(row.appointmentDate).toLocaleString('en-IN'),
    },
    {
      header: 'Status',
      render: (row) => (
        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase ${statusColors[row.status] || 'bg-slate-100 text-slate-700'}`}>
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {row.emergencyCancelled ? 'REJECTED (EMERGENCY)' : (row.status || 'PENDING').replace('_', ' ')}
        </span>
      ),
    },
    {
      header: 'Symptoms',
      render: (row) => (
        <span className="max-w-[150px] truncate text-xs text-slate-600 block" title={row.symptoms || row.reason}>
          {row.symptoms || row.reason || '—'}
        </span>
      ),
    },
    {
      header: 'Actions',
      render: (row) => {
        const isConsultationReady = row.status === 'CONSULTATION_COMPLETED' || row.status === 'COMPLETED';
        const isCompleted = row.status === 'COMPLETED';

        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedApptId(row.id)}
              className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-blue-600 font-semibold transition-colors"
            >
              <Eye className="h-3.5 w-3.5" />
              Details
            </button>

            {isConsultationReady && (
              <button
                onClick={() => setConsultModalId(row.id)}
                className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 font-semibold transition-colors"
              >
                <Stethoscope className="h-3.5 w-3.5" />
                Consultation
              </button>
            )}

            {isCompleted && (
              <button
                onClick={() => setPrescriptionModalId(row.id)}
                className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-800 font-semibold transition-colors"
              >
                <Pill className="h-3.5 w-3.5" />
                Prescription
              </button>
            )}

            <button
              onClick={() => handleViewBill(row.id)}
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold transition-colors"
            >
              <Receipt className="h-3.5 w-3.5" />
              Receipt
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Appointments</h1>
        <p className="text-sm text-slate-500">Track appointment status, clinical consultations, prescriptions, and receipts</p>
      </div>

      {/* 🏥 IPD ADMISSION BANNER FOR PATIENT */}
      {ipdAdmissions.length > 0 && (
        <div className="rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 p-5 text-white shadow-md animate-fade-in space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/20 border border-purple-400/30 text-purple-200 shrink-0">
                <BedDouble className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-purple-500/30 border border-purple-400/40 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-200">
                    🏥 IPD Admission Advised
                  </span>
                  <span className="text-xs font-bold text-emerald-400">
                    Status: {ipdAdmissions[0].admissionStatus?.replace('_', ' ')}
                  </span>
                </div>
                <h3 className="text-lg font-bold mt-0.5">
                  Hospital Inpatient Admission File #{ipdAdmissions[0].id}
                </h3>
                <p className="text-xs text-purple-200 mt-0.5">
                  {ipdAdmissions[0].doctorName ? `Attending Doctor: Dr. ${ipdAdmissions[0].doctorName}` : 'Doctor Advised IPD Admission'}
                  {ipdAdmissions[0].wardName && ` | Ward: ${ipdAdmissions[0].wardName}`}
                  {ipdAdmissions[0].roomNumber && ` (Rm ${ipdAdmissions[0].roomNumber}, Bed ${ipdAdmissions[0].bedNumber})`}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/patient/admissions')}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white px-4 py-2.5 text-xs font-bold shadow-md transition-all shrink-0 cursor-pointer"
            >
              <BedDouble className="h-4 w-4" />
              View IPD Admission Details
            </button>
          </div>
        </div>
      )}

      {appointments.some((a) => a.emergencyCancelled) && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-rose-900 shadow-sm flex items-start gap-3 animate-fade-in">
          <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-rose-900">🚨 Emergency Appointment Rejection Notice</h3>
            <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">
              One or more of your consultation bookings were <strong>REJECTED</strong> due to a Doctor Emergency. Please check your notifications bell for full rejection prompt details and reschedule.
            </p>
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={appointments}
        loading={loading}
        emptyMessage="You have no appointments on file."
      />

      {/* Appointment Full Details Modal (GET /api/appointments/{id}) */}
      <ViewAppointmentDetailsModal
        appointmentId={selectedApptId}
        isOpen={Boolean(selectedApptId)}
        onClose={() => setSelectedApptId(null)}
      />

      {/* Consultation View Modal */}
      <ViewConsultationModal
        appointmentId={consultModalId}
        isOpen={Boolean(consultModalId)}
        onClose={() => setConsultModalId(null)}
      />

      {/* Prescription View Modal */}
      <ViewPrescriptionModal
        appointmentId={prescriptionModalId}
        isOpen={Boolean(prescriptionModalId)}
        onClose={() => setPrescriptionModalId(null)}
      />

      {/* Consultation Receipt View Modal */}
      {billingModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl transition-all border border-slate-100 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">Consultation Payment Receipt</h3>
              <button
                onClick={() => setBillingModalData(null)}
                className="rounded-xl p-1 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-slate-400 font-medium text-xs">Receipt Number</p>
                  <p className="font-bold text-slate-800">{billingModalData.receiptNumber || '—'}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium text-xs">Transaction ID</p>
                  <p className="font-bold text-slate-800">{billingModalData.transactionId || '—'}</p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold text-xs">Amount</span>
                  <span className="text-lg font-bold text-emerald-600">₹{billingModalData.amount != null ? Number(billingModalData.amount).toLocaleString('en-IN') : '—'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold text-xs">Payment Mode</span>
                  <span className="font-bold text-slate-800 text-xs">{billingModalData.paymentMode}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold text-xs">Payment Type</span>
                  <span className="font-bold text-slate-800 text-xs">{billingModalData.paymentType || 'CONSULTATION'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold text-xs">Status</span>
                  <span className="font-bold text-emerald-600 text-xs">{billingModalData.paymentStatus}</span>
                </div>
                <div className="pt-2 border-t border-slate-200/50">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Payment Date</p>
                  <p className="text-xs font-bold text-slate-700">{new Date(billingModalData.paymentDate).toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
