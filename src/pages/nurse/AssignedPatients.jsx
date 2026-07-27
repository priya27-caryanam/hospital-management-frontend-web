/**
 * Nurse Assigned Patients Page
 * Displays a list of patients assigned to the logged-in nurse's department or profile.
 */
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Users, Search, Phone, Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import nurseApi from '../../api/nurseApi';
import DataTable from '../../components/common/DataTable';

export default function AssignedPatients() {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);

  useEffect(() => {
    const fetchAssignedPatients = async () => {
      try {
        const res = await nurseApi.getAssignedPatients(user.userId);
        setPatients(res.data || []);
        setFilteredPatients(res.data || []);
      } catch (err) {
        console.warn('GET /api/nurses/{id}/assigned-patients endpoint not available in backend OpenAPI spec:', err);
        setPatients([]);
        setFilteredPatients([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAssignedPatients();
  }, [user]);

  // Client-side search logic
  useEffect(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      setFilteredPatients(patients);
    } else {
      setFilteredPatients(
        patients.filter(
          (p) =>
            p.name?.toLowerCase().includes(query) ||
            p.email?.toLowerCase().includes(query) ||
            p.mobile?.includes(query)
        )
      );
    }
  }, [searchQuery, patients]);

  const columns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Patient Name', accessor: 'name' },
    { header: 'Email Address', accessor: 'email' },
    { header: 'Mobile Number', accessor: 'mobile' },
    { header: 'Gender', accessor: 'gender' },
    { header: 'Blood Group', accessor: 'bloodGroup' },
    {
      header: 'Actions',
      render: (row) => (
        <button
          onClick={() => setSelectedPatient(row)}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold transition-colors"
        >
          <Eye className="h-3.5 w-3.5" />
          View Profile
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Assigned Patients</h1>
        <p className="text-sm text-slate-500">Monitor and view medical details of patients assigned to your care</p>
      </div>

      {/* Backend Support Required Warning Banner */}
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 space-y-1">
        <p className="font-bold flex items-center gap-1.5 text-sm text-amber-800">
          Backend Support Required
        </p>
        <p>
          The endpoint <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[11px]">GET /api/nurses/&lbrace;nurseId&rbrace;/assigned-patients</code> is not present in the Backend OpenAPI spec. Nurse patient assignment functionality requires backend API implementation.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 items-start">
        {/* Main List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex gap-4 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search patients by name or contact..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10"
              />
            </div>
          </div>

          <DataTable
            columns={columns}
            data={filteredPatients}
            loading={loading}
            emptyMessage="No patients assigned to you at the moment."
          />
        </div>

        {/* Selected Patient details side panel */}
        {selectedPatient && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6 animate-slide-in">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900">Patient File</h3>
              <p className="text-xs text-slate-500">Medical overview and vital configurations</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold text-lg">
                {selectedPatient.name?.charAt(0)}
              </div>
              <div>
                <h4 className="font-bold text-slate-800">{selectedPatient.name}</h4>
                <p className="text-xs text-slate-400">ID: #{selectedPatient.id}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-slate-400 font-medium">Date of Birth</p>
                <p className="font-semibold text-slate-800">{selectedPatient.dateOfBirth || 'N/A'}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Blood Group</p>
                <p className="font-semibold text-slate-800">{selectedPatient.bloodGroup}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Height</p>
                <p className="font-semibold text-slate-800">{selectedPatient.height ? `${selectedPatient.height} cm` : 'N/A'}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium">Weight</p>
                <p className="font-semibold text-slate-800">{selectedPatient.weight ? `${selectedPatient.weight} kg` : 'N/A'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-slate-400 font-medium">Address</p>
                <p className="font-semibold text-slate-800">
                  {selectedPatient.address}, {selectedPatient.city}, {selectedPatient.state} - {selectedPatient.pincode}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-slate-400 font-medium">Emergency Contact</p>
                <p className="font-semibold text-rose-600 flex items-center gap-1.5 mt-0.5">
                  <Phone className="h-3.5 w-3.5" />
                  {selectedPatient.emergencyContact || 'N/A'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedPatient(null)}
              className="w-full rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Close Patient File
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
