/**
 * Admin Appointments Page
 * Search and manage appointments by Patient ID or Doctor ID
 * Implements 100% Swagger field mapping and status updates:
 *   - PUT /api/appointments/{id}/status?status=...
 *   - GET /api/appointments/{id}
 */
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Calendar, Search, CheckCircle2, XCircle, CheckCheck, Eye, Edit, X } from 'lucide-react';
import appointmentApi from '../../api/appointmentApi';
import DataTable from '../../components/common/DataTable';
import ViewAppointmentDetailsModal from '../../components/common/ViewAppointmentDetailsModal';

const STATUS_STYLES = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  APPROVED: 'bg-blue-100 text-blue-800 border-blue-200',
  CONSULTATION_COMPLETED: 'bg-purple-100 text-purple-800 border-purple-200',
  CONSULTATION_DONE: 'bg-purple-100 text-purple-800 border-purple-200',
  COMPLETED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  REJECTED: 'bg-rose-100 text-rose-800 border-rose-200',
};

const ALLOWED_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'CONSULTATION_DONE'];

export default function Appointments() {
  const [searchType, setSearchType] = useState('patient'); // 'patient' or 'doctor'
  const [searchId, setSearchId] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Detail Modal State
  const [selectedApptId, setSelectedApptId] = useState(null);

  // Status Change Modal State
  const [statusModalAppt, setStatusModalAppt] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('PENDING');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchId.trim()) {
      toast.error('Please enter an ID');
      return;
    }

    setLoading(true);
    try {
      let res;
      if (searchType === 'patient') {
        res = await appointmentApi.getByPatient(searchId);
      } else {
        res = await appointmentApi.getByDoctor(searchId);
      }
      setAppointments(res.data || []);
      setCurrentPage(1);
      toast.success('Appointments loaded');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to fetch appointments');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    setActionLoadingId(id);
    try {
      await appointmentApi.approve(id);
      toast.success(`Appointment #${id} approved`);
      setAppointments((prev) =>
        prev.map((a) => ((a.id || a.appointmentId) === id ? { ...a, status: 'APPROVED' } : a))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id) => {
    setActionLoadingId(id);
    try {
      await appointmentApi.reject(id);
      toast.success(`Appointment #${id} rejected`);
      setAppointments((prev) =>
        prev.map((a) => ((a.id || a.appointmentId) === id ? { ...a, status: 'REJECTED' } : a))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleComplete = async (id) => {
    setActionLoadingId(id);
    try {
      await appointmentApi.complete(id);
      toast.success(`Appointment #${id} completed`);
      setAppointments((prev) =>
        prev.map((a) => ((a.id || a.appointmentId) === id ? { ...a, status: 'COMPLETED' } : a))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete');
    } finally {
      setActionLoadingId(null);
    }
  };

  /** PUT /api/appointments/{id}/status?status={status} */
  const handleUpdateCustomStatus = async (e) => {
    e.preventDefault();
    if (!statusModalAppt) return;

    setUpdatingStatus(true);
    try {
      await appointmentApi.updateStatus(statusModalAppt.id, selectedStatus);
      toast.success(`Appointment #${statusModalAppt.id} status updated to ${selectedStatus}`);
      setAppointments((prev) =>
        prev.map((a) => ((a.id || a.appointmentId) === statusModalAppt.id ? { ...a, status: selectedStatus } : a))
      );
      setStatusModalAppt(null);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const columns = [
    {
      header: 'ID',
      accessor: 'id',
      render: (row) => (
        <button
          onClick={() => setSelectedApptId(row.id || row.appointmentId)}
          className="font-mono text-xs font-semibold text-blue-600 hover:underline"
        >
          #{row.id || row.appointmentId}
        </button>
      ),
    },
    { header: 'Patient Name', accessor: 'patientName' },
    { header: 'Doctor Name', accessor: 'doctorName' },
    { header: 'Department', accessor: 'departmentName' },
    {
      header: 'Date & Time',
      render: (row) => new Date(row.appointmentDate).toLocaleString('en-IN'),
    },
    {
      header: 'Status',
      render: (row) => (
        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase ${STATUS_STYLES[row.status] || 'bg-slate-100 text-slate-700'}`}>
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {(row.status || 'PENDING').replace('_', ' ')}
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
      header: 'Workflow Actions',
      render: (row) => {
        const id = row.id || row.appointmentId;
        const status = row.status || 'PENDING';
        const isProcessing = actionLoadingId === id;

        return (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSelectedApptId(id)}
              title="View Details"
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors"
            >
              <Eye className="h-4 w-4" />
            </button>

            <button
              onClick={() => {
                setStatusModalAppt(row);
                setSelectedStatus(row.status || 'PENDING');
              }}
              title="Update Status"
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-amber-600 transition-colors"
            >
              <Edit className="h-4 w-4" />
            </button>

            {status === 'PENDING' && (
              <>
                <button
                  disabled={isProcessing}
                  onClick={() => handleApprove(id)}
                  className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Approve
                </button>
                <button
                  disabled={isProcessing}
                  onClick={() => handleReject(id)}
                  className="inline-flex items-center gap-1 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 px-2.5 py-1 text-xs font-semibold transition-all disabled:opacity-50"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Reject
                </button>
              </>
            )}

            {(status === 'APPROVED' || status === 'CONSULTATION_COMPLETED' || status === 'CONSULTATION_DONE') && (
              <button
                disabled={isProcessing}
                onClick={() => handleComplete(id)}
                className="inline-flex items-center gap-1 rounded-xl bg-slate-800 hover:bg-slate-900 text-white px-3 py-1 text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Complete
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Appointments</h1>
          <p className="text-sm text-slate-500">Monitor and advance patient appointment lifecycles</p>
        </div>
      </div>

      {/* Search Bar Panel */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <form onSubmit={handleSearch} className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1 space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Search By</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="searchType"
                  value="patient"
                  checked={searchType === 'patient'}
                  onChange={() => setSearchType('patient')}
                  className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                Patient ID
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="searchType"
                  value="doctor"
                  checked={searchType === 'doctor'}
                  onChange={() => setSearchType('doctor')}
                  className="h-4 w-4 border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                Doctor ID
              </label>
            </div>
          </div>

          <div className="flex-[2] space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Enter ID</label>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={searchType === 'patient' ? "Enter Patient ID (e.g. 1)" : "Enter Doctor ID (e.g. 1)"}
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 transition-colors disabled:opacity-50 shadow-md shadow-blue-500/20 text-sm"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {/* Results Table */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          Appointment Records ({appointments.length})
        </h2>
        <DataTable
          columns={columns}
          data={appointments}
          loading={loading}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          emptyMessage="No appointments found for this ID. Try another search query."
        />
      </div>

      {/* Appointment Full Details Modal (GET /api/appointments/{id}) */}
      <ViewAppointmentDetailsModal
        appointmentId={selectedApptId}
        isOpen={Boolean(selectedApptId)}
        onClose={() => setSelectedApptId(null)}
      />

      {/* Status Update Modal (PUT /api/appointments/{id}/status?status=...) */}
      {statusModalAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-5 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Update Appointment Status #{statusModalAppt.id}
              </h3>
              <button
                onClick={() => setStatusModalAppt(null)}
                className="rounded-full p-1 hover:bg-slate-100 text-slate-500 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateCustomStatus} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Select Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  {ALLOWED_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStatusModalAppt(null)}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingStatus}
                  className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 transition-colors disabled:opacity-50"
                >
                  {updatingStatus ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
