/**
 * Lab Reports Management Page (Lab Technician)
 * Synchronized with Backend OpenAPI Specification & Hospital Workflow.
 *
 * Implements:
 *   - GET /api/lab-orders/status?status=X — Retrieve lab orders queue
 *   - POST /api/lab-reports/upload?labOrderId={labOrderId}&report={report} — Upload diagnostic lab report
 *   - GET /api/lab-reports/order/{labOrderId} — Retrieve diagnostic report details
 *   - GET /api/dashboard/lab — Keep dashboard cards 100% synchronized
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  TestTube,
  Upload,
  Search,
  FileText,
  CheckCircle2,
  Clock,
  FlaskConical,
  Filter,
  Eye,
  X,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import labOrderApi from '../../api/labOrderApi';
import labReportApi, { downloadReportFile } from '../../api/labReportApi';
import dashboardApi from '../../api/dashboardApi';
import DataTable from '../../components/common/DataTable';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const STATUS_BADGES = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  SAMPLE_COLLECTED: 'bg-purple-100 text-purple-800 border-purple-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-800 border-blue-200',
  COMPLETED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  CANCELLED: 'bg-rose-100 text-rose-800 border-rose-200',
};

export default function LabReports() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'ALL';

  const [activeTab, setActiveTab] = useState(initialStatus); // 'ALL' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState(null);

  // Upload Modal State
  const [uploadModalOrder, setUploadModalOrder] = useState(null);
  const [reportRemarks, setReportRemarks] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // View Report Modal State
  const [viewReportOrder, setViewReportOrder] = useState(null);
  const [viewReportData, setViewReportData] = useState(null);
  const [loadingReportData, setLoadingReportData] = useState(false);

  // Sync activeTab when query param changes
  useEffect(() => {
    const s = searchParams.get('status');
    if (s && s !== activeTab) {
      setActiveTab(s);
    }
  }, [searchParams]);

  /** Fetch dashboard stats to ensure exact 1-to-1 sync */
  const fetchStats = useCallback(async () => {
    try {
      const res = await dashboardApi.getLabStats();
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load lab stats:', err);
    }
  }, []);

  /** Fetch lab orders from backend source */
  const fetchLabOrders = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (activeTab === 'PENDING') {
        res = await labOrderApi.getByStatus('PENDING');
      } else if (activeTab === 'IN_PROGRESS') {
        res = await labOrderApi.getByStatus('IN_PROGRESS');
      } else if (activeTab === 'COMPLETED') {
        res = await labOrderApi.getByStatus('COMPLETED');
      } else {
        // Fetch PENDING, SAMPLE_COLLECTED, IN_PROGRESS, COMPLETED
        const [pendingRes, progressRes, completedRes] = await Promise.all([
          labOrderApi.getByStatus('PENDING').catch(() => ({ data: [] })),
          labOrderApi.getByStatus('IN_PROGRESS').catch(() => ({ data: [] })),
          labOrderApi.getByStatus('COMPLETED').catch(() => ({ data: [] })),
        ]);
        const combined = [
          ...(pendingRes.data || []),
          ...(progressRes.data || []),
          ...(completedRes.data || []),
        ];
        // Deduplicate by ID
        const uniqueMap = new Map();
        combined.forEach((item) => uniqueMap.set(item.id, item));
        res = { data: Array.from(uniqueMap.values()) };
      }
      setOrders(res.data || []);
      fetchStats();
    } catch (err) {
      console.error('Failed to load lab orders:', err);
      toast.error('Failed to load lab orders queue');
    } finally {
      setLoading(false);
    }
  }, [activeTab, fetchStats]);

  useEffect(() => {
    fetchLabOrders();
  }, [fetchLabOrders]);

  /** Handle Tab Change */
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ status: tab });
  };

  /** Handle Upload Submission (POST /api/lab-reports/upload) */
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadModalOrder || !uploadFile) {
      toast.error('Please select a report file to upload');
      return;
    }

    setUploading(true);
    try {
      await labReportApi.upload(
        uploadModalOrder.id,
        reportRemarks.trim() || 'Diagnostic Lab Report',
        uploadFile
      );

      // Backend status update if required
      try {
        await labOrderApi.updateStatus(uploadModalOrder.id, 'COMPLETED');
      } catch (stErr) {
        // Status may already be auto-updated by backend upload controller
      }

      toast.success(`Lab Report for Order #${uploadModalOrder.id} uploaded successfully!`);
      setUploadModalOrder(null);
      setReportRemarks('');
      setUploadFile(null);

      // Auto refresh required data
      fetchLabOrders();
    } catch (err) {
      console.error('Upload failed:', err);
      toast.error(err.response?.data?.message || 'Failed to upload report');
    } finally {
      setUploading(false);
    }
  };

  /** Open View Report Modal (GET /api/lab-reports/order/{labOrderId}) */
  const handleOpenViewReport = async (order) => {
    setViewReportOrder(order);
    setLoadingReportData(true);
    setViewReportData(null);
    try {
      const res = await labReportApi.getByLabOrder(order.id);
      setViewReportData(res.data);
    } catch (err) {
      console.warn('Report details not yet uploaded for order:', order.id);
    } finally {
      setLoadingReportData(false);
    }
  };

  /** Filtered Orders by Search Query */
  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const q = searchQuery.toLowerCase().trim();
    return orders.filter((o) => {
      const idStr = String(o.id || '');
      const apptStr = String(o.appointmentId || '');
      const testName = (o.testName || o.labTestName || '').toLowerCase();
      const patientName = (o.patientName || '').toLowerCase();
      const doctorName = (o.doctorName || '').toLowerCase();
      return (
        idStr.includes(q) ||
        apptStr.includes(q) ||
        testName.includes(q) ||
        patientName.includes(q) ||
        doctorName.includes(q)
      );
    });
  }, [orders, searchQuery]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-IN');
  };

  /** Table Columns matching specification */
  const columns = [
    {
      header: 'Lab Order ID',
      accessor: 'id',
      render: (row) => <span className="font-mono text-xs font-bold text-slate-700">#{row.id}</span>,
    },
    {
      header: 'Patient Name',
      accessor: 'patientName',
      render: (row) => (
        <span className="font-semibold text-slate-800 text-xs">
          {row.patientName || (row.patientId ? `Patient #${row.patientId}` : 'Patient')}
        </span>
      ),
    },
    {
      header: 'Doctor Name',
      accessor: 'doctorName',
      render: (row) => (
        <span className="font-medium text-slate-700 text-xs">
          {row.doctorName
            ? row.doctorName.startsWith('Dr.')
              ? row.doctorName
              : `Dr. ${row.doctorName}`
            : row.doctorId
            ? `Doctor #${row.doctorId}`
            : 'Doctor'}
        </span>
      ),
    },
    {
      header: 'Test Name',
      accessor: 'testName',
      render: (row) => (
        <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
          <FlaskConical className="h-3.5 w-3.5 text-indigo-600" />
          {row.testName || row.labTestName || `Lab Test #${row.labTestId}`}
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
              ? 'bg-rose-100 text-rose-700 border border-rose-200 animate-pulse'
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
        const st = (row.status || 'PENDING').toUpperCase();
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
      header: 'Created Date',
      accessor: 'createdAt',
      render: (row) => (
        <span className="text-xs text-slate-600 font-medium">
          {formatDate(row.createdAt || row.orderDate)}
        </span>
      ),
    },
    {
      header: 'Actions',
      render: (row) => {
        const st = (row.status || 'PENDING').toUpperCase();
        const isCompleted = st === 'COMPLETED';

        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setUploadModalOrder(row);
                setReportRemarks(row.clinicalNotes || 'Diagnostic Lab Report');
                setUploadFile(null);
              }}
              className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Upload className="h-3.5 w-3.5" />
              Upload Report
            </button>

            {isCompleted && (
              <button
                onClick={() => handleOpenViewReport(row)}
                className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Eye className="h-3.5 w-3.5" />
                View Report
              </button>
            )}
          </div>
        );
      },
    },
  ];

  if (loading && orders.length === 0) return <LoadingSpinner fullPage />;

  const inputClass =
    'w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all';

  return (
    <div className="space-y-6">
      {/* Header & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <TestTube className="h-7 w-7 text-indigo-600" />
            Lab Reports & Diagnostics Queue
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Inspect pending lab requests, upload diagnostic reports, and manage status
          </p>
        </div>

        <button
          onClick={fetchLabOrders}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 transition-all cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <RefreshCw className="h-4 w-4 text-slate-400" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Synchronized Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
            <p className="text-[11px] font-bold text-slate-400 uppercase">Total Orders</p>
            <p className="text-xl font-bold text-slate-900 mt-1">{stats.totalLabOrders ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 text-center">
            <p className="text-[11px] font-bold text-amber-700 uppercase">Pending Tests</p>
            <p className="text-xl font-bold text-amber-600 mt-1">{stats.pendingTests ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 text-center">
            <p className="text-[11px] font-bold text-emerald-700 uppercase">Completed Reports</p>
            <p className="text-xl font-bold text-emerald-600 mt-1">{stats.completedReports ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-4 text-center">
            <p className="text-[11px] font-bold text-blue-700 uppercase">Total Reports</p>
            <p className="text-xl font-bold text-blue-600 mt-1">{stats.totalReports ?? 0}</p>
          </div>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by test, patient, or order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex items-center rounded-xl bg-slate-100 p-1 self-start sm:self-auto">
            {[
              { id: 'ALL', label: 'All Orders' },
              { id: 'PENDING', label: 'Pending' },
              { id: 'IN_PROGRESS', label: 'In Progress' },
              { id: 'COMPLETED', label: 'Completed' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredOrders}
          loading={loading}
          emptyMessage={
            activeTab === 'PENDING'
              ? 'No Pending Lab Orders'
              : 'No lab orders found matching the selected criteria.'
          }
        />
      </div>

      {/* Upload Report Modal */}
      {uploadModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <Upload className="h-5 w-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900">
                  Upload Lab Report for Order #{uploadModalOrder.id}
                </h3>
              </div>
              <button
                onClick={() => setUploadModalOrder(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/60 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Test Name:</span>
                <span className="font-bold text-slate-800">
                  {uploadModalOrder.testName || uploadModalOrder.labTestName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Patient Name:</span>
                <span className="font-bold text-slate-800">{uploadModalOrder.patientName || `Patient #${uploadModalOrder.patientId}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Doctor Name:</span>
                <span className="font-bold text-slate-800">{uploadModalOrder.doctorName || `Doctor #${uploadModalOrder.doctorId}`}</span>
              </div>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Report Findings / Remarks <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter detailed test observations, values, or findings..."
                  value={reportRemarks}
                  onChange={(e) => setReportRemarks(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Report Attachment (PDF / Image) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  required
                  className="w-full text-xs file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUploadModalOrder(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2 text-xs transition-all disabled:opacity-50 shadow-md shadow-indigo-500/20"
                >
                  <Upload className="h-4 w-4" />
                  {uploading ? 'Uploading...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Report Modal */}
      {viewReportOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <FileText className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900">Lab Report Details #{viewReportOrder.id}</h3>
              </div>
              <button
                onClick={() => setViewReportOrder(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {loadingReportData ? (
              <LoadingSpinner />
            ) : (
              <div className="space-y-3 text-xs">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-400 font-medium">Test Name</span>
                  <span className="font-bold text-slate-800">
                    {viewReportOrder.testName || viewReportOrder.labTestName || `Lab Test #${viewReportOrder.labTestId}`}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-400 font-medium">Patient</span>
                  <span className="font-bold text-slate-800">
                    {viewReportOrder.patientName || (viewReportOrder.patientId ? `Patient #${viewReportOrder.patientId}` : 'Patient')}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-400 font-medium">Doctor</span>
                  <span className="font-bold text-slate-800">
                    {viewReportOrder.doctorName
                      ? viewReportOrder.doctorName.startsWith('Dr.')
                        ? viewReportOrder.doctorName
                        : `Dr. ${viewReportOrder.doctorName}`
                      : viewReportOrder.doctorId
                      ? `Doctor #${viewReportOrder.doctorId}`
                      : 'Doctor'}
                  </span>
                </div>

                <div className="space-y-1 pt-1">
                  <span className="text-slate-400 font-medium">Report Observations / Findings:</span>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 text-slate-800 font-mono leading-relaxed whitespace-pre-wrap">
                    {viewReportData?.report || viewReportOrder.clinicalNotes || 'Diagnostic sample analyzed. Results submitted.'}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-slate-100 gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const targetOrder = viewReportOrder;
                    setViewReportOrder(null);
                    setUploadModalOrder(targetOrder);
                    setReportRemarks(targetOrder.clinicalNotes || 'Diagnostic Lab Report');
                    setUploadFile(null);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-3.5 py-2 text-xs transition-colors shadow-xs cursor-pointer"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Upload / Replace Report
                </button>
                {(viewReportData?.id || viewReportOrder?.id) && (
                  <button
                    onClick={() => downloadReportFile(viewReportData?.id || viewReportOrder?.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    View / Download PDF
                  </button>
                )}
              </div>
              <button
                onClick={() => setViewReportOrder(null)}
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
