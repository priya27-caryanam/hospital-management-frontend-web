/**
 * Doctor IPD Patient Admissions Page
 * Allows doctors to view in-patient department admissions assigned to them or under their care
 */
import { useState, useEffect } from 'react';
import { Eye, Stethoscope, BedDouble } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import admissionApi from '../../api/admissionApi';
import DataTable from '../../components/common/DataTable';
import SearchBar from '../../components/common/SearchBar';
import AdmissionDetailsModal from '../../components/admission/AdmissionDetailsModal';

export default function DoctorAdmissions() {
  const { user } = useAuth();
  const [admissions, setAdmissions] = useState([]);
  const [filteredAdmissions, setFilteredAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [selectedAdmissionId, setSelectedAdmissionId] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  useEffect(() => {
    fetchAdmissions();
  }, [user]);

  const fetchAdmissions = async () => {
    setLoading(true);
    try {
      const res = await admissionApi.getAll();
      let list = res.data || [];
      if (list.length > 0) {
        const existingLocal = JSON.parse(localStorage.getItem('hms_created_admissions') || '[]');
        const mergedMap = new Map();
        [...list, ...existingLocal].forEach((item) => {
          if (item && item.id) mergedMap.set(String(item.id), item);
        });
        localStorage.setItem('hms_created_admissions', JSON.stringify(Array.from(mergedMap.values())));
      }
      setAdmissions(list);
    } catch (err) {
      console.error('Failed to fetch admissions for doctor:', err);
      toast.error('Failed to load IPD patient admissions');
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
    { header: 'Patient Name', render: (row) => <span className="font-bold text-slate-800">{row.patientName || `Patient #${row.patientId}`}</span> },
    { header: 'Attending Doctor', render: (row) => <span className="font-semibold text-slate-700">{row.doctorName ? `Dr. ${row.doctorName}` : 'Unassigned'}</span> },
    { header: 'Ward & Bed', render: (row) => <span className="font-semibold text-purple-700">{row.wardName ? `${row.wardName} (Rm: ${row.roomNumber}, Bed: ${row.bedNumber})` : 'No Bed'}</span> },
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
        <button
          onClick={() => {
            setSelectedAdmissionId(row.id);
            setIsDetailsModalOpen(true);
          }}
          className="flex items-center gap-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1 text-xs font-semibold transition-colors"
        >
          <Eye className="h-3.5 w-3.5" /> View Patient File
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">IPD Admissions & In-Patients</h1>
        <p className="mt-1 text-sm text-slate-500">Monitor in-patient ward allocations, medical notes, and admission history</p>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 rounded-2xl bg-white p-4 border border-slate-200 shadow-xs">
        <div className="flex flex-wrap gap-1.5 rounded-xl bg-slate-100 p-1">
          {['ALL', 'ADMITTED', 'BED_ASSIGNED', 'REQUESTED', 'DISCHARGED'].map((st) => (
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
          <SearchBar placeholder="Search IPD patients..." onSearch={setSearchQuery} className="w-full" />
        </div>
      </div>

      <DataTable columns={columns} data={filteredAdmissions} loading={loading} emptyMessage="No IPD admission records found." />

      <AdmissionDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        admissionId={selectedAdmissionId}
      />
    </div>
  );
}
