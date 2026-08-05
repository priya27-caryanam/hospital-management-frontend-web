import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, DoorClosed } from 'lucide-react';
import toast from 'react-hot-toast';
import roomApi from '../../api/roomApi';
import wardApi from '../../api/wardApi';
import DataTable from '../../components/common/DataTable';

const ROOM_TYPES = ['GENERAL', 'PRIVATE', 'DELUXE', 'ICU', 'ISOLATION'];

export default function ManageRooms() {
  const [rooms, setRooms] = useState([]);
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWardFilter, setSelectedWardFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    roomNumber: '',
    wardId: '',
    roomType: 'GENERAL',
    capacity: 4,
    status: 'AVAILABLE',
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [roomRes, wardRes] = await Promise.all([
        roomApi.getAll(),
        wardApi.getAll(),
      ]);
      setRooms(roomRes.data || []);
      setWards(wardRes.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load rooms or wards');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingRoom(null);
    setForm({
      roomNumber: '',
      wardId: wards[0]?.id ? String(wards[0].id) : '',
      roomType: 'GENERAL',
      capacity: 4,
      status: 'AVAILABLE',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (room) => {
    setEditingRoom(room);
    setForm({
      roomNumber: room.roomNumber || '',
      wardId: room.wardId ? String(room.wardId) : '',
      roomType: room.roomType || 'GENERAL',
      capacity: room.capacity ?? 4,
      status: room.status || 'AVAILABLE',
    });
    setIsModalOpen(true);
  };

  const handleDeleteRoom = async (id, number) => {
    if (!window.confirm(`Are you sure you want to delete Room "${number}"?`)) return;
    try {
      await roomApi.delete(id);
      toast.success(`Room "${number}" deleted successfully`);
      fetchInitialData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete room');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.wardId) return toast.error('Please select a Ward');
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        wardId: Number(form.wardId),
        capacity: Number(form.capacity),
      };
      if (editingRoom) {
        await roomApi.update(editingRoom.id, payload);
        toast.success('Room updated successfully!');
      } else {
        await roomApi.create(payload);
        toast.success('New Room created successfully!');
      }
      setIsModalOpen(false);
      fetchInitialData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save room');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRooms = rooms.filter((r) => {
    const matchesWard = selectedWardFilter === 'ALL' || String(r.wardId) === String(selectedWardFilter);
    const matchesSearch =
      r.roomNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.wardName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.roomType?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesWard && matchesSearch;
  });

  const columns = [
    {
      header: 'Room Number',
      accessor: (row) => <span className="font-bold text-slate-900">{row.roomNumber}</span>,
    },
    {
      header: 'Ward Name',
      accessor: (row) => (
        <span className="font-medium text-blue-600">
          {row.wardName || wards.find((w) => String(w.id) === String(row.wardId))?.wardName || `Ward #${row.wardId}`}
        </span>
      ),
    },
    {
      header: 'Type',
      accessor: (row) => (
        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
          {row.roomType}
        </span>
      ),
    },
    {
      header: 'Capacity & Occupancy',
      accessor: (row) => (
        <div className="text-xs">
          <span className="font-semibold text-slate-700">{row.occupiedBeds ?? 0}</span> / <span className="font-semibold text-slate-500">{row.capacity} Beds Occupied</span>
          <p className="text-[11px] text-emerald-600 font-bold">{row.availableBeds ?? (row.capacity - (row.occupiedBeds ?? 0))} Available</p>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: (row) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
            row.status === 'AVAILABLE'
              ? 'bg-emerald-100 text-emerald-700'
              : row.status === 'FULL' || row.status === 'OCCUPIED'
              ? 'bg-amber-100 text-amber-700'
              : 'bg-rose-100 text-rose-700'
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
            title="Edit Room"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDeleteRoom(row.id, row.roomNumber)}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
            title="Delete Room"
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
            <DoorClosed className="h-6 w-6 text-blue-600" />
            Room Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">Configure rooms per ward, bed capacities, and occupancy status</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 text-xs shadow-sm transition-colors"
        >
          <Plus className="h-4 w-4" /> Add New Room
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search rooms by number, ward, or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="w-full sm:w-64">
          <select
            value={selectedWardFilter}
            onChange={(e) => setSelectedWardFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="ALL">All Wards</option>
            {wards.map((w) => (
              <option key={w.id} value={w.id}>
                {w.wardName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <DataTable columns={columns} data={filteredRooms} loading={loading} emptyMessage="No rooms found." />

      {/* Add / Edit Room Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4 border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900">
              {editingRoom ? 'Edit Hospital Room' : 'Create Hospital Room'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Select Ward *</label>
                <select
                  required
                  value={form.wardId}
                  onChange={(e) => setForm({ ...form, wardId: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                >
                  <option value="">-- Select Ward --</option>
                  {wards.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.wardName} ({w.wardType})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Room Number * (Unique in Ward)</label>
                <input
                  type="text"
                  required
                  value={form.roomNumber}
                  onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
                  placeholder="e.g. 101 or ICU-01"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Room Type *</label>
                  <select
                    value={form.roomType}
                    onChange={(e) => setForm({ ...form, roomType: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs focus:border-blue-500 focus:outline-none"
                  >
                    {ROOM_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Capacity (Beds) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={form.capacity}
                    onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs focus:border-blue-500 focus:outline-none"
                >
                  <option value="AVAILABLE">AVAILABLE</option>
                  <option value="MAINTENANCE">MAINTENANCE</option>
                  <option value="FULL">FULL</option>
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
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingRoom ? 'Update Room' : 'Create Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
