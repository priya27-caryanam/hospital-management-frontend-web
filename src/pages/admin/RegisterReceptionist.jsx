/**
 * Receptionist Management Page (Admin)
 *
 * Implements 100% Swagger API schema compliance for Receptionists:
 *   - GET /api/receptionists — List all receptionists
 *   - GET /api/receptionists/{id} — View Receptionist details
 *   - POST /api/receptionists — Create Receptionist
 *   - PUT /api/receptionists/{id} — Update Receptionist
 *   - DELETE /api/receptionists/{id} — Delete Receptionist
 *
 * Swagger Request Schema (POST / PUT):
 *   { firstName, lastName, email, mobile, password, gender, shift }
 *
 * Swagger Response Schema (GET / POST / PUT):
 *   { id, firstName, lastName, email, mobile, gender, shift, status, createdAt, updatedAt }
 */
import { useState, useEffect } from 'react';
import {
  UserPlus,
  Search,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  X,
  User,
  Mail,
  Phone,
  Clock,
  Shield,
  Calendar,
  CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import receptionistApi from '../../api/receptionistApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const INITIAL_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  mobile: '',
  password: '',
  gender: '',
  shift: 'MORNING',
};

const SHIFTS = ['MORNING', 'EVENING', 'NIGHT'];
const GENDERS = ['MALE', 'FEMALE', 'OTHER'];

