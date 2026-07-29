/**
 * Patient MyAppointments Page
 * Displays historical list of appointments with 100% Swagger field mapping.
 * Includes View Details modal (GET /api/appointments/{id}) to view all 12 response fields.
 */
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Eye, Receipt, Stethoscope, Pill, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import appointmentApi from '../../api/appointmentApi';
import billingApi from '../../api/billingApi';
import DataTable from '../../components/common/DataTable';
import ViewConsultationModal from '../../components/doctor/ViewConsultationModal';
import ViewPrescriptionModal from '../../components/common/ViewPrescriptionModal';
import ViewAppointmentDetailsModal from '../../components/common/ViewAppointmentDetailsModal';

export default function MyAppointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedApptId, setSelectedApptId] = useState(null);
  const [consultModalId, setConsultModalId] = useState(null);
  const [prescriptionModalId, setPrescriptionModalId] = useState(null);
  const [billingModalData, setBillingModalData] = useState(null);

  const fetchAppointments = async () => {
    try {
      const res = await appointmentApi.getByPatient(user.userId);
      const rawList = res.data || [];

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
