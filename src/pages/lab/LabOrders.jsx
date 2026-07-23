/**
 * Lab Orders Queue Page & Lab Tests Catalog
 *
 * Implements:
 *   - Lab Orders Workflow
 *   - POST /api/lab-technicians/payment/{labOrderId} — Process Lab Order Payment
 *   - GET /api/lab-technicians/receipt/{labOrderId} — View Lab Order Receipt
 *   - Full Lab Test Catalog Management (lab-test-controller):
 *       GET /api/lab-tests, GET /api/lab-tests/{id}, POST /api/lab-tests,
 *       PUT /api/lab-tests/{id}, DELETE /api/lab-tests/{id}
 */
import { useState, useEffect } from 'react';
import {
  TestTube,
  Clock,
  CheckCircle,
  Upload,
  Filter,
  FlaskConical,
  CreditCard,
  Receipt,
  Plus,
  Pencil,
  Trash2,
  Eye,
  X,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import labOrderApi from '../../api/labOrderApi';
import labTechnicianApi from '../../api/labTechnicianApi';
import labTestApi from '../../api/labTestApi';
import DataTable from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useNavigate } from 'react-router-dom';

const STATUS_STYLES = {
  PENDING:          'bg-amber-100 text-amber-800 border-amber-200',
  SAMPLE_COLLECTED: 'bg-purple-100 text-purple-800 border-purple-200',
  IN_PROGRESS:      'bg-blue-100 text-blue-800 border-blue-200',
  COMPLETED:        'bg-emerald-100 text-emerald-800 border-emerald-200',
  CANCELLED:        'bg-rose-100 text-rose-800 border-rose-200',
};

const EMPTY_LAB_TEST = { testName: '', description: '', price: '' };

