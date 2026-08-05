/**
 * Admin IPD Patient Admissions Page
 * Oversight dashboard for administrators to view, monitor, and manage IPD patient admissions
 */
import { useState, useEffect } from 'react';
import { BedDouble, Search, Eye, Building2, UserPlus, LogOut, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import admissionApi from '../../api/admissionApi';
import DataTable from '../../components/common/DataTable';
import SearchBar from '../../components/common/SearchBar';
import AdmissionDetailsModal from '../../components/admission/AdmissionDetailsModal';
import AssignBedModal from '../../components/admission/AssignBedModal';
import AdmissionRequestModal from '../../components/admission/AdmissionRequestModal';

export default function AdminAdmissions() {
  const [admissions, setAdmissions] = useState([]);
  const [filteredAdmissions, setFilteredAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [selectedAdmissionId, setSelectedAdmissionId] = useState(null);
  const [selectedAdmission, setSelectedAdmission] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  useEffect(() => {
    fetchAdmissions();
  }, []);

  const fetchAdmissions = async () => {
    setLoading(true);
    try {
      const res = await admissionApi.getAll();
      setAdmissions(res.data || []);
    } catch (err) {
      console.error('Failed to fetch admissions for admin:', err);
      toast.error('Failed to load admissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let result = [...admissions];
    if (statusFilter !== 'ALL') {
      result = result.filter((a) => a.admissionStatus === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (a) =>
          String(a.id).includes(q) ||
          a.patientName?.toLowerCase().includes(q) ||
          a.doctorName?.toLowerCase().includes(q) ||
          a.wardName?.toLowerCase().includes(q)
      );
    }
    setFilteredAdmissions(result);
  }, [searchQuery, statusFilter, admissions]);

  const STATUS_BADGES = {
    REQUESTED: 'bg-amber-100 text-amber-800 border-amber-200',
    BED_ASSIGNED: 'bg-purple-100 text-purple-800 border-purple-200',
    ADMITTED: 'bg-blue-100 text-blue-800 border-blue-200',
    DISCHARGED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  };

  const columns = [
    { header: 'ID', render: (row) => <span className="font-mono font-bold text-blue-600">#{row.id}</span> },
    { header: 'Patient', render: (row) => <span className="font-bold text-slate-800">{row.patientName || `Patient #${row.patientId}`}</span> },
    { header: 'Attending Doctor', render: (row) => <span className="font-semibold text-slate-700">{row.doctorName ? `Dr. ${row.doctorName}` : 'Unassigned'}</span> },
    { header: 'Ward / Room / Bed', render: (row) => <span className="font-semibold text-purple-700">{row.wardName ? `${row.wardName} (Rm: ${row.roomNumber}, Bed: ${row.bedNumber})` : 'Unassigned'}</span> },
    {
      header: 'Status',
      render: (row) => (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase ${STATUS_BADGES[row.admissionStatus] || 'bg-slate-100 text-slate-700'}`}>
          {row.admissionStatus}
        </span>
      ),
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedAdmissionId(row.id);
              setIsDetailsModalOpen(true);
            }}
            className="flex items-center gap-1 text-xs text-blue-600 font-semibold hover:underline"
          >
            <Eye className="h-3.5 w-3.5" /> View
          </button>
          {row.admissionStatus !== 'DISCHARGED' && (
            <button
              onClick={() => {
                setSelectedAdmission(row);
                setIsAssignModalOpen(true);
              }}
              className="flex items-center gap-1 text-xs text-purple-600 font-semibold hover:underline"
            >
              <BedDouble className="h-3.5 w-3.5" /> Assign Bed
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hospital IPD Admissions</h1>
          <p className="mt-1 text-sm text-slate-500">Administrative overview of all in-patient admissions and bed allocations</p>
        </div>

        <button
          onClick={() => setIsRequestModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 text-xs font-bold shadow-sm transition-colors self-start sm:self-auto"
        >
          <UserPlus className="h-4 w-4" />
          + Create Admission Request
        </button>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 rounded-2xl bg-white p-4 border border-slate-200 shadow-xs">
        <div className="flex flex-wrap gap-1.5 rounded-xl bg-slate-100 p-1">
          {['ALL', 'REQUESTED', 'BED_ASSIGNED', 'ADMITTED', 'DISCHARGED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                statusFilter === st ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>

        <div className="max-w-xs w-full">
          <SearchBar placeholder="Search admissions..." onSearch={setSearchQuery} className="w-full" />
        </div>
      </div>

      <DataTable columns={columns} data={filteredAdmissions} loading={loading} emptyMessage="No admission records found." />

      <AdmissionDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        admissionId={selectedAdmissionId}
      />

      <AssignBedModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        admission={selectedAdmission}
        onSuccess={fetchAdmissions}
      />

      <AdmissionRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSuccess={fetchAdmissions}
      />
    </div>
  );
}
