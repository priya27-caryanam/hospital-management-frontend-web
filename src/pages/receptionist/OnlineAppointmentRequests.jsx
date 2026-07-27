/**
 * Dedicated Page: Online Appointment Requests
 * Used by Receptionist to review, approve, and reject online patient portal requests.
 * API Endpoints:
 *  - PUT /api/appointments/{id}/approve
 *  - PUT /api/appointments/{id}/reject
 *  - GET /api/appointments/doctor/{doctorId}
 */
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  ClipboardList, CheckCircle2, XCircle, Eye, Search, Filter, RefreshCw, Info, Receipt, X, CreditCard
} from 'lucide-react';
import departmentApi from '../../api/departmentApi';
import doctorApi from '../../api/doctorApi';
import appointmentApi from '../../api/appointmentApi';
import receptionistApi from '../../api/receptionistApi';
import DataTable from '../../components/common/DataTable';
import ViewAppointmentDetailsModal from '../../components/common/ViewAppointmentDetailsModal';

const STATUS_STYLES = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  APPROVED: 'bg-blue-100 text-blue-800 border-blue-200',
  CONSULTATION_DONE: 'bg-purple-100 text-purple-800 border-purple-200',
  CONSULTATION_COMPLETED: 'bg-purple-100 text-purple-800 border-purple-200',
  COMPLETED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  REJECTED: 'bg-rose-100 text-rose-800 border-rose-200',
};

