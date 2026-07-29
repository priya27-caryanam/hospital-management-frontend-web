/**
 * Register & Manage Lab Technicians Page (Admin)
 *
 * Implements full CRUD for Lab Technicians matching OpenAPI Spec (lab-technician-controller):
 *   - GET /api/lab-technicians — View all lab technicians
 *   - GET /api/lab-technicians/{id} — View lab technician details by ID
 *   - POST /api/lab-technicians — Create new lab technician
 *   - PUT /api/lab-technicians/{id} — Update existing lab technician
 *   - DELETE /api/lab-technicians/{id} — Remove lab technician
 *
 * Swagger Request Schema (POST / PUT):
 *   { firstName, lastName, email, mobile, password, gender, qualification, experience, certificateNumber, shift }
 *
 * Swagger Response Schema (GET / POST / PUT):
 *   { id, firstName, lastName, email, mobile, gender, qualification, experience, certificateNumber, shift, status, createdAt, updatedAt }
 */
import { useState, useEffect, useMemo } from 'react';
import { TestTube, Plus, Pencil, Trash2, Eye, EyeOff, X, Mail, Phone, Award, ShieldCheck, User } from 'lucide-react';
import toast from 'react-hot-toast';
import labTechnicianApi from '../../api/labTechnicianApi';
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
  certificateNumber: '',
  shift: 'MORNING',
};

