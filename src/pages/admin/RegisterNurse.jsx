/**
 * Register & Manage Nurses Page (Admin)
 *
 * Implements full CRUD for Nurses matching OpenAPI Spec (nurse-controller):
 *   - GET /api/nurses — View all nurses
 *   - GET /api/nurses/{id} — View nurse profile details by ID
 *   - POST /api/nurses — Create new nurse
 *   - PUT /api/nurses/{id} — Update existing nurse
 *   - DELETE /api/nurses/{id} — Remove nurse
 *
 * Swagger Request Schema (POST / PUT):
 *   { firstName, lastName, email, mobile, password, gender, qualification, experience, departmentId, shift }
 *
 * Swagger Response Schema (GET / POST / PUT):
 *   { id, firstName, lastName, email, mobile, gender, qualification, experience, departmentId, departmentName, shift, status, createdAt, updatedAt }
 */
import { useState, useEffect, useMemo } from 'react';
import { HeartPulse, Plus, Pencil, Trash2, Eye, X, Building2, User, Award, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import nurseApi from '../../api/nurseApi';
import departmentApi from '../../api/departmentApi';
import DataTable from '../../components/common/DataTable';
import SearchBar from '../../components/common/SearchBar';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  mobile: '',
  password: '',
  gender: '',
  qualification: '',
  experience: '',
  departmentId: '',
  shift: 'MORNING',
};