export default function OnlineAppointmentRequests() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('PENDING'); // 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'ALL'
  const [searchText, setSearchText] = useState('');
  const [doctorsList, setDoctorsList] = useState([]);
  const [filterDocId, setFilterDocId] = useState('');
  const [selectedDetailApptId, setSelectedDetailApptId] = useState(null);

  // Billing Modal State
  const [paymentModalAppt, setPaymentModalAppt] = useState(null);
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [receiptResult, setReceiptResult] = useState(null);

  // Load doctors via available departments
  const fetchDoctorsList = async () => {
    try {
      const deptRes = await departmentApi.getAll();
      const depts = deptRes.data || [];
      const allDocs = [];
      for (const d of depts) {
        try {
          const docRes = await doctorApi.getByDepartment(d.id);
          if (Array.isArray(docRes.data)) {
            allDocs.push(...docRes.data);
          }
        } catch (e) {
          // ignore
        }
      }
      const docMap = new Map();
      allDocs.forEach((doc) => docMap.set(doc.id, doc));
      const uniqueDocs = Array.from(docMap.values());
      setDoctorsList(uniqueDocs);
      return uniqueDocs;
    } catch (err) {
      console.error('Failed to load doctors list:', err);
      return [];
    }
  };

  useEffect(() => {
    fetchDoctorsList();
  }, []);

  // Fetch appointments for all doctors or specific selected doctor
  useEffect(() => {
    fetchAppointments();
  }, [filterDocId]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      let docsToFetch = doctorsList;
      if (docsToFetch.length === 0) {
        docsToFetch = await fetchDoctorsList();
      }

      if (filterDocId) {
        const res = await appointmentApi.getByDoctor(filterDocId);
        setAppointments(res.data || []);
      } else {
        const allAppts = [];
        for (const doc of docsToFetch) {
          try {
            const res = await appointmentApi.getByDoctor(doc.id);
            if (Array.isArray(res.data)) {
              allAppts.push(...res.data);
            }
          } catch (e) {
            // ignore individual doctor errors
          }
        }
        // Deduplicate
        const uniqueMap = new Map();
        allAppts.forEach((app) => uniqueMap.set(app.id, app));
        setAppointments(Array.from(uniqueMap.values()));
      }
    } catch (err) {
      console.error('Failed to fetch appointment requests:', err);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setActionLoadingId(id);
    try {
      await appointmentApi.approve(id);
      toast.success(`Appointment #${id} approved successfully!`);
      fetchAppointments();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to approve appointment');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id) => {
    setActionLoadingId(id);
    try {
      await appointmentApi.reject(id);
      toast.success(`Appointment #${id} rejected.`);
      fetchAppointments();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to reject appointment');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleProcessConsultationPayment = async () => {
    if (!paymentModalAppt) return;
    const apptId = paymentModalAppt.id || paymentModalAppt.appointmentId;

    setProcessingPayment(true);
    try {
      const res = await receptionistApi.consultationPayment(apptId, paymentMode);
      toast.success('Consultation payment recorded successfully!');
      setPaymentModalAppt(null);

      try {
        const receiptRes = await receptionistApi.consultationReceipt(apptId);
        setReceiptResult(receiptRes.data || res.data);
      } catch (rErr) {
        setReceiptResult(res.data);
      }

      fetchAppointments();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const filteredAppointments = appointments.filter((a) => {
    if (statusFilter !== 'ALL' && a.status !== statusFilter) {
      return false;
    }
    if (searchText.trim()) {
      const q = searchText.toLowerCase().trim();
      const patientName = (a.patientName || '').toLowerCase();
      const doctorName = (a.doctorName || '').toLowerCase();
      const idStr = String(a.id || '');
      const symptoms = (a.symptoms || '').toLowerCase();
      return patientName.includes(q) || doctorName.includes(q) || idStr.includes(q) || symptoms.includes(q);
    }
    return true;
  });

  const pendingCount = appointments.filter((a) => a.status === 'PENDING').length;
  const approvedCount = appointments.filter((a) => a.status === 'APPROVED').length;
  const rejectedCount = appointments.filter((a) => a.status === 'REJECTED').length;
  const allCount = appointments.length;

  const columns = [
    {
      header: 'ID',
      accessor: 'id',
      render: (row) => (
        <button
          onClick={() => setSelectedDetailApptId(row.id)}
          className="font-mono text-xs font-bold text-blue-600 hover:underline"
        >
          #{row.id}
        </button>
      ),
    },
    {
      header: 'Patient Details',
      accessor: 'patientName',
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-800">{row.patientName || `Patient #${row.patientId}`}</p>
          <p className="text-xs text-slate-400">ID: #{row.patientId}</p>
        </div>
      ),
    },
    {
      header: 'Doctor / Department',
      accessor: 'doctorName',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-800">{row.doctorName ? `Dr. ${row.doctorName}` : `Doctor #${row.doctorId}`}</p>
          <p className="text-xs text-slate-400">{row.departmentName || `Dept #${row.departmentId}`}</p>
        </div>
      ),
    },
    {
      header: 'Date & Time',
      accessor: 'appointmentDate',
      render: (row) => (
        <span className="text-xs font-medium text-slate-700">
          {row.appointmentDate ? new Date(row.appointmentDate).toLocaleString('en-IN') : '—'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${STATUS_STYLES[row.status] || 'bg-slate-100 text-slate-700'}`}>
          {row.status}
        </span>
      ),
    },
    {
      header: 'Actions',
      render: (row) => {
        const apptId = row.id;
        const isPending = row.status === 'PENDING';
        const isConsulted =
          row.status === 'CONSULTATION_DONE' ||
          row.status === 'CONSULTATION_COMPLETED' ||
          row.status === 'COMPLETED';
        const isActioning = actionLoadingId === apptId;

        return (
          <div className="flex items-center gap-2">
            {isPending && (
              <>
                <button
                  onClick={() => handleApprove(apptId)}
                  disabled={isActioning}
                  className="flex items-center gap-1 rounded-lg bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 shadow-sm"
                  title="Approve Appointment Request"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Approve
                </button>
                <button
                  onClick={() => handleReject(apptId)}
                  disabled={isActioning}
                  className="flex items-center gap-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 shadow-sm"
                  title="Reject Appointment Request"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Reject
                </button>
              </>
            )}

            {isConsulted && (
              <button
                onClick={() => setPaymentModalAppt(row)}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-semibold transition-colors shadow-sm"
                title="Process Consultation Payment"
              >
                <Receipt className="h-3.5 w-3.5" />
                Process Billing
              </button>
            )}

            {!isPending && !isConsulted && (
              <span className="text-xs text-slate-400 font-medium italic">No action needed</span>
            )}

            <button
              onClick={() => setSelectedDetailApptId(apptId)}
              className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 transition-colors"
              title="View Request Details"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md shadow-purple-600/30">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Online Appointment Requests</h1>
            <p className="text-sm text-slate-500">Review and approve or reject online appointment requests from Patient Portal</p>
          </div>
        </div>
      </div>

      {/* Info Callout */}
      <div className="rounded-2xl border border-purple-100 bg-purple-50/60 p-4 text-xs text-purple-900 flex items-start gap-3 shadow-xs">
        <Info className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-sm text-purple-900">Online Requests Queue</p>
          <p className="text-slate-600 mt-0.5 leading-relaxed">
            Only online appointment requests submitted by patients via the portal requiring receptionist approval are managed here. Walk-in appointments are scheduled separately under <strong>Book Walk-in Appointment</strong>.
          </p>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="w-full sm:w-64">
            <select
              value={filterDocId}
              onChange={(e) => setFilterDocId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-purple-500 bg-slate-50/50"
            >
              <option value="">All Doctors</option>
              {doctorsList.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  Dr. {doc.firstName} {doc.lastName} ({doc.specialization || 'General'})
                </option>
              ))}
            </select>
          </div>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search request by patient, doctor, or ID..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-9 rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-purple-500"
            />
          </div>
        </div>

        <button
          onClick={fetchAppointments}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh List
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {[
          { id: 'PENDING', label: `Pending (${pendingCount})` },
          { id: 'APPROVED', label: `Approved (${approvedCount})` },
          { id: 'REJECTED', label: `Rejected (${rejectedCount})` },
          { id: 'COMPLETED', label: 'Completed' },
          { id: 'ALL', label: `All (${allCount})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id)}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all whitespace-nowrap border ${
              statusFilter === tab.id
                ? tab.id === 'PENDING'
                  ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-sm'
                  : 'bg-purple-50 text-purple-600 border-purple-300 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Requests Data Table */}
      <DataTable
        columns={columns}
        data={filteredAppointments}
        loading={loading}
        emptyMessage="No online appointment requests matched your current filters."
      />

      {/* Details Modal */}
      <ViewAppointmentDetailsModal
        appointmentId={selectedDetailApptId}
        isOpen={Boolean(selectedDetailApptId)}
        onClose={() => setSelectedDetailApptId(null)}
      />

      {/* Billing Modal */}
      {paymentModalAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Process Consultation Billing #{paymentModalAppt.id}
                </h3>
              </div>
              <button
                onClick={() => setPaymentModalAppt(null)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Patient:</span>
                <span className="font-bold text-slate-800">{paymentModalAppt.patientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Doctor:</span>
                <span className="font-bold text-slate-800">Dr. {paymentModalAppt.doctorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Department:</span>
                <span className="font-bold text-slate-800">{paymentModalAppt.departmentName}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Select Payment Mode *</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'CASH', label: '💵 Cash' },
                  { id: 'CARD', label: '💳 Card' },
                  { id: 'UPI', label: '📱 UPI' },
                  { id: 'NET_BANKING', label: '🏦 Net Banking' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setPaymentMode(mode.id)}
                    className={`rounded-xl border p-3 text-xs font-semibold transition-all ${paymentMode === mode.id ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPaymentModalAppt(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProcessConsultationPayment}
                disabled={processingPayment}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 text-xs font-semibold transition-colors disabled:opacity-50 shadow-sm flex items-center gap-1.5"
              >
                <CreditCard className="h-4 w-4" />
                {processingPayment ? 'Recording...' : 'Record Payment & Receipt'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
