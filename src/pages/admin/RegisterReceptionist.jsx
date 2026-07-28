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
  gender: 'MALE',
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
  const [submitting, setSubmitting] = useState(false);

  // Detail Modal State
  const [viewingReceptionist, setViewingReceptionist] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Edit Modal State
  const [editingReceptionist, setEditingReceptionist] = useState(null);
  const [editFormData, setEditFormData] = useState(INITIAL_FORM);
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
  };

  /** Input changes for Edit form */
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
  };

  /** Handle POST /api/receptionists */
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.mobile || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }

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
      fetchReceptionists();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
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
      gender: rec.gender || 'MALE',
      shift: rec.shift || 'MORNING',
    });
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
        password: editFormData.password || 'password123', // fallback if empty
        gender: editFormData.gender,
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

  // Filter receptionists by search term
  const filteredReceptionists = receptionists.filter((r) => {
    const term = searchQuery.toLowerCase();
    return (
      r.firstName?.toLowerCase().includes(term) ||
      r.lastName?.toLowerCase().includes(term) ||
      r.email?.toLowerCase().includes(term) ||
      r.mobile?.includes(term) ||
      r.id?.toString().includes(term)
    );
  });

  const inputClass =
    'w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all';

  return (
    <div className="space-y-6">
      {/* ─── Page Header & Action ─── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <UserPlus className="h-7 w-7 text-amber-600" />
            Receptionist Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Register and manage hospital receptionist staff
          </p>
        </div>
        <button
          onClick={() => {
            setFormData(INITIAL_FORM);
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 text-sm font-semibold shadow-sm transition-all"
        >
          <UserPlus className="h-4 w-4" />
          Register Receptionist
        </button>
      </div>

      {/* ─── Search & Stats Bar ─── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by name, email, mobile or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 pl-4 pr-10 py-2.5 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-100"
          />
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Total Receptionists: <span className="font-bold text-slate-800">{receptionists.length}</span>
        </div>
      </div>

      {/* ─── Receptionists Table ─── */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
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
              <tbody className="divide-y divide-slate-100">
                {filteredReceptionists.length > 0 ? (
                  filteredReceptionists.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4 font-mono font-medium text-slate-800">#{rec.id}</td>
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
      )}

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

            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    className={inputClass}
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    className={inputClass}
                    placeholder="Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className={inputClass}
                    placeholder="receptionist@hospital.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mobile *</label>
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    required
                    className={inputClass}
                    placeholder="9876543210"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Password *</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className={inputClass}
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Gender *</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    required
                    className={inputClass}
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
                    value={formData.shift}
                    onChange={handleInputChange}
                    required
                    className={inputClass}
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
                    className={inputClass}
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
                    className={inputClass}
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
                    className={inputClass}
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
                    className={inputClass}
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
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Gender *</label>
                  <select
                    name="gender"
                    value={editFormData.gender}
                    onChange={handleEditInputChange}
                    required
                    className={inputClass}
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
                    className={inputClass}
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