export default function RegisterNurse() {
  const [nurses, setNurses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Form Modal state (Create / Edit)
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // View Details Modal state (GET /api/nurses/{id})
  const [viewingNurse, setViewingNurse] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);

  /** Fetch all nurses and departments */
  const fetchData = async () => {
    setLoading(true);
    try {
      const [nurseRes, deptRes] = await Promise.all([
        nurseApi.getAll(),
        departmentApi.getAll(),
      ]);
      setNurses(nurseRes.data || []);
      setDepartments(deptRes.data || []);
    } catch (err) {
      toast.error('Failed to load nurses or departments data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /** Client-side search filtering */
  const filteredNurses = useMemo(() => {
    if (!searchQuery.trim()) return nurses;
    const q = searchQuery.toLowerCase();
    return nurses.filter(
      (n) =>
        n.firstName?.toLowerCase().includes(q) ||
        n.lastName?.toLowerCase().includes(q) ||
        n.email?.toLowerCase().includes(q) ||
        n.mobile?.includes(q) ||
        n.departmentName?.toLowerCase().includes(q) ||
        n.qualification?.toLowerCase().includes(q) ||
        n.shift?.toLowerCase().includes(q)
    );
  }, [nurses, searchQuery]);

  /** Open Create Modal */
  const openCreateModal = () => {
    setFormData(EMPTY_FORM);
    setEditingId(null);
    setShowModal(true);
  };

  /** Open Edit Modal pre-filled */
  const openEditModal = (n) => {
    setFormData({
      firstName: n.firstName || '',
      lastName: n.lastName || '',
      email: n.email || '',
      mobile: n.mobile || '',
      password: '',
      gender: n.gender || 'FEMALE',
      qualification: n.qualification || '',
      experience: String(n.experience ?? 0),
      departmentId: String(n.departmentId || ''),
      shift: n.shift || 'MORNING',
    });
    setEditingId(n.id);
    setShowModal(true);
  };

  /** View Details via GET /api/nurses/{id} */
  const handleViewDetails = async (id) => {
    setLoadingDetails(true);
    setViewingNurse(null);
    try {
      const res = await nurseApi.getById(id);
      setViewingNurse(res.data);
    } catch (err) {
      toast.error('Failed to fetch nurse profile details');
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  /** Handle Form input changes */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /** Submit Create or Update */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.departmentId) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (!editingId && !formData.password) {
      toast.error('Password is required for new registration');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        mobile: formData.mobile.trim(),
        password: formData.password || undefined,
        gender: formData.gender || 'FEMALE',
        qualification: formData.qualification.trim(),
        experience: formData.experience ? Number(formData.experience) : 0,
        departmentId: Number(formData.departmentId),
        shift: formData.shift ? formData.shift.toUpperCase() : 'MORNING',
      };

      if (editingId) {
        await nurseApi.update(editingId, payload);
        toast.success('Nurse profile updated successfully');
      } else {
        await nurseApi.create(payload);
        toast.success('Nurse registered successfully');
      }

      setShowModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  /** Confirm Delete */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await nurseApi.remove(deleteTarget.id);
      toast.success('Nurse record removed successfully');
      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
      console.error(err);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-IN');
  };

  const inputClass =
    'w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-100 transition-all';

  /** Columns displaying all 14 NurseResponse fields */
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
    { header: 'Gender', accessor: 'gender' },
    {
      header: 'Department',
      render: (row) => (
        <span className="font-semibold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100 text-xs">
          {row.departmentName || `Dept #${row.departmentId}`}
        </span>
      ),
    },
    { header: 'Qualification', accessor: 'qualification' },
    {
      header: 'Experience',
      render: (row) => `${row.experience ?? 0} Yrs`,
    },
    { header: 'Shift', accessor: 'shift' },
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
      header: 'Created At',
      render: (row) => formatDate(row.createdAt),
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleViewDetails(row.id)}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => openEditModal(row)}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-purple-600 transition-colors"
            title="Edit Nurse"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDeleteTarget(row)}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
            title="Delete Nurse"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* ─── Page Header ─── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <HeartPulse className="h-7 w-7 text-purple-600" />
            Nurses Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Register and manage hospital nursing staff and department allocations
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-purple-700"
        >
          <Plus className="h-4 w-4" />
          Add Nurse
        </button>
      </div>

      {/* ─── Search ─── */}
      <SearchBar
        placeholder="Search nurses by name, email, mobile, department, qualification, or shift..."
        onSearch={(val) => {
          setSearchQuery(val);
          setCurrentPage(1);
        }}
        className="max-w-md"
      />

      {/* ─── Data Table ─── */}
      <DataTable
        columns={columns}
        data={filteredNurses}
        loading={loading}
        emptyMessage="No nurses found in database."
        pageSize={10}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />

      {/* ─── View Details Modal (GET /api/nurses/{id}) ─── */}
      {(viewingNurse || loadingDetails) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-5 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <HeartPulse className="h-5 w-5 text-purple-600" />
                Nurse Profile Details
              </h3>
              <button
                onClick={() => setViewingNurse(null)}
                className="rounded-full p-1 hover:bg-slate-100 text-slate-500 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {loadingDetails ? (
              <LoadingSpinner />
            ) : viewingNurse ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 divide-y divide-slate-100 text-sm">
                  {[
                    ['Nurse ID', `#${viewingNurse.id}`],
                    ['First Name', viewingNurse.firstName],
                    ['Last Name', viewingNurse.lastName],
                    ['Email Address', viewingNurse.email],
                    ['Mobile Number', viewingNurse.mobile],
                    ['Gender', viewingNurse.gender],
                    ['Department ID', `#${viewingNurse.departmentId}`],
                    ['Department Name', viewingNurse.departmentName || '—'],
                    ['Qualification', viewingNurse.qualification || '—'],
                    ['Experience', `${viewingNurse.experience ?? 0} Years`],
                    ['Shift', viewingNurse.shift || 'MORNING'],
                    ['Status', viewingNurse.status || 'ACTIVE'],
                    ['Created At', formatDate(viewingNurse.createdAt)],
                    ['Last Updated At', formatDate(viewingNurse.updatedAt)],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between py-2.5 first:pt-0 last:pb-0">
                      <span className="text-slate-500 font-medium text-xs">{label}</span>
                      <span className="font-bold text-slate-800 text-sm">{val || '—'}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setViewingNurse(null)}
                  className="w-full rounded-xl bg-slate-800 text-white font-semibold py-2.5 text-sm hover:bg-slate-900 transition-colors"
                >
                  Close
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ─── Create / Edit Modal (POST / PUT /api/nurses) ─── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">
                {editingId ? `Edit Nurse #${editingId}` : 'Register New Nurse'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">First Name *</label>
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required className={inputClass} placeholder="Jane" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Last Name *</label>
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required className={inputClass} placeholder="Smith" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Email *</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required className={inputClass} placeholder="nurse@hospital.com" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Mobile *</label>
                  <input type="tel" name="mobile" value={formData.mobile} onChange={handleChange} required className={inputClass} placeholder="9876543210" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Password {editingId ? '(Leave blank to keep unchanged)' : '*'}
                  </label>
                  <input type="password" name="password" value={formData.password} onChange={handleChange} required={!editingId} className={inputClass} placeholder="••••••••" autoComplete="new-password" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Gender *</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} required className={inputClass}>
                    <option value="">Select Gender</option>
                    <option value="FEMALE">Female</option>
                    <option value="MALE">Male</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Department *</label>
                  <select name="departmentId" value={formData.departmentId} onChange={handleChange} required className={inputClass}>
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>{dept.departmentName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Qualification *</label>
                  <input type="text" name="qualification" value={formData.qualification} onChange={handleChange} required className={inputClass} placeholder="BSc Nursing" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Experience (Years) *</label>
                  <input type="number" min="0" name="experience" value={formData.experience} onChange={handleChange} required className={inputClass} placeholder="3" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Shift *</label>
                  <select name="shift" value={formData.shift} onChange={handleChange} required className={inputClass}>
                    <option value="MORNING">Morning</option>
                    <option value="EVENING">Evening</option>
                    <option value="NIGHT">Night</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-700 disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Saving...' : editingId ? 'Update Nurse' : 'Register Nurse'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation ─── */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Nurse"
        message={`Are you sure you want to delete nurse "${deleteTarget?.firstName} ${deleteTarget?.lastName}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        variant="danger"
      />
    </div>
  );
}
