/**
 * Manage Medicines Page (Pharmacist)
 *
 * Implements full CRUD & Inventory Management matching OpenAPI Spec (medicine-controller):
 *   - GET /api/medicines — View all medicines
 *   - GET /api/medicines/{id} — View medicine details by ID
 *   - POST /api/medicines — Create new medicine record
 *   - PUT /api/medicines/{id} — Update existing medicine record
 *   - PUT /api/medicines/{id}/stock — Update medicine stock quantity
 *   - DELETE /api/medicines/{id} — Delete medicine record
 *
 * Swagger Request Schema (POST / PUT):
 *   { medicineName, company, category, description, stockQuantity, price, batchNumber, manufacturingDate, expiryDate }
 *
 * Swagger Response Schema (GET / POST / PUT):
 *   { id, medicineCode, medicineName, company, category, description, stockQuantity, price, batchNumber, manufacturingDate, expiryDate, status }
 */
import { useState, useEffect, useMemo } from 'react';
import { Pill, Plus, RefreshCw, X, Eye, Pencil, Trash2, Tag, Calendar, DollarSign, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import medicineApi from '../../api/medicineApi';
import DataTable from '../../components/common/DataTable';
import SearchBar from '../../components/common/SearchBar';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const CATEGORIES = ['TABLET', 'CAPSULE', 'SYRUP', 'INJECTION', 'OINTMENT', 'DROPS', 'POWDER', 'OTHER'];

const EMPTY_FORM = {
  medicineName: '',
  company: 'Cipla',
  category: 'TABLET',
  description: 'General medicine',
  stockQuantity: '100',
  price: '20.00',
  batchNumber: 'BATCH-001',
  manufacturingDate: new Date().toISOString().split('T')[0],
  expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
};

export default function ManageMedicines() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Form Modal state (Create / Edit)
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Stock Modal state (PUT /api/medicines/{id}/stock)
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedStockMed, setSelectedStockMed] = useState(null);
  const [newStock, setNewStock] = useState('');

  // View Details Modal state (GET /api/medicines/{id})
  const [viewingMed, setViewingMed] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);

  /** Fetch all medicines */
  const fetchMedicines = async () => {
    setLoading(true);
    try {
      const res = await medicineApi.getAll();
      setMedicines(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load medicine catalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  /** Filter medicines by query */
  const filteredMedicines = useMemo(() => {
    if (!searchQuery.trim()) return medicines;
    const q = searchQuery.toLowerCase();
    return medicines.filter(
      (m) =>
        m.medicineName?.toLowerCase().includes(q) ||
        m.medicineCode?.toLowerCase().includes(q) ||
        m.company?.toLowerCase().includes(q) ||
        m.category?.toLowerCase().includes(q) ||
        m.batchNumber?.toLowerCase().includes(q)
    );
  }, [medicines, searchQuery]);

  /** Open Modal for Adding Medicine */
  const openCreateModal = () => {
    setFormData(EMPTY_FORM);
    setEditingId(null);
    setShowModal(true);
  };

  /** Open Modal for Editing Medicine */
  const openEditModal = (m) => {
    setFormData({
      medicineName: m.medicineName || '',
      company: m.company || '',
      category: m.category || 'TABLET',
      description: m.description || '',
      stockQuantity: String(m.stockQuantity ?? 0),
      price: String(m.price ?? 0),
      batchNumber: m.batchNumber || '',
      manufacturingDate: m.manufacturingDate || new Date().toISOString().split('T')[0],
      expiryDate: m.expiryDate || new Date().toISOString().split('T')[0],
    });
    setEditingId(m.id);
    setShowModal(true);
  };

  /** View Details via GET /api/medicines/{id} */
  const handleViewDetails = async (id) => {
    setLoadingDetails(true);
    setViewingMed(null);
    try {
      const res = await medicineApi.getById(id);
      setViewingMed(res.data);
    } catch (err) {
      toast.error('Failed to fetch medicine details');
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  /** Handle Form inputs */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /** Handle Submit Create or Update */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.medicineName || !formData.company || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        medicineName: formData.medicineName.trim(),
        company: formData.company.trim(),
        category: formData.category,
        description: formData.description.trim(),
        stockQuantity: Number(formData.stockQuantity) || 0,
        price: Number(formData.price) || 0,
        batchNumber: formData.batchNumber.trim(),
        manufacturingDate: formData.manufacturingDate,
        expiryDate: formData.expiryDate,
      };

      if (editingId) {
        await medicineApi.update(editingId, payload);
        toast.success('Medicine updated successfully');
      } else {
        await medicineApi.create(payload);
        toast.success('Medicine added successfully');
      }

      setShowModal(false);
      fetchMedicines();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  /** Handle Update Stock (PUT /api/medicines/{id}/stock) */
  const handleUpdateStock = async (e) => {
    e.preventDefault();
    if (!selectedStockMed || newStock === '') return;

    setSubmitting(true);
    try {
      await medicineApi.updateStock(selectedStockMed.id, {
        stockQuantity: Number(newStock),
      });
      toast.success(`Stock updated for ${selectedStockMed.medicineName}`);
      setShowStockModal(false);
      setSelectedStockMed(null);
      setNewStock('');
      fetchMedicines();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to update stock');
    } finally {
      setSubmitting(false);
    }
  };

  /** Confirm Delete (DELETE /api/medicines/{id}) */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await medicineApi.remove(deleteTarget.id);
      toast.success('Medicine record deleted');
      setDeleteTarget(null);
      fetchMedicines();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
      console.error(err);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN');
  };

  /** Columns displaying 100% of key MedicineResponse fields */
  const columns = [
    { header: 'ID', accessor: 'id' },
    {
      header: 'Code',
      render: (row) => (
        <span className="font-semibold text-slate-700 font-mono text-xs">
          {row.medicineCode || `MED-${row.id}`}
        </span>
      ),
    },
    {
      header: 'Medicine Name',
      render: (row) => (
        <span className="font-bold text-slate-900">{row.medicineName}</span>
      ),
    },
    { header: 'Company', accessor: 'company' },
    {
      header: 'Category',
      render: (row) => (
        <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700">
          {row.category}
        </span>
      ),
    },
    {
      header: 'Stock Qty',
      render: (row) => (
        <span className={`font-bold ${row.stockQuantity < 10 ? 'text-red-600' : 'text-emerald-700'}`}>
          {row.stockQuantity}
        </span>
      ),
    },
    {
      header: 'Price (₹)',
      render: (row) => `₹${Number(row.price ?? 0).toFixed(2)}`,
    },
    { header: 'Batch No.', accessor: 'batchNumber' },
    {
      header: 'Expiry Date',
      render: (row) => formatDate(row.expiryDate),
    },
    {
      header: 'Status',
      render: (row) => (
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ${
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
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleViewDetails(row.id)}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setSelectedStockMed(row);
              setNewStock(String(row.stockQuantity ?? 0));
              setShowStockModal(true);
            }}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-emerald-600 transition-colors"
            title="Update Stock"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => openEditModal(row)}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-amber-600 transition-colors"
            title="Edit Medicine"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDeleteTarget(row)}
            className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
            title="Delete Medicine"
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
            <Pill className="h-7 w-7 text-blue-600" />
            Manage Medicine Inventory
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Add new pharmaceuticals, update stock quantities, and manage inventory
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 text-sm transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> Add Medicine
        </button>
      </div>

      {/* ─── Search ─── */}
      <SearchBar
        placeholder="Search medicines by name, code, company, category, or batch..."
        onSearch={(val) => {
          setSearchQuery(val);
          setCurrentPage(1);
        }}
        className="max-w-md"
      />

      {/* ─── Data Table ─── */}
      <DataTable
        columns={columns}
        data={filteredMedicines}
        loading={loading}
        emptyMessage="No medicines found in inventory."
        pageSize={10}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />

      {/* ─── View Details Modal (GET /api/medicines/{id}) ─── */}
      {(viewingMed || loadingDetails) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-5 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Pill className="h-5 w-5 text-blue-600" />
                Medicine Details
              </h3>
              <button
                onClick={() => setViewingMed(null)}
                className="rounded-full p-1 hover:bg-slate-100 text-slate-500 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {loadingDetails ? (
              <LoadingSpinner />
            ) : viewingMed ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 divide-y divide-slate-100 text-sm">
                  {[
                    ['Medicine ID', `#${viewingMed.id}`],
                    ['Medicine Code', viewingMed.medicineCode || `MED-${viewingMed.id}`],
                    ['Medicine Name', viewingMed.medicineName],
                    ['Company', viewingMed.company],
                    ['Category', viewingMed.category],
                    ['Description', viewingMed.description || '—'],
                    ['Stock Quantity', viewingMed.stockQuantity],
                    ['Price (₹)', `₹${Number(viewingMed.price).toFixed(2)}`],
                    ['Batch Number', viewingMed.batchNumber],
                    ['Manufacturing Date', formatDate(viewingMed.manufacturingDate)],
                    ['Expiry Date', formatDate(viewingMed.expiryDate)],
                    ['Status', viewingMed.status],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between py-2.5 first:pt-0 last:pb-0">
                      <span className="text-slate-500 font-medium text-xs">{label}</span>
                      <span className="font-bold text-slate-800 text-sm">{val || '—'}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setViewingMed(null)}
                  className="w-full rounded-xl bg-slate-800 text-white font-semibold py-2.5 text-sm hover:bg-slate-900 transition-colors"
                >
                  Close
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ─── Add / Edit Medicine Modal (POST / PUT /api/medicines) ─── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {editingId ? `Edit Medicine #${editingId}` : 'Add New Medicine'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Medicine Name *</label>
                  <input
                    type="text"
                    name="medicineName"
                    placeholder="e.g. Paracetamol 500mg"
                    value={formData.medicineName}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Company *</label>
                  <input
                    type="text"
                    name="company"
                    placeholder="e.g. Cipla Pharma"
                    value={formData.company}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Batch Number *</label>
                  <input
                    type="text"
                    name="batchNumber"
                    placeholder="e.g. BATCH-101"
                    value={formData.batchNumber}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Stock Qty *</label>
                  <input
                    type="number"
                    min="0"
                    name="stockQuantity"
                    placeholder="100"
                    value={formData.stockQuantity}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    name="price"
                    placeholder="25.50"
                    value={formData.price}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Manufacturing Date *</label>
                  <input
                    type="date"
                    name="manufacturingDate"
                    value={formData.manufacturingDate}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    name="expiryDate"
                    value={formData.expiryDate}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  name="description"
                  placeholder="e.g. Pain reliever and fever reducer"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2 border rounded-xl font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingId ? 'Update Medicine' : 'Add Medicine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Update Stock Modal (PUT /api/medicines/{id}/stock) ─── */}
      {showStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-base font-bold text-slate-900">Update Stock Quantity</h3>
              <button onClick={() => setShowStockModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 font-semibold">{selectedStockMed?.medicineName}</p>

            <form onSubmit={handleUpdateStock} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">New Stock Quantity</label>
                <input
                  type="number"
                  min="0"
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStockModal(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Update Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation ─── */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Medicine Record"
        message={`Are you sure you want to delete "${deleteTarget?.medicineName}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        variant="danger"
      />
    </div>
  );
}
