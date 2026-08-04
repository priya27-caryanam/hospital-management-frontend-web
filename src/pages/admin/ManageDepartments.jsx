/**
 * Manage Departments Page (Admin)
 * Full CRUD & Excel Import operations matching Spring Boot Department APIs:
 *   - GET /api/departments
 *   - POST /api/departments
 *   - PUT /api/departments/{id}
 *   - DELETE /api/departments/{id}
 *   - POST /api/departments/import
 */
import { useState, useEffect, useMemo } from 'react';
import { Plus, Pencil, Trash2, Building2, X, Eye, FileSpreadsheet, UploadCloud } from 'lucide-react';
import toast from 'react-hot-toast';
import departmentApi from '../../api/departmentApi';
import DataTable from '../../components/common/DataTable';
import SearchBar from '../../components/common/SearchBar';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ExcelUploadModal from '../../components/common/ExcelUploadModal';

const EMPTY_FORM = {
  departmentCode: '',
  departmentName: '',
  description: '',
  floorNumber: '',
  status: 'ACTIVE',
};

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

  // View Details Modal state
  const [viewingDept, setViewingDept] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Excel Import Modal state
  const [showImportModal, setShowImportModal] = useState(false);

  // Delete confirmation target
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
        d.departmentCode?.toLowerCase().includes(q) ||
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
      departmentCode: dept.departmentCode || dept.code || '',
      departmentName: dept.departmentName || '',
      description: dept.description || '',
      floorNumber: dept.floorNumber ?? dept.floor ?? '',
      status: dept.status || 'ACTIVE',
    });
    setEditingId(dept.id);
    setShowModal(true);
  };

  /** View Department details */
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

    // Validations
    if (!formData.departmentCode.trim()) {
      toast.error('Department Code is required');
      return;
    }
    if (!formData.departmentName.trim()) {
      toast.error('Department Name is required');
      return;
    }
    if (formData.floorNumber === '' || formData.floorNumber === null || formData.floorNumber === undefined) {
      toast.error('Floor is required');
      return;
    }
    if (!formData.status) {
      toast.error('Status is required');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        departmentCode: formData.departmentCode.trim(),
        departmentName: formData.departmentName.trim(),
        description: formData.description.trim(),
        floorNumber: Number(formData.floorNumber),
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
      console.error(err);
      const status = err.response?.status;
      const msg = err.response?.data?.message || err.response?.data || err.message;

      if (status === 409) {
        toast.error(`Duplicate Department Code or Name: ${msg}`);
      } else {
        toast.error(msg || 'Operation failed');
      }
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
      console.error(err);
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-IN');
  };

  /** Department Table Columns */
  const columns = [
    {
      header: 'Department Code',
      accessor: 'departmentCode',
      render: (row) => (
        <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg text-xs border border-blue-100">
          {row.departmentCode || row.code || `DEPT-${row.id}`}
        </span>
      ),
    },
    {
      header: 'Department Name',
      accessor: 'departmentName',
      render: (row) => <span className="font-bold text-slate-900">{row.departmentName}</span>,
    },
    {
      header: 'Description',
      accessor: 'description',
      render: (row) => (
        <span className="max-w-[200px] truncate block text-slate-600 text-xs" title={row.description}>
          {row.description || '—'}
        </span>
      ),
    },
    {
      header: 'Floor',
      accessor: 'floorNumber',
      render: (row) => (
        <span className="font-semibold text-slate-700">
          Floor {row.floorNumber ?? row.floor ?? '—'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
            row.status === 'ACTIVE'
              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
              : 'bg-slate-100 text-slate-600 border border-slate-200'
          }`}
        >
          {row.status || 'ACTIVE'}
        </span>
      ),
    },
    {
      header: 'Created Date',
      accessor: 'createdAt',
      render: (row) => (
        <span className="text-slate-500 text-xs">{formatDate(row.createdAt)}</span>
      ),
    },
    {
      header: 'Actions',
      accessor: 'id',
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
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="h-7 w-7 text-blue-600" />
            Manage Departments
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Create, import, update, and manage hospital departments
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Import Excel Button */}
          <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Import Departments</span>
          </button>

          {/* Add Department Button */}
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Department</span>
          </button>
        </div>
      </div>

      {/* Search & Data Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <SearchBar
            placeholder="Search by code, name, description, floor, or status..."
            onSearch={(val) => {
              setSearchQuery(val);
              setCurrentPage(1);
            }}
            className="max-w-md"
          />
          <span className="text-xs text-slate-500 font-semibold">
            Total Departments: {filteredDepartments.length}
          </span>
        </div>

        <DataTable
          columns={columns}
          data={filteredDepartments}
          loading={loading}
          emptyMessage="No departments found"
          pageSize={10}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Excel Import Modal */}
      <ExcelUploadModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        apiMethod={departmentApi.importExcel}
        uploadUrl="/departments/import"
        buttonText="Import Departments"
        title="Import Departments via Excel"
        onSuccess={fetchDepartments}
      />

      {/* View Details Modal */}
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
                    ['Department Code', viewingDept.departmentCode || viewingDept.code || '—'],
                    ['Department Name', viewingDept.departmentName],
                    ['Description', viewingDept.description || '—'],
                    ['Floor Number', viewingDept.floorNumber != null ? `Floor ${viewingDept.floorNumber}` : '—'],
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
                  className="w-full rounded-xl bg-slate-800 text-white font-semibold py-2.5 text-sm hover:bg-slate-900 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
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
              {/* Department Code & Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Department Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="departmentCode"
                    value={formData.departmentCode}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="e.g. CARD"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Department Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="departmentName"
                    value={formData.departmentName}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="e.g. Cardiology"
                  />
                </div>
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Floor <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="floorNumber"
                    value={formData.floorNumber}
                    onChange={handleChange}
                    required
                    min={0}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="e.g. 2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Status <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              {/* Submit Buttons */}
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
                  className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {submitting ? 'Saving...' : editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
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
