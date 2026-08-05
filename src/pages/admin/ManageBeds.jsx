import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, BedDouble } from 'lucide-react';
import toast from 'react-hot-toast';
import bedApi from '../../api/bedApi';
import roomApi from '../../api/roomApi';
import wardApi from '../../api/wardApi';
import DataTable from '../../components/common/DataTable';

const BED_STATUS_CLASSES = {
  AVAILABLE: 'bg-emerald-100 text-emerald-700',
  OCCUPIED: 'bg-amber-100 text-amber-700',
  MAINTENANCE: 'bg-slate-100 text-slate-700',
  BLOCKED: 'bg-rose-100 text-rose-700',
};

export default function ManageBeds() {
  const [beds, setBeds] = useState([]);
  const [wards, setWards] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedWardId, setSelectedWardId] = useState('ALL');
  const [selectedRoomId, setSelectedRoomId] = useState('ALL');
  const [availableRoomsForFilter, setAvailableRoomsForFilter] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBed, setEditingBed] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    bedNumber: '',
    bedType: 'Standard Bed',
    roomId: '',
    status: 'AVAILABLE',
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [bedRes, wardRes, roomRes] = await Promise.all([
        bedApi.getAll(),
        wardApi.getAll(),
        roomApi.getAll(),
      ]);
      setBeds(bedRes.data || []);
      setWards(wardRes.data || []);
      setRooms(roomRes.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load beds, rooms, or wards');
    } finally {
      setLoading(false);
    }
  };

  // Update Room dropdown when Ward filter changes
  useEffect(() => {
    if (selectedWardId === 'ALL') {
      setAvailableRoomsForFilter(rooms);
    } else {
      setAvailableRoomsForFilter(rooms.filter((r) => String(r.wardId) === String(selectedWardId)));
    }
    setSelectedRoomId('ALL');
  }, [selectedWardId, rooms]);

  const handleOpenAddModal = () => {
    setEditingBed(null);
    setForm({
      bedNumber: '',
      bedType: 'Standard Bed',
      roomId: rooms[0]?.id ? String(rooms[0].id) : '',
      status: 'AVAILABLE',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (bed) => {
    setEditingBed(bed);
    setForm({
      bedNumber: bed.bedNumber || '',
      bedType: bed.bedType || 'Standard Bed',
      roomId: bed.roomId ? String(bed.roomId) : '',
      status: bed.status || 'AVAILABLE',
    });
    setIsModalOpen(true);
  };

  const handleDeleteBed = async (id, number) => {
    if (!window.confirm(`Are you sure you want to delete Bed "${number}"?`)) return;
    try {
      await bedApi.delete(id);
      toast.success(`Bed "${number}" deleted successfully`);
      fetchInitialData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete bed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.roomId) return toast.error('Please select a Room');
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        roomId: Number(form.roomId),
      };
      if (editingBed) {
        await bedApi.update(editingBed.id, payload);
        toast.success('Bed updated successfully!');
      } else {
        await bedApi.create(payload);
        toast.success('New Bed created successfully!');
      }
      setIsModalOpen(false);
      fetchInitialData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save bed');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredBeds = beds.filter((b) => {
    const matchesWard =
      selectedWardId === 'ALL' || String(b.wardId) === String(selectedWardId);
    const matchesRoom =
      selectedRoomId === 'ALL' || String(b.roomId) === String(selectedRoomId);
    const matchesSearch =
      b.bedNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.roomNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.wardName?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesWard && matchesRoom && matchesSearch;
  });

  const columns = [
    {
      header: 'Bed Number',
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <BedDouble className="h-4 w-4 text-purple-600" />
          <span className="font-bold text-slate-900">{row.bedNumber}</span>
        </div>
      ),
    },
    {
      header: 'Bed Type',
      accessor: (row) => row.bedType || 'Standard Bed',
    },
    {
      header: 'Room Number',
      accessor: (row) => (
        <span className="font-semibold text-slate-800">
          Room {row.roomNumber || rooms.find((r) => String(r.id) === String(row.roomId))?.roomNumber || `#${row.roomId}`}
        </span>
      ),
    },
    {
      header: 'Ward Name',
      accessor: (row) => (
        <span className="font-medium text-blue-600">
          {row.wardName || wards.find((w) => String(w.id) === String(row.wardId))?.wardName || '—'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (row) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
            BED_STATUS_CLASSES[row.status] || 'bg-slate-100 text-slate-700'
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenEditModal(row)}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors"
            title="Edit Bed"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDeleteBed(row.id, row.bedNumber)}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
            title="Delete Bed"
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
            <BedDouble className="h-6 w-6 text-purple-600" />
            Bed Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">Manage individual IPD beds across wards and rooms</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold px-4 py-2.5 text-xs shadow-sm transition-colors"
        >
          <Plus className="h-4 w-4" /> Add New Bed
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search beds..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-sm focus:border-purple-500 focus:outline-none"
          />
        </div>

        <div>
          <select
            value={selectedWardId}
            onChange={(e) => setSelectedWardId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-purple-500 focus:outline-none"
          >
            <option value="ALL">All Wards</option>
            {wards.map((w) => (
              <option key={w.id} value={w.id}>
                {w.wardName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-purple-500 focus:outline-none"
          >
            <option value="ALL">All Rooms</option>
            {availableRoomsForFilter.map((r) => (
              <option key={r.id} value={r.id}>
                Room {r.roomNumber} ({r.wardName || 'Ward'})
              </option>
            ))}
          </select>
        </div>
      </div>

      <DataTable columns={columns} data={filteredBeds} loading={loading} emptyMessage="No hospital beds found." />

      {/* Add / Edit Bed Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4 border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900">
              {editingBed ? 'Edit Hospital Bed' : 'Create Hospital Bed'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Select Room *</label>
                <select
                  required
                  value={form.roomId}
                  onChange={(e) => setForm({ ...form, roomId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-purple-500 focus:outline-none"
                >
                  <option value="">-- Select Room --</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      Room {r.roomNumber} ({r.wardName || 'Ward'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Bed Number * (Unique in Room)</label>
                <input
                  type="text"
                  required
                  value={form.bedNumber}
                  onChange={(e) => setForm({ ...form, bedNumber: e.target.value })}
                  placeholder="e.g. B-101 or BED-01"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Bed Type</label>
                <input
                  type="text"
                  value={form.bedType}
                  onChange={(e) => setForm({ ...form, bedType: e.target.value })}
                  placeholder="e.g. Standard, ICU Bed, Electric Bed"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Bed Status *</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-purple-500 focus:outline-none"
                >
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="OCCUPIED">OCCUPIED</option>
                  <option value="MAINTENANCE">MAINTENANCE</option>
                  <option value="BLOCKED">BLOCKED</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold px-5 py-2 shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingBed ? 'Update Bed' : 'Create Bed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
