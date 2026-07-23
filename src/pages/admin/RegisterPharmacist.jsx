/**
 * Register & Manage Pharmacists Page (Admin)
 *
 * Implements full CRUD for Pharmacists matching OpenAPI Spec (pharmacist-controller):
 *   - GET /api/pharmacists — View all pharmacists
 *   - GET /api/pharmacists/{id} — View pharmacist profile by ID
 *   - POST /api/pharmacists — Create new pharmacist
 *   - PUT /api/pharmacists/{id} — Update existing pharmacist
 *   - DELETE /api/pharmacists/{id} — Remove pharmacist
 *
 * Swagger Request Schema (POST / PUT):
 *   { firstName, lastName, email, mobile, password, gender, qualification, licenseNumber }
 *
 * Swagger Response Schema (GET / POST / PUT):
 *   { id, firstName, lastName, email, mobile, qualification, licenseNumber }
 */
import { useState, useEffect, useMemo } from 'react';
import { Pill, Plus, Pencil, Trash2, Eye, X, Mail, Phone, Award, ShieldCheck, User } from 'lucide-react';
import toast from 'react-hot-toast';
import pharmacistApi from '../../api/pharmacistApi';
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
  licenseNumber: '',
};

export default function RegisterPharmacist() {
  const [pharmacists, setPharmacists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Form Modal state (Create / Edit)
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // View Details Modal state (GET /api/pharmacists/{id})
  const [viewingPharmacist, setViewingPharmacist] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);

  /** Fetch all pharmacists */
  const fetchPharmacists = async () => {
    setLoading(true);
    try {
      const res = await pharmacistApi.getAll();
      setPharmacists(res.data || []);
    } catch (err) {
      toast.error('Failed to load pharmacists');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPharmacists();
  }, []);

  /** Filter data for client search */
  const filteredPharmacists = useMemo(() => {
    if (!searchQuery.trim()) return pharmacists;
    const q = searchQuery.toLowerCase();
    return pharmacists.filter(
      (p) =>
        p.firstName?.toLowerCase().includes(q) ||
        p.lastName?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.mobile?.includes(q) ||
        p.licenseNumber?.toLowerCase().includes(q) ||
        p.qualification?.toLowerCase().includes(q)
    );
  }, [pharmacists, searchQuery]);

  /** Open Create Modal */
  const openCreateModal = () => {
    setFormData(EMPTY_FORM);
    setEditingId(null);
    setShowModal(true);
  };

  /** Open Edit Modal pre-filled */
  const openEditModal = (p) => {
    setFormData({
      firstName: p.firstName || '',
      lastName: p.lastName || '',
      email: p.email || '',
      mobile: p.mobile || '',
      password: '',
      gender: p.gender || 'MALE',
      qualification: p.qualification || '',
      licenseNumber: p.licenseNumber || '',
    });
    setEditingId(p.id);
    setShowModal(true);
  };

  /** View Details via GET /api/pharmacists/{id} */
  const handleViewDetails = async (id) => {
    setLoadingDetails(true);
    setViewingPharmacist(null);
    try {
      const res = await pharmacistApi.getById(id);
      setViewingPharmacist(res.data);
    } catch (err) {
      toast.error('Failed to fetch pharmacist details');
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

    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast.error('Please fill in required fields');
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
        gender: formData.gender || 'MALE',
        qualification: formData.qualification.trim(),
        licenseNumber: formData.licenseNumber.trim(),
      };

      if (editingId) {
        await pharmacistApi.update(editingId, payload);
        toast.success('Pharmacist updated successfully');
      } else {
        await pharmacistApi.create(payload);
        toast.success('Pharmacist registered successfully');
      }

      setShowModal(false);
      fetchPharmacists();
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
      await pharmacistApi.remove(deleteTarget.id);
      toast.success('Pharmacist removed successfully');
      setDeleteTarget(null);
      fetchPharmacists();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
      console.error(err);
    }
  };

  const inputClass =
    'w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all';

  /** Columns displaying all 7 PharmacistResponse fields */
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
    { header: 'Qualification', accessor: 'qualification' },
    {
      header: 'License Number',
      render: (row) => (
        <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 text-xs">
          {row.licenseNumber || '—'}
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
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => openEditModal(row)}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-emerald-600 transition-colors"
            title="Edit Pharmacist"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDeleteTarget(row)}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
            title="Delete Pharmacist"
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
            <Pill className="h-7 w-7 text-emerald-600" />
            Pharmacists Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Register and manage hospital pharmacists
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Add Pharmacist
        </button>
      </div>

      {/* ─── Search ─── */}
      <SearchBar
        placeholder="Search pharmacists by name, email, mobile, or license number..."
        onSearch={(val) => {
          setSearchQuery(val);
          setCurrentPage(1);
        }}
        className="max-w-md"
      />

      {/* ─── Data Table ─── */}
      <DataTable
        columns={columns}
        data={filteredPharmacists}
        loading={loading}
        emptyMessage="No pharmacists found in database."
        pageSize={10}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />

      {/* ─── View Details Modal (GET /api/pharmacists/{id}) ─── */}
      {(viewingPharmacist || loadingDetails) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-5 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Pill className="h-5 w-5 text-emerald-600" />
                Pharmacist Profile Details
              </h3>
              <button
                onClick={() => setViewingPharmacist(null)}
                className="rounded-full p-1 hover:bg-slate-100 text-slate-500 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {loadingDetails ? (
              <LoadingSpinner />
            ) : viewingPharmacist ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 divide-y divide-slate-100 text-sm">
                  {[
                    ['Pharmacist ID', `#${viewingPharmacist.id}`],
                    ['First Name', viewingPharmacist.firstName],
                    ['Last Name', viewingPharmacist.lastName],
                    ['Email Address', viewingPharmacist.email],
                    ['Mobile Number', viewingPharmacist.mobile],
                    ['Qualification', viewingPharmacist.qualification || '—'],
                    ['License Number', viewingPharmacist.licenseNumber || '—'],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between py-2.5 first:pt-0 last:pb-0">
                      <span className="text-slate-500 font-medium text-xs">{label}</span>
                      <span className="font-bold text-slate-800 text-sm">{val || '—'}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setViewingPharmacist(null)}
                  className="w-full rounded-xl bg-slate-800 text-white font-semibold py-2.5 text-sm hover:bg-slate-900 transition-colors"
                >
                  Close
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ─── Create / Edit Modal (POST / PUT /api/pharmacists) ─── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">
                {editingId ? `Edit Pharmacist #${editingId}` : 'Register New Pharmacist'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">First Name *</label>
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required className={inputClass} placeholder="Robert" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Last Name *</label>
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required className={inputClass} placeholder="Johnson" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Email *</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required className={inputClass} placeholder="pharmacist@hospital.com" />
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
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Qualification *</label>
                  <input type="text" name="qualification" value={formData.qualification} onChange={handleChange} required className={inputClass} placeholder="B.Pharm, M.Pharm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">License Number *</label>
                  <input type="text" name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} required className={inputClass} placeholder="PHARM-98765" />
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
                  className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Saving...' : editingId ? 'Update Pharmacist' : 'Register Pharmacist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation ─── */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Pharmacist"
        message={`Are you sure you want to delete "${deleteTarget?.firstName} ${deleteTarget?.lastName}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        variant="danger"
      />
    </div>
  );
}
