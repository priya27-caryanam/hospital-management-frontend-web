import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Building2, CheckCircle2, XCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import wardApi from '../../api/wardApi';
import DataTable from '../../components/common/DataTable';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const WARD_TYPES = ['GENERAL', 'PRIVATE', 'ICU', 'NICU', 'PICU', 'CCU', 'EMERGENCY'];

export default function ManageWards() {
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWard, setEditingWard] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    wardName: '',
    wardCode: '',
    wardType: 'GENERAL',
    floor: 1,
    totalRooms: 5,
    description: '',
    status: 'ACTIVE',
    active: true,
  });

  useEffect(() => {
    fetchWards();
  }, []);

  const fetchWards = async () => {
    setLoading(true);
    try {
      const res = await wardApi.getAll();
      setWards(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load wards list');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingWard(null);
    setForm({
      wardName: '',
      wardCode: '',
      wardType: 'GENERAL',
      floor: 1,
      totalRooms: 5,
      description: '',
      status: 'ACTIVE',
      active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (ward) => {
    setEditingWard(ward);
    setForm({
      wardName: ward.wardName || '',
      wardCode: ward.wardCode || '',
      wardType: ward.wardType || 'GENERAL',
      floor: ward.floor ?? 1,
      totalRooms: ward.totalRooms ?? 5,
      description: ward.description || '',
      status: ward.status || 'ACTIVE',
      active: ward.active ?? true,
    });
    setIsModalOpen(true);
  };

  const handleDeleteWard = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete Ward "${name}"?`)) return;
    try {
      await wardApi.delete(id);
      toast.success(`Ward "${name}" deleted successfully`);
      fetchWards();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete ward');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingWard) {
        await wardApi.update(editingWard.id, form);
        toast.success('Ward updated successfully!');
      } else {
        await wardApi.create(form);
        toast.success('New Ward created successfully!');
      }
      setIsModalOpen(false);
      fetchWards();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save ward');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredWards = wards.filter(
    (w) =>
      w.wardName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.wardCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.wardType?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    {
      header: 'Ward Name / Code',
      accessor: (row) => (
        <div>
          <p className="font-bold text-slate-900">{row.wardName}</p>
          <p className="text-xs text-blue-600 font-mono font-semibold">{row.wardCode}</p>
        </div>
      ),
    },
    {
      header: 'Type',
      accessor: (row) => (
        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
          {row.wardType}
        </span>
      ),
    },
    {
      header: 'Floor',
      accessor: (row) => `Floor ${row.floor}`,
    },
    {
      header: 'Rooms Count',
      accessor: (row) => `${row.rooms?.length || row.totalRooms || 0} Rooms`,
    },
    {
      header: 'Status',
      accessor: (row) => (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
            row.status === 'ACTIVE' || row.active
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-rose-100 text-rose-700'
          }`}
        >
          {row.status === 'ACTIVE' || row.active ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
          {row.status || (row.active ? 'ACTIVE' : 'INACTIVE')}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenEditModal(row)}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors cursor-pointer"
            title="Edit Ward"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDeleteWard(row.id, row.wardName)}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
            title="Delete Ward"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="h-6 w-6 text-blue-600" />
            Ward Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">Configure hospital wards, codes, floors, and room allocations</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 text-xs shadow-sm transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Add New Ward
        </button>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search wards by name, code, or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>
      </div>

      <DataTable columns={columns} data={filteredWards} loading={loading} emptyMessage="No hospital wards found." />

      {/* Add / Edit Ward Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {editingWard ? 'Edit Hospital Ward' : 'Create Hospital Ward'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Ward Name *</label>
                <input
                  type="text"
                  required
                  value={form.wardName}
                  onChange={(e) => setForm({ ...form, wardName: e.target.value })}
                  placeholder="e.g. General IPD Ward A"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Ward Code * (Unique)</label>
                <input
                  type="text"
                  required
                  value={form.wardCode}
                  onChange={(e) => setForm({ ...form, wardCode: e.target.value.toUpperCase() })}
                  placeholder="e.g. WARD-GEN-A"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-mono font-bold focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Ward Type *</label>
                  <select
                    value={form.wardType}
                    onChange={(e) => setForm({ ...form, wardType: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs focus:border-blue-500 focus:outline-none"
                  >
                    {WARD_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Floor Number *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={form.floor}
                    onChange={(e) => setForm({ ...form, floor: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Total Rooms *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.totalRooms}
                    onChange={(e) => setForm({ ...form, totalRooms: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value, active: e.target.value === 'ACTIVE' })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs focus:border-blue-500 focus:outline-none"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Ward notes and description..."
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Saving...' : editingWard ? 'Update Ward' : 'Create Ward'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
