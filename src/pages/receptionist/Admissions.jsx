/**
 * Receptionist IPD Patient Admissions Page
 * Main workspace for managing patient admissions, bed allocation, admitting, and discharging patients
 */
import { useState, useEffect } from 'react';
import {
  BedDouble,
  UserPlus,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  LogOut,
  Clock,
  Building2,
  BadgeCheck,
  AlertCircle,
  Stethoscope,
} from 'lucide-react';
import toast from 'react-hot-toast';
import admissionApi from '../../api/admissionApi';
import DataTable from '../../components/common/DataTable';
import SearchBar from '../../components/common/SearchBar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import AdmissionRequestModal from '../../components/admission/AdmissionRequestModal';
import AssignBedModal from '../../components/admission/AssignBedModal';
import AdmissionDetailsModal from '../../components/admission/AdmissionDetailsModal';

export default function ReceptionistAdmissions() {
  const [admissions, setAdmissions] = useState([]);
  const [filteredAdmissions, setFilteredAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isDischargeConfirmOpen, setIsDischargeConfirmOpen] = useState(false);

  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [selectedAdmissionId, setSelectedAdmissionId] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    fetchAdmissions();

    // Listen for dashboard refresh events
    const handleRefresh = () => fetchAdmissions();
    window.addEventListener('hms_dashboard_refresh', handleRefresh);
    return () => window.removeEventListener('hms_dashboard_refresh', handleRefresh);
  }, []);

  const fetchAdmissions = async () => {
    setLoading(true);
    try {
      const res = await admissionApi.getAll();
      setAdmissions(res.data || []);
    } catch (err) {
      console.error('Failed to fetch admissions:', err);
      toast.error('Failed to load patient admissions');
    } finally {
      setLoading(false);
    }
  };

  // Filter & Search effect
  useEffect(() => {
    let result = [...admissions];

    if (statusFilter !== 'ALL') {
      result = result.filter((a) => a.admissionStatus === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (a) =>
          String(a.id).includes(query) ||
          a.patientName?.toLowerCase().includes(query) ||
          a.patientMobile?.includes(query) ||
          a.doctorName?.toLowerCase().includes(query) ||
          a.wardName?.toLowerCase().includes(query) ||
          a.roomNumber?.toLowerCase().includes(query)
      );
    }

    setFilteredAdmissions(result);
  }, [searchQuery, statusFilter, admissions]);

  const handleAdmit = async (id) => {
    setActionLoadingId(id);
    try {
      await admissionApi.admit(id);
      toast.success(`Patient admission #${id} status updated to ADMITTED!`);
      window.dispatchEvent(new Event('hms_dashboard_refresh'));
      fetchAdmissions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to admit patient');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDischargeConfirm = async () => {
    if (!selectedAdmissionId) return;
    setActionLoadingId(selectedAdmissionId);
    try {
      await admissionApi.discharge(selectedAdmissionId);
      toast.success(`Patient discharged successfully. Assigned bed is now AVAILABLE!`);
      window.dispatchEvent(new Event('hms_dashboard_refresh'));
      fetchAdmissions();
      setIsDischargeConfirmOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to discharge patient');
    } finally {
      setActionLoadingId(null);
      setSelectedAdmissionId(null);
    }
  };

  const STATUS_BADGES = {
    REQUESTED: 'bg-amber-100 text-amber-800 border-amber-200',
    BED_ASSIGNED: 'bg-purple-100 text-purple-800 border-purple-200',
    ADMITTED: 'bg-blue-100 text-blue-800 border-blue-200',
    DISCHARGED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  };

  const columns = [
    {
      header: 'ID',
      accessor: 'id',
      render: (row) => <span className="font-mono font-bold text-blue-600">#{row.id}</span>,
    },
    {
      header: 'Patient Info',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-800 block">
            {row.patientName || `Patient #${row.patientId}`}
          </span>
          <span className="text-[11px] text-slate-400 font-medium">{row.patientMobile || '—'}</span>
        </div>
      ),
    },
    {
      header: 'Attending Doctor',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-700 block">
            {row.doctorName ? `Dr. ${row.doctorName}` : 'Unassigned'}
          </span>
          <span className="text-[11px] text-slate-400">{row.doctorSpecialization || '—'}</span>
        </div>
      ),
    },
    {
      header: 'Ward / Room / Bed',
      render: (row) => (
        <div>
          {row.wardName ? (
            <span className="font-semibold text-purple-700 block">
              {row.wardName} (Rm: {row.roomNumber || '—'}, Bed: {row.bedNumber || '—'})
            </span>
          ) : (
            <span className="text-slate-400 italic">No Bed Allocated</span>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      render: (row) => (
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase ${
            STATUS_BADGES[row.admissionStatus] || 'bg-slate-100 text-slate-700'
          }`}
        >
          {row.admissionStatus}
        </span>
      ),
    },
    {
      header: 'Admission Date',
      render: (row) => (
        <span className="text-xs text-slate-600 font-medium">
          {row.admissionDate ? new Date(row.admissionDate).toLocaleDateString('en-IN') : '—'}
        </span>
      ),
    },
    {
      header: 'Actions',
      render: (row) => {
        const isActioning = actionLoadingId === row.id;

        return (
          <div className="flex items-center gap-2">
            {/* View Details */}
            <button
              onClick={() => {
                setSelectedAdmissionId(row.id);
                setIsDetailsModalOpen(true);
              }}
              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              title="View Admission File"
            >
              <Eye className="h-4 w-4" />
            </button>

            {/* Assign Bed (Available if REQUESTED or BED_ASSIGNED) */}
            {row.admissionStatus !== 'DISCHARGED' && (
              <button
                onClick={() => {
                  setSelectedAdmission(row);
                  setIsAssignModalOpen(true);
                }}
                className="flex items-center gap-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 px-2.5 py-1 text-xs font-semibold transition-colors"
              >
                <BedDouble className="h-3.5 w-3.5" />
                {row.bedId ? 'Reassign Bed' : 'Assign Bed'}
              </button>
            )}

            {/* Admit Patient (Available if BED_ASSIGNED or REQUESTED, but not DISCHARGED or ADMITTED) */}
            {row.admissionStatus === 'BED_ASSIGNED' && (
              <button
                onClick={() => handleAdmit(row.id)}
                disabled={isActioning}
                className="flex items-center gap-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Admit
              </button>
            )}

            {/* Discharge Patient (Available if ADMITTED or BED_ASSIGNED) */}
            {(row.admissionStatus === 'ADMITTED' || row.admissionStatus === 'BED_ASSIGNED') && (
              <button
                onClick={() => {
                  setSelectedAdmissionId(row.id);
                  setIsDischargeConfirmOpen(true);
                }}
                disabled={isActioning}
                className="flex items-center gap-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                <LogOut className="h-3.5 w-3.5" />
                Discharge
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Patient Admissions (IPD)</h1>
          <p className="mt-1 text-sm text-slate-500">
            In-Patient Department desk for requesting admissions, assigning beds, admitting, and discharging patients
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedAdmission(null);
            setIsRequestModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 text-xs font-bold shadow-sm transition-colors self-start sm:self-auto"
        >
          <UserPlus className="h-4 w-4" />
          + New Admission Request
        </button>
      </div>

      {/* Filters & Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 rounded-2xl bg-white p-4 border border-slate-200 shadow-xs">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-1.5 rounded-xl bg-slate-100 p-1">
          {['ALL', 'REQUESTED', 'BED_ASSIGNED', 'ADMITTED', 'DISCHARGED'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                statusFilter === status
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="max-w-xs w-full">
          <SearchBar
            placeholder="Search patient, doctor, ward, or ID..."
            onSearch={setSearchQuery}
            className="w-full"
          />
        </div>
      </div>

      {/* Main Data Table */}
      <DataTable
        columns={columns}
        data={filteredAdmissions}
        loading={loading}
        emptyMessage="No patient admission records found."
        pageSize={10}
      />

      {/* Reusable Modals */}
      <AdmissionRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSuccess={fetchAdmissions}
      />

      <AssignBedModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        admission={selectedAdmission}
        onSuccess={fetchAdmissions}
      />

      <AdmissionDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        admissionId={selectedAdmissionId}
      />

      <ConfirmDialog
        isOpen={isDischargeConfirmOpen}
        title="Discharge Patient Confirmation"
        message="Are you sure you want to discharge this patient? The assigned Bed will automatically revert to AVAILABLE status."
        confirmText="Confirm Discharge"
        confirmVariant="danger"
        onConfirm={handleDischargeConfirm}
        onCancel={() => setIsDischargeConfirmOpen(false)}
      />
    </div>
  );
}
