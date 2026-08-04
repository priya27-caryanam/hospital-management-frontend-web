/**
 * Manage Specializations Page (Admin)
 * Full CRUD & Excel Import operations matching Spring Boot Specialization APIs:
 *   - GET /api/specializations
 *   - POST /api/specializations
 *   - PUT /api/specializations/{id}
 *   - DELETE /api/specializations/{id}
 *   - POST /api/specializations/import
 */
import { useState, useEffect, useMemo } from 'react';
import { Building2, Plus, Pencil, Trash2, Search, X, FileSpreadsheet } from 'lucide-react';
import toast from 'react-hot-toast';
import specializationApi from '../../api/specializationApi';
import departmentApi from '../../api/departmentApi';
import DataTable from '../../components/common/DataTable';
import SearchBar from '../../components/common/SearchBar';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ExcelUploadModal from '../../components/common/ExcelUploadModal';

const EMPTY_FORM = {
  departmentId: '',
  departmentCode: '',
  specializationCode: '',
  specializationName: '',
  status: 'ACTIVE',
};

export default function ManageSpecializations() {
  const [specializations, setSpecializations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Form Modal state
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Excel Import Modal state
  const [showImportModal, setShowImportModal] = useState(false);

  // Delete Target
  const [deleteTarget, setDeleteTarget] = useState(null);

  /** Load specializations and departments */
  const fetchData = async () => {
    setLoading(true);
    try {
      const [specRes, deptRes] = await Promise.all([
        specializationApi.getAll(),
        departmentApi.getAll(),
      ]);
      setSpecializations(specRes.data || []);
      setDepartments(deptRes.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load specializations or departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /** Filter specializations based on search */
  const filteredSpecializations = useMemo(() => {
    if (!searchQuery.trim()) return specializations;
    const q = searchQuery.toLowerCase();
    return specializations.filter(
      (s) =>
        s.specializationCode?.toLowerCase().includes(q) ||
        s.specializationName?.toLowerCase().includes(q) ||
        s.departmentName?.toLowerCase().includes(q) ||
        s.departmentCode?.toLowerCase().includes(q) ||
        s.status?.toLowerCase().includes(q)
    );
  }, [specializations, searchQuery]);

  const handleOpenAdd = () => {
    setFormData(EMPTY_FORM);
    setEditingId(null);
    setShowModal(true);
  };

  const handleOpenEdit = (spec) => {
    // Find department code if missing
    const dept = departments.find((d) => String(d.id) === String(spec.departmentId));
    setFormData({
      departmentId: spec.departmentId || '',
      departmentCode: spec.departmentCode || dept?.departmentCode || dept?.code || '',
      specializationCode: spec.specializationCode || spec.code || '',
      specializationName: spec.specializationName || '',
      status: spec.status || 'ACTIVE',
    });
    setEditingId(spec.id);
    setShowModal(true);
  };

  /** Handle Department Dropdown Selection & Auto-fill Department Code */
  const handleDepartmentChange = (deptId) => {
    const selectedDept = departments.find((d) => String(d.id) === String(deptId));
    setFormData((prev) => ({
      ...prev,
      departmentId: deptId,
      departmentCode: selectedDept ? selectedDept.departmentCode || selectedDept.code || `DEPT-${deptId}` : '',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.departmentId) {
      toast.error('Please select a Department');
      return;
    }
    if (!formData.specializationCode.trim()) {
      toast.error('Specialization Code is required');
      return;
    }
    if (!formData.specializationName.trim() || formData.specializationName.length < 2) {
      toast.error('Specialization Name must be at least 2 characters long');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        departmentId: Number(formData.departmentId),
        departmentCode: formData.departmentCode,
        specializationCode: formData.specializationCode.trim(),
        specializationName: formData.specializationName.trim(),
        status: formData.status || 'ACTIVE',
      };

      if (editingId) {
        await specializationApi.update(editingId, payload);
        toast.success('Specialization updated successfully');
      } else {
        await specializationApi.create(payload);
        toast.success('Specialization created successfully');
      }

      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      const status = err.response?.status;
      const msg = err.response?.data?.message || err.response?.data || err.message;
      if (status === 409) {
        toast.error(`Duplicate Code Conflict: ${msg}`);
      } else {
        toast.error(msg || 'Failed to save specialization');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await specializationApi.remove(deleteTarget.id);
      toast.success('Specialization deleted successfully');
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to delete specialization');
    } finally {
      setDeleteTarget(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-IN');
  };

  /** Specialization Table Columns matching exact requirements */
  const columns = [
    {
      header: 'Specialization Code',
      accessor: 'specializationCode',
      render: (row) => (
        <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg text-xs border border-indigo-100">
          {row.specializationCode || row.code || `SPEC-${row.id}`}
        </span>
      ),
    },
    {
      header: 'Specialization Name',
      accessor: 'specializationName',
      render: (row) => (
        <span className="font-bold text-slate-900">{row.specializationName}</span>
      ),
    },
    {
      header: 'Department',
      accessor: 'departmentName',
      render: (row) => {
        const dept = departments.find((d) => String(d.id) === String(row.departmentId));
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-100">
            <Building2 className="h-3 w-3" />
            {row.departmentName || dept?.departmentName || `Dept #${row.departmentId}`}
          </span>
        );
      },
    },
    {
      header: 'Department Code',
      accessor: 'departmentCode',
      render: (row) => {
        const dept = departments.find((d) => String(d.id) === String(row.departmentId));
        return (
          <span className="font-mono text-xs font-bold text-slate-600">
            {row.departmentCode || dept?.departmentCode || dept?.code || '—'}
          </span>
        );
      },
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            row.status === 'ACTIVE'
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              : 'bg-slate-100 text-slate-700 border border-slate-200'
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenEdit(row)}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors"
            title="Edit Specialization"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDeleteTarget(row)}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
            title="Delete Specialization"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  if (loading) return <LoadingSpinner fullPage />;

  const inputClass =
    'w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="h-7 w-7 text-blue-600" />
            Manage Specializations
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Define, import, and manage medical specializations linked to hospital departments
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Import Excel Button */}
          <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 cursor-pointer"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Import Specializations</span>
          </button>

          {/* Add Specialization Button */}
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Specialization</span>
          </button>
        </div>
      </div>

      {/* Filter & Table Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="w-full sm:w-80">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by code, name, department..."
            />
          </div>
          <span className="text-xs text-slate-500 font-semibold">
            Total Specializations: {filteredSpecializations.length}
          </span>
        </div>

        <DataTable
          columns={columns}
          data={filteredSpecializations}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          emptyMessage="No specializations found."
        />
      </div>

      {/* Excel Import Modal */}
      <ExcelUploadModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        apiMethod={specializationApi.importExcel}
        uploadUrl="/specializations/import"
        buttonText="Import Specializations"
        title="Import Specializations via Excel"
        onSuccess={fetchData}
      />

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {editingId ? 'Edit Specialization' : 'Add Specialization'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Department Selector */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Department <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.departmentId}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                  required
                  className={inputClass}
                >
                  <option value="">-- Select Department --</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.departmentName} (Code: {dept.departmentCode || dept.code || dept.id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Department Code (Read Only) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Department Code <span className="text-xs text-slate-400 font-normal">(Read Only)</span>
                </label>
                <input
                  type="text"
                  value={formData.departmentCode}
                  readOnly
                  disabled
                  placeholder="Auto-populated when department is selected"
                  className="w-full rounded-xl border border-slate-200 bg-slate-100/70 px-4 py-2.5 text-sm font-mono text-slate-700 font-bold cursor-not-allowed"
                />
              </div>

              {/* Specialization Code & Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Specialization Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. CARD-PED"
                    value={formData.specializationCode}
                    onChange={(e) => setFormData((prev) => ({ ...prev, specializationCode: e.target.value }))}
                    required
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Status <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                    required
                    className={inputClass}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Specialization Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pediatric Cardiology"
                  value={formData.specializationName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, specializationName: e.target.value }))}
                  required
                  minLength={2}
                  maxLength={100}
                  className={inputClass}
                />
              </div>

              {/* Form Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Saving...' : editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <ConfirmDialog
          isOpen={!!deleteTarget}
          title="Delete Specialization"
          message={`Are you sure you want to delete "${deleteTarget.specializationName}"? This action cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          isDanger
        />
      )}
    </div>
  );
}
