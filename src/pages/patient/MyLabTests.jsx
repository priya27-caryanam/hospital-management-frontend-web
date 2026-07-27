/**
 * Patient My Lab Tests Page
 * Lists diagnostic lab orders requested for the patient.
 * Endpoint: GET /api/lab-orders/patient/{patientId}
 */
import { useState, useEffect, useMemo } from 'react';
import { TestTube, Search, Eye, X, Clock, AlertCircle, FileText, FlaskConical } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import labOrderApi from '../../api/labOrderApi';
import DataTable from '../../components/common/DataTable';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const STATUS_BADGES = {
  ORDERED: 'bg-blue-100 text-blue-800 border-blue-200',
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  SAMPLE_COLLECTED: 'bg-purple-100 text-purple-800 border-purple-200',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  COMPLETED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  CANCELLED: 'bg-rose-100 text-rose-800 border-rose-200',
};

export default function MyLabTests() {
  const { user } = useAuth();
  const [labOrders, setLabOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      const patientId = user?.patientId || user?.userId || user?.id;
      if (!patientId) return;
      setLoading(true);
      try {
        const res = await labOrderApi.getByPatient(patientId);
        setLabOrders(res.data || []);
      } catch (err) {
        console.error('Failed to fetch patient lab orders:', err);
        toast.error('Failed to load lab tests');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

  const filteredOrders = useMemo(() => {
    return labOrders.filter((order) => {
      // Filter by status tab
      if (activeFilter !== 'ALL') {
        const st = (order.status || 'ORDERED').toUpperCase();
        if (activeFilter === 'PENDING' && st !== 'ORDERED' && st !== 'PENDING') return false;
        if (activeFilter === 'IN_PROGRESS' && st !== 'IN_PROGRESS' && st !== 'SAMPLE_COLLECTED') return false;
        if (activeFilter === 'COMPLETED' && st !== 'COMPLETED') return false;
      }
      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const testName = (order.testName || order.labTestName || '').toLowerCase();
        const docName = (order.doctorName || '').toLowerCase();
        const apptId = String(order.appointmentId || '');
        const id = String(order.id || '');
        return testName.includes(q) || docName.includes(q) || apptId.includes(q) || id.includes(q);
      }
      return true;
    });
  }, [labOrders, activeFilter, searchQuery]);

  const columns = [
    {
      header: 'Order ID',
      accessor: 'id',
      render: (row) => <span className="font-mono text-xs font-bold text-slate-700">#{row.id}</span>,
    },
    {
      header: 'Appointment ID',
      accessor: 'appointmentId',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-blue-600">#{row.appointmentId || '—'}</span>
      ),
    },
    {
      header: 'Doctor Name',
      accessor: 'doctorName',
      render: (row) => (
        <span className="font-semibold text-slate-800 text-xs">
          {row.doctorName ? `Dr. ${row.doctorName}` : `Doctor #${row.doctorId}`}
        </span>
      ),
    },
    {
      header: 'Lab Test Name',
      accessor: 'testName',
      render: (row) => (
        <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
          <FlaskConical className="h-3.5 w-3.5 text-indigo-600" />
          {row.testName || row.labTestName || `Lab Test #${row.labTestId}`}
        </span>
      ),
    },
    {
      header: 'Ordered Date',
      accessor: 'createdAt',
      render: (row) => (
        <span className="text-xs text-slate-600 font-medium">
          {row.orderDate || row.createdAt ? new Date(row.orderDate || row.createdAt).toLocaleString('en-IN') : '—'}
        </span>
      ),
    },
    {
      header: 'Priority',
      accessor: 'priority',
      render: (row) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
            row.priority === 'URGENT'
              ? 'bg-rose-100 text-rose-700 border border-rose-200'
              : 'bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          {row.priority || 'NORMAL'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => {
        const st = row.status || 'ORDERED';
        return (
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
              STATUS_BADGES[st] || 'bg-slate-100 text-slate-700'
            }`}
          >
            {st.replace('_', ' ')}
          </span>
        );
      },
    },
    {
      header: 'Actions',
      render: (row) => (
        <button
          onClick={() => setSelectedOrder(row)}
          className="inline-flex items-center gap-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 text-xs font-semibold transition-colors"
        >
          <Eye className="h-3.5 w-3.5" />
          View Details
        </button>
      ),
    },
  ];

  if (loading && labOrders.length === 0) return <LoadingSpinner fullPage />;

  const inputClass =
    'w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <TestTube className="h-7 w-7 text-indigo-600" />
          My Lab Tests
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          View and track diagnostic lab tests ordered by your consulting physicians
        </p>
      </div>

      {/* Filter Tabs & Search Bar Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by test name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex items-center rounded-xl bg-slate-100 p-1 self-start sm:self-auto">
            {['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                  activeFilter === tab
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab === 'ALL' ? 'All' : tab === 'PENDING' ? 'Pending' : tab === 'IN_PROGRESS' ? 'In Progress' : 'Completed'}
              </button>
            ))}
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredOrders}
          emptyMessage="No laboratory tests found."
        />
      </div>

      {/* View Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <FlaskConical className="h-5 w-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900">Lab Order Details #{selectedOrder.id}</h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-400 font-medium">Test Name</span>
                <span className="font-bold text-slate-800">{selectedOrder.testName || selectedOrder.labTestName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-400 font-medium">Doctor</span>
                <span className="font-bold text-slate-800">
                  {selectedOrder.doctorName ? `Dr. ${selectedOrder.doctorName}` : `Doctor #${selectedOrder.doctorId}`}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-400 font-medium">Appointment ID</span>
                <span className="font-bold text-blue-600">#{selectedOrder.appointmentId}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-400 font-medium">Priority</span>
                <span className="font-bold text-slate-800">{selectedOrder.priority || 'NORMAL'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-400 font-medium">Status</span>
                <span className="font-bold text-indigo-700">{selectedOrder.status}</span>
              </div>

              {selectedOrder.clinicalNotes && (
                <div className="space-y-1">
                  <span className="text-slate-400 font-medium">Clinical Notes:</span>
                  <p className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 text-slate-700">
                    {selectedOrder.clinicalNotes}
                  </p>
                </div>
              )}

              {selectedOrder.instructions && (
                <div className="space-y-1">
                  <span className="text-slate-400 font-medium">Instructions:</span>
                  <p className="bg-blue-50/60 p-2.5 rounded-xl border border-blue-100 text-blue-800 font-medium">
                    {selectedOrder.instructions}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