export default function LabOrders() {
  const navigate = useNavigate();

  // Active Tab: 'orders' or 'tests'
  const [activeView, setActiveView] = useState('orders');

  // Lab Orders state
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState('PENDING');
  const [updatingId, setUpdatingId] = useState(null);

  // Payment Modal state (POST /api/lab-technicians/payment/{labOrderId})
  const [paymentOrderId, setPaymentOrderId] = useState(null);
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [paymentResult, setPaymentResult] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Receipt Modal state (GET /api/lab-technicians/receipt/{labOrderId})
  const [receiptOrderId, setReceiptOrderId] = useState(null);
  const [receiptData, setReceiptData] = useState(null);
  const [loadingReceipt, setLoadingReceipt] = useState(false);

  // Lab Tests Catalog state (lab-test-controller)
  const [labTests, setLabTests] = useState([]);
  const [loadingTests, setLoadingTests] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [testForm, setTestForm] = useState(EMPTY_LAB_TEST);
  const [editingTestId, setEditingTestId] = useState(null);
  const [submittingTest, setSubmittingTest] = useState(false);
  const [viewingTest, setViewingTest] = useState(null);
  const [deleteTestTarget, setDeleteTestTarget] = useState(null);

  const fetchOrders = async (status) => {
    setLoading(true);
    try {
      const res = await labOrderApi.getByStatus(status);
      setOrders(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load lab orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchLabTests = async () => {
    setLoadingTests(true);
    try {
      const res = await labTestApi.getAll();
      setLabTests(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load lab tests catalog');
    } finally {
      setLoadingTests(false);
    }
  };

  useEffect(() => {
    if (activeView === 'orders') {
      fetchOrders(activeStatus);
    } else {
      fetchLabTests();
    }
  }, [activeView, activeStatus]);

  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await labOrderApi.updateStatus(orderId, newStatus);
      toast.success(`Lab Order #${orderId} marked as ${newStatus}`);
      fetchOrders(activeStatus);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  /** Process Payment via POST /api/lab-technicians/payment/{labOrderId} */
  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!paymentOrderId) return;

    setProcessingPayment(true);
    try {
      const res = await labTechnicianApi.processPayment(paymentOrderId, { paymentMode });
      setPaymentResult(res.data);
      toast.success('Lab order payment processed successfully');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Payment processing failed');
    } finally {
      setProcessingPayment(false);
    }
  };

  /** View Receipt via GET /api/lab-technicians/receipt/{labOrderId} */
  const handleViewReceipt = async (orderId) => {
    setReceiptOrderId(orderId);
    setLoadingReceipt(true);
    setReceiptData(null);
    try {
      const res = await labTechnicianApi.getReceipt(orderId);
      setReceiptData(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Receipt not found for this lab order.');
    } finally {
      setLoadingReceipt(false);
    }
  };

  /** Handle Lab Test Create / Edit Submit */
  const handleTestSubmit = async (e) => {
    e.preventDefault();
    if (!testForm.testName.trim()) {
      toast.error('Test name is required');
      return;
    }

    setSubmittingTest(true);
    try {
      const payload = {
        testName: testForm.testName.trim(),
        description: testForm.description.trim(),
        price: testForm.price ? Number(testForm.price) : 0,
      };

      if (editingTestId) {
        await labTestApi.update(editingTestId, payload);
        toast.success('Lab test updated successfully');
      } else {
        await labTestApi.create(payload);
        toast.success('Lab test created successfully');
      }

      setShowTestModal(false);
      fetchLabTests();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setSubmittingTest(false);
    }
  };

  /** Handle Delete Lab Test */
  const handleDeleteTest = async () => {
    if (!deleteTestTarget) return;
    try {
      await labTestApi.remove(deleteTestTarget.id);
      toast.success('Lab test deleted successfully');
      setDeleteTestTarget(null);
      fetchLabTests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-IN');
  };

  /** Orders Columns */
  const orderColumns = [
    { header: 'Order ID', accessor: 'id' },
    { header: 'Appt ID', accessor: 'appointmentId' },
    { header: 'Test Name', accessor: 'labTestName' },
    {
      header: 'Priority',
      render: (row) => (
        <span className={`font-bold text-xs uppercase ${row.priority === 'URGENT' ? 'text-rose-600' : 'text-slate-700'}`}>
          {row.priority}
        </span>
      ),
    },
    { header: 'Clinical Notes', accessor: 'clinicalNotes' },
    {
      header: 'Status',
      render: (row) => (
        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase ${STATUS_STYLES[row.status] || 'bg-slate-100 text-slate-700'}`}>
          {row.status?.replace('_', ' ')}
        </span>
      ),
    },
    {
      header: 'Actions',
      render: (row) => {
        const isUpdating = updatingId === row.id;
        return (
          <div className="flex items-center gap-2 flex-wrap">
            {row.status === 'PENDING' && (
              <button
                disabled={isUpdating}
                onClick={() => handleStatusUpdate(row.id, 'SAMPLE_COLLECTED')}
                className="rounded-lg bg-purple-600 hover:bg-purple-700 text-white px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50"
              >
                Collect Sample
              </button>
            )}
            {row.status === 'SAMPLE_COLLECTED' && (
              <button
                disabled={isUpdating}
                onClick={() => handleStatusUpdate(row.id, 'IN_PROGRESS')}
                className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50"
              >
                Start Test
              </button>
            )}
            {row.status === 'IN_PROGRESS' && (
              <button
                disabled={isUpdating}
                onClick={() => handleStatusUpdate(row.id, 'COMPLETED')}
                className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50"
              >
                Complete
              </button>
            )}
            {(row.status === 'IN_PROGRESS' || row.status === 'COMPLETED') && (
              <button
                onClick={() => navigate('/lab/reports')}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-2.5 py-1 text-xs font-medium transition-colors"
              >
                <Upload className="h-3 w-3" /> Report
              </button>
            )}

            <button
              onClick={() => {
                setPaymentOrderId(row.id);
                setPaymentResult(null);
                setPaymentMode('CASH');
              }}
              className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2.5 py-1 text-xs font-medium transition-colors"
            >
              <CreditCard className="h-3 w-3" /> Pay
            </button>
            <button
              onClick={() => handleViewReceipt(row.id)}
              className="inline-flex items-center gap-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 text-xs font-medium transition-colors"
            >
              <Receipt className="h-3 w-3" /> Receipt
            </button>
          </div>
        );
      },
    },
  ];

  /** Lab Tests Catalog Columns (lab-test-controller) */
  const testColumns = [
    { header: 'ID', accessor: 'id' },
    {
      header: 'Test Name',
      render: (row) => <span className="font-bold text-slate-900">{row.testName}</span>,
    },
    {
      header: 'Description',
      render: (row) => (
        <span className="text-slate-600 text-xs truncate max-w-[200px] block" title={row.description}>
          {row.description || '—'}
        </span>
      ),
    },
    {
      header: 'Price (₹)',
      render: (row) => `₹${Number(row.price ?? 0).toFixed(2)}`,
    },
    {
      header: 'Active',
      render: (row) => (
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${row.active !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
          {row.active !== false ? 'Active' : 'Inactive'}
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
            onClick={async () => {
              try {
                const res = await labTestApi.getById(row.id);
                setViewingTest(res.data);
              } catch (e) {
                toast.error('Failed to load test details');
              }
            }}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-blue-600"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setTestForm({
                testName: row.testName || '',
                description: row.description || '',
                price: String(row.price ?? 0),
              });
              setEditingTestId(row.id);
              setShowTestModal(true);
            }}
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-indigo-600"
            title="Edit Test"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDeleteTestTarget(row)}
            className="rounded-lg p-1 text-slate-500 hover:bg-red-50 hover:text-red-600"
            title="Delete Test"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* ─── Header & Top View Switcher ─── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FlaskConical className="h-7 w-7 text-blue-600" />
            Laboratory Management
          </h1>
          <p className="text-sm text-slate-500">Diagnostic test orders queue & test catalog master list</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveView('orders')}
            className={`rounded-lg px-4 py-2 text-xs font-bold transition-all ${
              activeView === 'orders' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Lab Orders Queue
          </button>
          <button
            onClick={() => setActiveView('tests')}
            className={`rounded-lg px-4 py-2 text-xs font-bold transition-all ${
              activeView === 'tests' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Lab Test Catalog
          </button>
        </div>
      </div>

      {/* ─── View 1: Lab Orders Queue ─── */}
      {activeView === 'orders' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2 flex-wrap">
            <Filter className="h-4 w-4 text-slate-400 mr-1" />
            {['PENDING', 'SAMPLE_COLLECTED', 'IN_PROGRESS', 'COMPLETED'].map((status) => (
              <button
                key={status}
                onClick={() => setActiveStatus(status)}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                  activeStatus === status
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>

          <DataTable
            columns={orderColumns}
            data={orders}
            loading={loading}
            emptyMessage={`No lab orders in ${activeStatus.replace('_', ' ')} status.`}
          />
        </div>
      )}

      {/* ─── View 2: Lab Test Catalog (lab-test-controller) ─── */}
      {activeView === 'tests' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => {
                setTestForm(EMPTY_LAB_TEST);
                setEditingTestId(null);
                setShowTestModal(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 text-xs transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" /> Add Lab Test
            </button>
          </div>

          <DataTable
            columns={testColumns}
            data={labTests}
            loading={loadingTests}
            emptyMessage="No lab tests registered in catalog."
          />
        </div>
      )}

      {/* ─── Process Payment Modal (POST /api/lab-technicians/payment/{labOrderId}) ─── */}
      {paymentOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-indigo-600" />
                Process Payment for Lab Order #{paymentOrderId}
              </h3>
              <button onClick={() => setPaymentOrderId(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleProcessPayment} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Select Payment Mode</label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  <option value="CASH">CASH</option>
                  <option value="UPI">UPI</option>
                  <option value="CARD">CARD</option>
                  <option value="NET_BANKING">NET BANKING</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentOrderId(null)}
                  className="px-4 py-2 border rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingPayment}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50"
                >
                  {processingPayment ? 'Processing...' : 'Submit Payment'}
                </button>
              </div>
            </form>

            {/* Payment Response (100% PaymentResponse Mapping) */}
            {paymentResult && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-2 text-xs">
                <p className="font-bold text-emerald-800 text-sm">Payment Successful!</p>
                <div className="grid grid-cols-2 gap-2 text-slate-700 pt-2 border-t border-emerald-100">
                  <div><span className="text-slate-400 font-medium">Payment ID:</span> #{paymentResult.paymentId}</div>
                  <div><span className="text-slate-400 font-medium">Amount:</span> ₹{paymentResult.amount}</div>
                  <div><span className="text-slate-400 font-medium">Mode:</span> {paymentResult.paymentMode}</div>
                  <div><span className="text-slate-400 font-medium">Status:</span> {paymentResult.paymentStatus}</div>
                  <div><span className="text-slate-400 font-medium">Txn ID:</span> {paymentResult.transactionId || '—'}</div>
                  <div><span className="text-slate-400 font-medium">Receipt #:</span> {paymentResult.receiptNumber || '—'}</div>
                  <div className="col-span-2"><span className="text-slate-400 font-medium">Date:</span> {formatDate(paymentResult.paymentDate)}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── View Receipt Modal (GET /api/lab-technicians/receipt/{labOrderId}) ─── */}
      {receiptOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="h-5 w-5 text-blue-600" />
                Receipt for Lab Order #{receiptOrderId}
              </h3>
              <button onClick={() => setReceiptOrderId(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {loadingReceipt ? (
              <LoadingSpinner />
            ) : receiptData ? (
              <div className="space-y-3 text-xs">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 divide-y divide-slate-100">
                  {[
                    ['Receipt Number', receiptData.receiptNumber || '—'],
                    ['Transaction ID', receiptData.transactionId || '—'],
                    ['Amount', `₹${receiptData.amount}`],
                    ['Payment Mode', receiptData.paymentMode],
                    ['Payment Type', receiptData.paymentType || 'LAB_TEST'],
                    ['Payment Status', receiptData.paymentStatus],
                    ['Payment Date', formatDate(receiptData.paymentDate)],
                  ].map(([lbl, val]) => (
                    <div key={lbl} className="flex justify-between py-2 first:pt-0 last:pb-0">
                      <span className="text-slate-500 font-medium">{lbl}</span>
                      <span className="font-bold text-slate-800">{val}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setReceiptOrderId(null)}
                  className="w-full rounded-xl bg-slate-800 text-white font-semibold py-2 text-xs"
                >
                  Close
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ─── Add / Edit Lab Test Modal (POST / PUT /api/lab-tests) ─── */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingTestId ? `Edit Lab Test #${editingTestId}` : 'Add New Lab Test'}
              </h3>
              <button onClick={() => setShowTestModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleTestSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Test Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Complete Blood Count (CBC)"
                  value={testForm.testName}
                  onChange={(e) => setTestForm((prev) => ({ ...prev, testName: e.target.value }))}
                  required
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Brief description of the diagnostic test"
                  value={testForm.description}
                  onChange={(e) => setTestForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Price (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="500.00"
                  value={testForm.price}
                  onChange={(e) => setTestForm((prev) => ({ ...prev, price: e.target.value }))}
                  required
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowTestModal(false)}
                  className="px-4 py-2 border rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTest}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm disabled:opacity-50"
                >
                  {submittingTest ? 'Saving...' : editingTestId ? 'Update Test' : 'Add Test'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── View Lab Test Details Modal (GET /api/lab-tests/{id}) ─── */}
      {viewingTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-slate-900">Lab Test Profile Details</h3>
              <button onClick={() => setViewingTest(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 divide-y divide-slate-100 text-xs">
              {[
                ['Test ID', `#${viewingTest.id}`],
                ['Test Name', viewingTest.testName],
                ['Description', viewingTest.description || '—'],
                ['Price', `₹${Number(viewingTest.price).toFixed(2)}`],
                ['Active', viewingTest.active !== false ? 'Active' : 'Inactive'],
                ['Created At', formatDate(viewingTest.createdAt)],
                ['Last Updated At', formatDate(viewingTest.updatedAt)],
              ].map(([lbl, val]) => (
                <div key={lbl} className="flex justify-between py-2 first:pt-0 last:pb-0">
                  <span className="text-slate-500 font-medium">{lbl}</span>
                  <span className="font-bold text-slate-800">{val}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setViewingTest(null)}
              className="w-full rounded-xl bg-slate-800 text-white font-semibold py-2 text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ─── Delete Lab Test Confirmation ─── */}
      <ConfirmDialog
        isOpen={!!deleteTestTarget}
        title="Delete Lab Test"
        message={`Are you sure you want to delete "${deleteTestTarget?.testName}"?`}
        onConfirm={handleDeleteTest}
        onCancel={() => setDeleteTestTarget(null)}
        variant="danger"
      />
    </div>
  );
}
