/**
 * Patient Search Page (Admin)
 *
 * Implements GET /api/patients/search?query=...
 * Swagger Response Schema (UserResponse):
 *   { id, firstName, lastName, email, mobile, role, status, additionalDetails }
 */
import { useState, useEffect } from 'react';
import { Users, Eye, X, User } from 'lucide-react';
import toast from 'react-hot-toast';
import patientApi from '../../api/patientApi';
import DataTable from '../../components/common/DataTable';
import SearchBar from '../../components/common/SearchBar';

export default function PatientSearch() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPatient, setSelectedPatient] = useState(null);

  /** Load all registered patients on mount or search query */
  const fetchPatients = async (query = '') => {
    setLoading(true);
    try {
      const res = await patientApi.search(query.trim());
      setPatients(res.data || []);
      setCurrentPage(1);
    } catch (err) {
      toast.error('Failed to load patient records');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients('');
  }, []);

  /** Search handler */
  const handleSearch = (query) => {
    fetchPatients(query);
  };

  /** Table column definitions matching UserResponse */
  const columns = [
    { header: 'ID', accessor: 'id' },
    {
      header: 'Name',
      render: (row) => (
        <span className="font-bold text-slate-800">
          {row.firstName} {row.lastName}
        </span>
      ),
    },
    { header: 'Email', accessor: 'email' },
    { header: 'Mobile', accessor: 'mobile' },
    {
      header: 'Role',
      render: (row) => (
        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
          {row.role || 'PATIENT'}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (row) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
            row.status === 'ACTIVE'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          {row.status || 'ACTIVE'}
        </span>
      ),
    },
    {
      header: 'Actions',
      render: (row) => (
        <button
          onClick={() => setSelectedPatient(row)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100 transition-colors"
        >
          <Eye className="h-3.5 w-3.5" />
          View Details
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* ─── Page Header ─── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Users className="h-7 w-7 text-cyan-600" />
          Registered Patients Directory
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          View all registered hospital patients or search by name, email, or mobile number
        </p>
      </div>

      {/* ─── Search Bar ─── */}
      <SearchBar
        placeholder="Search by name, email, or mobile..."
        onSearch={handleSearch}
        className="max-w-lg"
      />

      {/* ─── Patients Table ─── */}
      <DataTable
        columns={columns}
        data={patients}
        loading={loading}
        emptyMessage="No registered patients found."
        pageSize={10}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />

      {/* ─── Patient Detail Card (100% UserResponse Field Mapping) ─── */}
      {selectedPatient && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-6 shadow-sm animate-fade-in space-y-4">
          <div className="flex items-center justify-between border-b border-blue-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {selectedPatient.firstName} {selectedPatient.lastName}
                </h3>
                <p className="text-xs text-slate-500">Patient ID: #{selectedPatient.id}</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedPatient(null)}
              className="rounded-full p-1 text-slate-400 hover:bg-blue-100 hover:text-slate-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs bg-white p-4 rounded-xl border border-blue-100">
            <div>
              <span className="text-slate-400 font-medium">Patient ID</span>
              <p className="font-bold text-slate-800 text-sm">#{selectedPatient.id}</p>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Full Name</span>
              <p className="font-bold text-slate-800 text-sm">
                {selectedPatient.firstName} {selectedPatient.lastName}
              </p>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Email Address</span>
              <p className="font-bold text-slate-800 text-sm">{selectedPatient.email}</p>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Mobile Number</span>
              <p className="font-bold text-slate-800 text-sm">{selectedPatient.mobile}</p>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Role</span>
              <p className="font-bold text-slate-800 text-sm">{selectedPatient.role || 'PATIENT'}</p>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Account Status</span>
              <p className="font-bold text-emerald-700 text-sm">{selectedPatient.status || 'ACTIVE'}</p>
            </div>
            {selectedPatient.additionalDetails && (
              <div className="col-span-2">
                <span className="text-slate-400 font-medium">Additional Details</span>
                <p className="font-bold text-slate-800 text-sm">{selectedPatient.additionalDetails}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
