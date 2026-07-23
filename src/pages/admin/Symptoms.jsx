/**
 * Admin Symptoms Management Page
 * Displays a list of defined symptoms and allows adding new symptoms.
 * Matches SymptomRequest DTO: symptomName, departmentId
 */
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { HeartPulse, Plus, Search, Activity } from 'lucide-react';
import symptomsApi from '../../api/symptomsApi';
import departmentApi from '../../api/departmentApi';
import DataTable from '../../components/common/DataTable';

export default function Symptoms() {
  const [symptoms, setSymptoms] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filteredSymptoms, setFilteredSymptoms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State matching SymptomRequest
  const [symptomName, setSymptomName] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchSymptoms = async () => {
    setLoading(true);
    try {
      const [sympRes, deptRes] = await Promise.all([
        symptomsApi.getAll(),
        departmentApi.getAll().catch(() => ({ data: [] }))
      ]);
      setSymptoms(sympRes.data || []);
      setFilteredSymptoms(sympRes.data || []);
      setDepartments(deptRes.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load symptoms list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSymptoms();
  }, []);

  // Filter symptoms client side
  useEffect(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      setFilteredSymptoms(symptoms);
    } else {
      setFilteredSymptoms(
        symptoms.filter(
          (s) =>
            (s.symptomName || s.name || '').toLowerCase().includes(query) ||
            (s.departmentName || '').toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, symptoms]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!symptomName.trim() || !departmentId) {
      toast.error('Please enter symptom name and select department');
      return;
    }

    setSubmitting(true);
    try {
      await symptomsApi.create({
        symptomName: symptomName.trim(),
        departmentId: Number(departmentId),
      });
      toast.success('Symptom created successfully');
      setIsModalOpen(false);
      setSymptomName('');
      setDepartmentId('');
      fetchSymptoms();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to create symptom');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { header: 'ID', accessor: 'id' },
    {
      header: 'Symptom Name',
      render: (row) => row.symptomName || row.name || '—',
    },
    {
      header: 'Department ID',
      accessor: 'departmentId',
    },
    {
      header: 'Department Name',
      render: (row) => row.departmentName || '—',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Symptoms Directory</h1>
          <p className="text-sm text-slate-500">Manage hospital symptom definitions and department mappings</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 transition-colors self-start sm:self-auto shadow-md shadow-blue-500/15"
        >
          <Plus className="h-4.5 w-4.5" />
          Add Symptom
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-4 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search symptoms directory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10"
          />
        </div>
      </div>

      {/* Symptoms list */}
      <DataTable
        columns={columns}
        data={filteredSymptoms}
        loading={loading}
        emptyMessage="No symptoms found matching your query."
      />

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-4">
              <Activity className="h-6 w-6 text-blue-600 animate-pulse-soft" />
              <h3 className="text-lg font-bold text-slate-900 font-sans">Define New Symptom</h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Symptom Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Chest Pain, High Fever"
                  value={symptomName}
                  onChange={(e) => setSymptomName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Department *</label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  required
                >
                  <option value="">-- Select Department --</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.departmentName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
