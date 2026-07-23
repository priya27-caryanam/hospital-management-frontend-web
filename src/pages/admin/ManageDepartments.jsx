/**
 * Manage Departments Page
 * Full CRUD for hospital departments matching Swagger specification:
 *   - GET /api/departments — View all departments
 *   - GET /api/departments/{id} — View department details by ID
 *   - POST /api/departments — Create new department
 *   - PUT /api/departments/{id} — Update existing department
 *   - DELETE /api/departments/{id} — Delete department
 *
 * Swagger Request Schema (POST / PUT):
 *   { departmentName, description, floorNumber, status }
 *
 * Swagger Response Schema (GET / POST / PUT):
 *   { id, departmentName, description, floorNumber, status, createdAt, updatedAt }
 */
import { useState, useEffect, useMemo } from 'react';
import { Plus, Pencil, Trash2, Building2, X, Eye, Clock, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import departmentApi from '../../api/departmentApi';
import DataTable from '../../components/common/DataTable';
import SearchBar from '../../components/common/SearchBar';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const EMPTY_FORM = { departmentName: '', description: '', floorNumber: '', status: 'ACTIVE' };

export default function ManageDepartments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Form Modal state (Create / Edit)
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // View Details Modal state (GET /api/departments/{id})
  const [viewingDept, setViewingDept] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);

  /** Fetch all departments */
  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await departmentApi.getAll();
      setDepartments(res.data || []);
    } catch (err) {
      toast.error('Failed to load departments');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  /** Client-side filtered data */
  const filteredDepartments = useMemo(() => {
    if (!searchQuery.trim()) return departments;
    const q = searchQuery.toLowerCase();
    return departments.filter(
      (d) =>
        d.departmentName?.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q) ||
        d.status?.toLowerCase().includes(q) ||
        d.id?.toString().includes(q)
    );
  }, [departments, searchQuery]);

  /** Open modal for creating a new department */
  const openCreateModal = () => {
    setFormData(EMPTY_FORM);
    setEditingId(null);
    setShowModal(true);
  };

  /** Open modal pre-filled for editing */
  const openEditModal = (dept) => {
    setFormData({
      departmentName: dept.departmentName || '',
      description: dept.description || '',
      floorNumber: dept.floorNumber ?? '',
      status: dept.status || 'ACTIVE',
    });
    setEditingId(dept.id);
    setShowModal(true);
  };

  /** Fetch and open View Details modal (GET /api/departments/{id}) */
  const handleViewDetails = async (id) => {
    setLoadingDetails(true);
    setViewingDept(null);
    try {
      const res = await departmentApi.getById(id);
      setViewingDept(res.data);
    } catch (err) {
      toast.error('Failed to fetch department details');
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  /** Handle form field changes */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /** Submit create or update */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.departmentName.trim()) {
      toast.error('Department name is required');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        departmentName: formData.departmentName.trim(),
        description: formData.description.trim(),
        floorNumber: formData.floorNumber ? Number(formData.floorNumber) : 0,
        status: formData.status || 'ACTIVE',
      };

      if (editingId) {
        await departmentApi.update(editingId, payload);
        toast.success('Department updated successfully');
      } else {
        await departmentApi.create(payload);
        toast.success('Department created successfully');
      }

      setShowModal(false);
      fetchDepartments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  /** Confirm and delete a department */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await departmentApi.remove(deleteTarget.id);
      toast.success('Department deleted successfully');
      setDeleteTarget(null);
      fetchDepartments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
      console.error(err);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-IN');
  };

  /** Table column definitions displaying all response fields */
  const columns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Department Name', accessor: 'departmentName' },
    {
      header: 'Description',
      render: (row) => (
        <span className="max-w-[200px] truncate block text-slate-600 text-xs" title={row.description}>
          {row.description || '—'}
        </span>
      ),
    },
    { header: 'Floor', accessor: 'floorNumber' },
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
          {row.status}
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
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-amber-600 transition-colors"
            title="Edit Department"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDeleteTarget(row)}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
            title="Delete Department"
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
            <Building2 className="h-7 w-7 text-blue-600" />
            Manage Departments
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Create, update, and manage hospital departments
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Department
        </button>
      </div>

      {/* ─── Search ─── */}
      <SearchBar
        placeholder="Search departments by name, description, floor, or status..."
        onSearch={(val) => {
          setSearchQuery(val);
          setCurrentPage(1);
        }}
        className="max-w-md"
      />

      {/* ─── Data Table ─── */}
      <DataTable
        columns={columns}
        data={filteredDepartments}
        loading={loading}
        emptyMessage="No departments found"
        pageSize={10}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />

      {/* ─── View Details Modal (GET /api/departments/{id}) ─── */}
      {(viewingDept || loadingDetails) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-5 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                Department Profile Details
              </h3>
              <button
                onClick={() => setViewingDept(null)}
                className="rounded-full p-1 hover:bg-slate-100 text-slate-500 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {loadingDetails ? (
              <LoadingSpinner />
            ) : viewingDept ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 divide-y divide-slate-100 text-sm">
                  {[
                    ['Department ID', `#${viewingDept.id}`],
                    ['Department Name', viewingDept.departmentName],
                    ['Description', viewingDept.description || '—'],
                    ['Floor Number', viewingDept.floorNumber != null ? `#${viewingDept.floorNumber}` : '—'],
                    ['Status', viewingDept.status],
                    ['Created At', formatDate(viewingDept.createdAt)],
                    ['Last Updated At', formatDate(viewingDept.updatedAt)],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between py-2.5 first:pt-0 last:pb-0">
                      <span className="text-slate-500 font-medium text-xs">{label}</span>
                      <span className="font-bold text-slate-800 text-sm">{val || '—'}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setViewingDept(null)}
                  className="w-full rounded-xl bg-slate-800 text-white font-semibold py-2.5 text-sm hover:bg-slate-900 transition-colors"
                >
                  Close
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ─── Create / Edit Modal (POST / PUT /api/departments) ─── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">
                {editingId ? `Edit Department #${editingId}` : 'Add New Department'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Department Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Department Name *</label>
                <input
                  type="text"
                  name="departmentName"
                  value={formData.departmentName}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="e.g. Cardiology"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-none"
                  placeholder="Brief description of the department"
                />
              </div>

              {/* Floor Number & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Floor Number</label>
                  <input
                    type="number"
                    name="floorNumber"
                    value={formData.floorNumber}
                    onChange={handleChange}
                    min={0}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="e.g. 2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="BLOCKED">BLOCKED</option>
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
                  className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {submitting ? 'Saving...' : editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation ─── */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Department"
        message={`Are you sure you want to delete "${deleteTarget?.departmentName}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        variant="danger"
      />
    </div>
  );
}