export default function RegisterReceptionist() {
  const [receptionists, setReceptionists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Form / Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Detail Modal State
  const [viewingReceptionist, setViewingReceptionist] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Edit Modal State
  const [editingReceptionist, setEditingReceptionist] = useState(null);
  const [editFormData, setEditFormData] = useState(INITIAL_FORM);
  const [editErrors, setEditErrors] = useState({});
  const [updating, setUpdating] = useState(false);

  // Delete State
  const [deletingId, setDeletingId] = useState(null);

  /** Fetch all receptionists on mount */
  const fetchReceptionists = async () => {
    setLoading(true);
    try {
      const res = await receptionistApi.getAll();
      setReceptionists(res.data || []);
    } catch (err) {
      toast.error('Failed to load receptionists list');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceptionists();
  }, []);

  /** Input changes for Register form */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  /** Input changes for Edit form */
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
    if (editErrors[name]) {
      setEditErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  /** Validate Register Form */
  const validateRegisterForm = () => {
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
    if (!formData.password) {
      errs.password = 'Password is required';
    } else if (!passRegex.test(formData.password)) {
      errs.password = '8-20 characters with uppercase, lowercase, number and special character (@$!%*?&#)';
    }

    if (!formData.gender) errs.gender = 'Gender is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /** Handle POST /api/receptionists */
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!validateRegisterForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        mobile: formData.mobile.trim(),
        password: formData.password,
        gender: formData.gender,
        shift: formData.shift,
      };

      await receptionistApi.create(payload);
      toast.success('Receptionist registered successfully!');
      setShowAddModal(false);
      setFormData(INITIAL_FORM);
      setErrors({});
      fetchReceptionists();
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.errors && typeof errData.errors === 'object') {
        setErrors((prev) => ({ ...prev, ...errData.errors }));
      }
      toast.error(errData?.message || 'Registration failed');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  /** Handle GET /api/receptionists/{id} */
  const handleViewDetails = async (id) => {
    setLoadingDetails(true);
    setViewingReceptionist(null);
    try {
      const res = await receptionistApi.getById(id);
      setViewingReceptionist(res.data);
    } catch (err) {
      toast.error('Failed to fetch receptionist details');
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  /** Open Edit Modal */
  const handleOpenEdit = (rec) => {
    setEditingReceptionist(rec);
    setEditFormData({
      firstName: rec.firstName || '',
      lastName: rec.lastName || '',
      email: rec.email || '',
      mobile: rec.mobile || '',
      password: '', // leave empty unless updating password
      gender: rec.gender || '',
      shift: rec.shift || 'MORNING',
    });
    setEditErrors({});
  };

  /** Handle PUT /api/receptionists/{id} */
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingReceptionist) return;

    setUpdating(true);
    try {
      const payload = {
        firstName: editFormData.firstName.trim(),
        lastName: editFormData.lastName.trim(),
        email: editFormData.email.trim(),
        mobile: editFormData.mobile.trim(),
        password: editFormData.password || undefined,
        gender: editFormData.gender || 'FEMALE',
        shift: editFormData.shift,
      };

      await receptionistApi.update(editingReceptionist.id, payload);
      toast.success('Receptionist updated successfully!');
      setEditingReceptionist(null);
      fetchReceptionists();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  /** Handle DELETE /api/receptionists/{id} */
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this receptionist?')) return;

    setDeletingId(id);
    try {
      await receptionistApi.remove(id);
      toast.success('Receptionist removed successfully');
      fetchReceptionists();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete receptionist');
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-IN');
  };

  const getInputClass = (field, isEdit = false) => {
    const errMap = isEdit ? editErrors : errors;
    return `w-full rounded-xl border ${
      errMap[field] ? 'border-red-400 focus:ring-red-200' : 'border-slate-200 focus:border-amber-500 focus:ring-amber-100'
    } px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all bg-white`;
  };

  const ErrorMsg = ({ field, isEdit = false }) => {
    const errMap = isEdit ? editErrors : errors;
    return errMap[field] ? <p className="mt-1 text-xs text-red-500 font-medium">{errMap[field]}</p> : null;
  };

  // Filter receptionists by search term
  const filteredReceptionists = receptionists.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = `${r.firstName || ''} ${r.lastName || ''}`.toLowerCase();
    const email = (r.email || '').toLowerCase();
    const mobile = (r.mobile || '').toLowerCase();
    const shift = (r.shift || '').toLowerCase();
    return name.includes(q) || email.includes(q) || mobile.includes(q) || shift.includes(q);
  });

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="space-y-6">
      {/* ─── PAGE HEADER ─── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <UserPlus className="h-7 w-7 text-amber-600" />
            Receptionist Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Register and manage front-desk hospital receptionists
          </p>
        </div>
        <button
          onClick={() => {
            setFormData(INITIAL_FORM);
            setErrors({});
            setShowAddModal(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-700"
        >
          <UserPlus className="h-4 w-4" />
          Add Receptionist
        </button>
      </div>

      {/* ─── SEARCH ─── */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search receptionists by name, email, mobile, or shift..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-100 transition-all bg-white"
        />
      </div>

      {/* ─── RECEPTIONISTS TABLE ─── */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase text-slate-400 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">ID</th>
                <th className="px-5 py-3.5">Name</th>
                <th className="px-5 py-3.5">Email</th>
                <th className="px-5 py-3.5">Mobile</th>
                <th className="px-5 py-3.5">Gender</th>
                <th className="px-5 py-3.5">Shift</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredReceptionists.length > 0 ? (
                filteredReceptionists.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs text-slate-500">#{rec.id}</td>
                    <td className="px-5 py-4 font-bold text-slate-900">
                      {rec.firstName} {rec.lastName}
                    </td>
                    <td className="px-5 py-4 text-slate-600">{rec.email}</td>
                    <td className="px-5 py-4 text-slate-600">{rec.mobile}</td>
                    <td className="px-5 py-4 text-slate-600 capitalize">{rec.gender || '—'}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                        {rec.shift || 'MORNING'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          rec.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {rec.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleViewDetails(rec.id)}
                          title="View Details"
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(rec)}
                          title="Edit Receptionist"
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-amber-600 transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(rec.id)}
                          disabled={deletingId === rec.id}
                          title="Delete Receptionist"
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-slate-400">
                    No receptionists found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── ADD RECEPTIONIST MODAL (POST /api/receptionists) ─── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl space-y-6 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-amber-600" />
                Register Receptionist
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-full p-1 hover:bg-slate-100 text-slate-500 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-4" noValidate>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={getInputClass('firstName')}
                    placeholder="John"
                  />
                  <ErrorMsg field="firstName" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={getInputClass('lastName')}
                    placeholder="Doe"
                  />
                  <ErrorMsg field="lastName" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={getInputClass('email')}
                    placeholder="receptionist@hospital.com"
                  />
                  <ErrorMsg field="email" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mobile *</label>
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    className={getInputClass('mobile')}
                    placeholder="9876543210"
                  />
                  <ErrorMsg field="mobile" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">Gender *</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className={getInputClass('gender')}
                  >
                    <option value="">-- Select Gender --</option>
                    {GENDERS.map((g) => (
                      <option key={g} value={g}>
                        {g.charAt(0) + g.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </select>
                  <ErrorMsg field="gender" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Shift *</label>
                  <select
                    name="shift"
                    value={formData.shift}
                    onChange={handleInputChange}
                    required
                    className={getInputClass('shift')}
                  >
                    {SHIFTS.map((s) => (
                      <option key={s} value={s}>
                        {s.charAt(0) + s.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-6 py-2.5 transition-colors disabled:opacity-50 shadow-sm"
                >
                  {submitting ? 'Registering...' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── VIEW RECEPTIONIST DETAILS MODAL (GET /api/receptionists/{id}) ─── */}
      {(viewingReceptionist || loadingDetails) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-5 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Receptionist Profile Details
              </h3>
              <button
                onClick={() => setViewingReceptionist(null)}
                className="rounded-full p-1 hover:bg-slate-100 text-slate-500 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {loadingDetails ? (
              <LoadingSpinner />
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 divide-y divide-slate-100 text-sm">
                  {[
                    ['Receptionist ID', `#${viewingReceptionist.id}`],
                    ['First Name', viewingReceptionist.firstName],
                    ['Last Name', viewingReceptionist.lastName],
                    ['Email', viewingReceptionist.email],
                    ['Mobile', viewingReceptionist.mobile],
                    ['Gender', viewingReceptionist.gender],
                    ['Shift', viewingReceptionist.shift],
                    ['Status', viewingReceptionist.status],
                    ['Created At', formatDate(viewingReceptionist.createdAt)],
                    ['Updated At', formatDate(viewingReceptionist.updatedAt)],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between py-2 first:pt-0 last:pb-0">
                      <span className="text-slate-500 font-medium">{label}</span>
                      <span className="font-bold text-slate-800">{val || '—'}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setViewingReceptionist(null)}
                  className="w-full rounded-xl bg-slate-800 text-white font-semibold py-2.5 text-sm hover:bg-slate-900 transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── EDIT RECEPTIONIST MODAL (PUT /api/receptionists/{id}) ─── */}
      {editingReceptionist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl space-y-6 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-amber-600" />
                Edit Receptionist #{editingReceptionist.id}
              </h3>
              <button
                onClick={() => setEditingReceptionist(null)}
                className="rounded-full p-1 hover:bg-slate-100 text-slate-500 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={editFormData.firstName}
                    onChange={handleEditInputChange}
                    required
                    className={getInputClass('firstName', true)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={editFormData.lastName}
                    onChange={handleEditInputChange}
                    required
                    className={getInputClass('lastName', true)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={editFormData.email}
                    onChange={handleEditInputChange}
                    required
                    className={getInputClass('email', true)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mobile *</label>
                  <input
                    type="tel"
                    name="mobile"
                    value={editFormData.mobile}
                    onChange={handleEditInputChange}
                    required
                    className={getInputClass('mobile', true)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={editFormData.password}
                    onChange={handleEditInputChange}
                    placeholder="Enter new password or leave blank"
                    className={getInputClass('password', true)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Gender *</label>
                  <select
                    name="gender"
                    value={editFormData.gender}
                    onChange={handleEditInputChange}
                    required
                    className={getInputClass('gender', true)}
                  >
                    {GENDERS.map((g) => (
                      <option key={g} value={g}>
                        {g.charAt(0) + g.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Shift *</label>
                  <select
                    name="shift"
                    value={editFormData.shift}
                    onChange={handleEditInputChange}
                    required
                    className={getInputClass('shift', true)}
                  >
                    {SHIFTS.map((s) => (
                      <option key={s} value={s}>
                        {s.charAt(0) + s.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingReceptionist(null)}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-6 py-2.5 transition-colors disabled:opacity-50 shadow-sm"
                >
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