export default function RegisterLabTechnician() {
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Form Modal state (Create / Edit)
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // View Details Modal state (GET /api/lab-technicians/{id})
  const [viewingTechnician, setViewingTechnician] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);

  /** Fetch all lab technicians */
  const fetchTechnicians = async () => {
    setLoading(true);
    try {
      const res = await labTechnicianApi.getAll();
      setTechnicians(res.data || []);
    } catch (err) {
      toast.error('Failed to load lab technicians directory');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTechnicians();
  }, []);

  /** Client-side search filtering */
  const filteredTechnicians = useMemo(() => {
    if (!searchQuery.trim()) return technicians;
    const q = searchQuery.toLowerCase();
    return technicians.filter(
      (t) =>
        t.firstName?.toLowerCase().includes(q) ||
        t.lastName?.toLowerCase().includes(q) ||
        t.email?.toLowerCase().includes(q) ||
        t.mobile?.includes(q) ||
        t.qualification?.toLowerCase().includes(q) ||
        t.certificateNumber?.toLowerCase().includes(q) ||
        t.shift?.toLowerCase().includes(q)
    );
  }, [technicians, searchQuery]);

  /** Open Create Modal */
  const openCreateModal = () => {
    setFormData(EMPTY_FORM);
    setErrors({});
    setEditingId(null);
    setShowModal(true);
  };

  /** Open Edit Modal pre-filled */
  const openEditModal = (t) => {
    setFormData({
      firstName: t.firstName || '',
      lastName: t.lastName || '',
      email: t.email || '',
      mobile: t.mobile || '',
      password: '',
      gender: t.gender || '',
      qualification: t.qualification || '',
      experience: String(t.experience ?? 0),
      certificateNumber: t.certificateNumber || '',
      shift: t.shift || 'MORNING',
    });
    setErrors({});
    setEditingId(t.id);
    setShowModal(true);
  };

  /** View Details via GET /api/lab-technicians/{id} */
  const handleViewDetails = async (id) => {
    setLoadingDetails(true);
    setViewingTechnician(null);
    try {
      const res = await labTechnicianApi.getById(id);
      setViewingTechnician(res.data);
    } catch (err) {
      toast.error('Failed to fetch lab technician profile details');
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  /** Handle Form input changes */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  /** Field-level Form Validation */
  const validateForm = () => {
    const errs = {};
    if (!formData.firstName.trim()) errs.firstName = 'First Name is required';
    if (!formData.lastName.trim()) errs.lastName = 'Last Name is required';

    if (!formData.email.trim()) {
      errs.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Enter a valid email address';
    }

    if (!formData.mobile.trim()) {
      errs.mobile = 'Mobile number is required';
    } else if (!/^[6-9]\d{9}$/.test(formData.mobile.trim())) {
      errs.mobile = 'Enter a valid 10-digit mobile number starting with 6-9';
    }

    const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,20}$/;
    if (!editingId) {
      if (!formData.password) {
        errs.password = 'Password is required';
      } else if (!passRegex.test(formData.password)) {
        errs.password = '8-20 characters with uppercase, lowercase, number and special character (@$!%*?&#)';
      }
    } else if (formData.password) {
      if (!passRegex.test(formData.password)) {
        errs.password = '8-20 characters with uppercase, lowercase, number and special character (@$!%*?&#)';
      }
    }

    if (!formData.gender) errs.gender = 'Gender is required';
    if (!formData.qualification.trim()) errs.qualification = 'Qualification is required';
    if (formData.experience === '' || formData.experience === null || formData.experience === undefined) errs.experience = 'Experience is required';
    if (!formData.certificateNumber.trim()) errs.certificateNumber = 'Certificate Number is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /** Submit Create or Update */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        mobile: formData.mobile.trim(),
        password: formData.password || undefined,
        gender: formData.gender,
        qualification: formData.qualification.trim(),
        experience: formData.experience ? Number(formData.experience) : 0,
        certificateNumber: formData.certificateNumber.trim(),
        shift: formData.shift ? formData.shift.toUpperCase() : 'MORNING',
      };

      if (editingId) {
        await labTechnicianApi.update(editingId, payload);
        toast.success('Lab Technician updated successfully');
      } else {
        await labTechnicianApi.create(payload);
        toast.success('Lab Technician registered successfully');
      }

      setShowModal(false);
      setErrors({});
      fetchTechnicians();
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.errors && typeof errData.errors === 'object') {
        setErrors((prev) => ({ ...prev, ...errData.errors }));
      }
      toast.error(errData?.message || 'Operation failed');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  /** Confirm Delete */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await labTechnicianApi.remove(deleteTarget.id);
      toast.success('Lab Technician removed successfully');
      setDeleteTarget(null);
      fetchTechnicians();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
      console.error(err);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-IN');
  };

  const getInputClass = (field) =>
    `w-full rounded-xl border ${
      errors[field] ? 'border-red-400 focus:ring-red-200' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100'
    } px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all bg-white`;

  const ErrorMsg = ({ field }) =>
    errors[field] ? <p className="mt-1 text-xs text-red-500 font-medium">{errors[field]}</p> : null;

  /** Columns displaying all 14 LabTechnicianResponse fields */
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
    { header: 'Qualification', accessor: 'qualification' },
    {
      header: 'Experience',
      render: (row) => `${row.experience ?? 0} Yrs`,
    },
    {
      header: 'Certificate #',
      render: (row) => (
        <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
          {row.certificateNumber || '—'}
        </span>
      ),
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
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleViewDetails(row.id)}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors"
            title="View Profile Details"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => openEditModal(row)}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
            title="Edit Lab Technician"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDeleteTarget(row)}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
            title="Delete Lab Technician"
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
            <TestTube className="h-7 w-7 text-indigo-600" />
            Lab Technicians Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Register new laboratory technicians and manage certified lab staff
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4" />
          Add Lab Tech
        </button>
      </div>

      {/* ─── Search ─── */}
      <SearchBar
        placeholder="Search technicians by name, email, mobile, qualification, certificate, or shift..."
        onSearch={(val) => {
          setSearchQuery(val);
          setCurrentPage(1);
        }}
        className="max-w-md"
      />

      {/* ─── Data Table ─── */}
      <DataTable
        columns={columns}
        data={filteredTechnicians}
        loading={loading}
        emptyMessage="No lab technicians found in database."
        pageSize={10}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />

      {/* ─── View Details Modal (GET /api/lab-technicians/{id}) ─── */}
      {(viewingTechnician || loadingDetails) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-5 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <TestTube className="h-5 w-5 text-indigo-600" />
                Lab Technician Profile Details
              </h3>
              <button
                onClick={() => setViewingTechnician(null)}
                className="rounded-full p-1 hover:bg-slate-100 text-slate-500 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {loadingDetails ? (
              <LoadingSpinner />
            ) : viewingTechnician ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 divide-y divide-slate-100 text-sm">
                  {[
                    ['Technician ID', `#${viewingTechnician.id}`],
                    ['First Name', viewingTechnician.firstName],
                    ['Last Name', viewingTechnician.lastName],
                    ['Email Address', viewingTechnician.email],
                    ['Mobile Number', viewingTechnician.mobile],
                    ['Gender', viewingTechnician.gender],
                    ['Qualification', viewingTechnician.qualification || '—'],
                    ['Experience', `${viewingTechnician.experience ?? 0} Years`],
                    ['Certificate Number', viewingTechnician.certificateNumber || '—'],
                    ['Shift', viewingTechnician.shift || 'MORNING'],
                    ['Status', viewingTechnician.status || 'ACTIVE'],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between py-2.5 first:pt-0 last:pb-0">
                      <span className="text-slate-500 font-medium text-xs">{label}</span>
                      <span className="font-bold text-slate-800 text-sm">{val || '—'}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setViewingTechnician(null)}
                  className="w-full rounded-xl bg-slate-800 text-white font-semibold py-2.5 text-sm hover:bg-slate-900 transition-colors"
                >
                  Close
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ─── Create / Edit Modal (POST / PUT /api/lab-technicians) ─── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">
                {editingId ? `Edit Lab Technician #${editingId}` : 'Register New Lab Technician'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">First Name *</label>
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className={getInputClass('firstName')} placeholder="Alice" />
                  <ErrorMsg field="firstName" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Last Name *</label>
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className={getInputClass('lastName')} placeholder="Williams" />
                  <ErrorMsg field="lastName" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Email *</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className={getInputClass('email')} placeholder="labtech@hospital.com" />
                  <ErrorMsg field="email" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Mobile *</label>
                  <input type="tel" name="mobile" value={formData.mobile} onChange={handleChange} className={getInputClass('mobile')} placeholder="9876543210" />
                  <ErrorMsg field="mobile" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Password {editingId ? '(Leave blank to keep unchanged)' : '*'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={`${getInputClass('password')} !pr-10`}
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <ErrorMsg field="password" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Gender *</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} className={getInputClass('gender')}>
                    <option value="">-- Select Gender --</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                  <ErrorMsg field="gender" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Qualification *</label>
                  <input type="text" name="qualification" value={formData.qualification} onChange={handleChange} className={getInputClass('qualification')} placeholder="BSc MLT" />
                  <ErrorMsg field="qualification" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Experience (Years) *</label>
                  <input type="number" min="0" name="experience" value={formData.experience} onChange={handleChange} className={getInputClass('experience')} placeholder="3" />
                  <ErrorMsg field="experience" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Certificate Number *</label>
                  <input type="text" name="certificateNumber" value={formData.certificateNumber} onChange={handleChange} className={getInputClass('certificateNumber')} placeholder="CERT-4321" />
                  <ErrorMsg field="certificateNumber" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Shift *</label>
                  <select name="shift" value={formData.shift} onChange={handleChange} className={getInputClass('shift')}>
                    <option value="MORNING">Morning</option>
                    <option value="EVENING">Evening</option>
                    <option value="NIGHT">Night</option>
                  </select>
                  <ErrorMsg field="shift" />
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
                  className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Saving...' : editingId ? 'Update Technician' : 'Register Technician'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation ─── */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Lab Technician"
        message={`Are you sure you want to delete "${deleteTarget?.firstName} ${deleteTarget?.lastName}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        variant="danger"
      />
    </div>
  );
}
