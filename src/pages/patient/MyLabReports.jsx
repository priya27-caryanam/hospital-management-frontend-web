/**
 * Patient My Lab Reports Page
 * Displays diagnostic lab test reports matching exact reference UI design.
 * Endpoints: GET /api/lab-orders/patient/{patientId} & GET /api/lab-reports/order/{labOrderId}
 */
import { useState, useEffect, useMemo } from 'react';
import { FileText, Search, Eye, Download, X, FlaskConical, AlertCircle, FileCheck, CheckCircle2, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import labOrderApi from '../../api/labOrderApi';
import labReportApi from '../../api/labReportApi';
import DataTable from '../../components/common/DataTable';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const STATUS_BADGES = {
  COMPLETED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  REVIEWED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  SUBMITTED: 'bg-blue-100 text-blue-800 border-blue-200',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
};

export default function MyLabReports() {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED'
  const [selectedReportModal, setSelectedReportModal] = useState(null);
  const [downloadNoticeOpen, setDownloadNoticeOpen] = useState(false);

  useEffect(() => {
    const fetchPatientReports = async () => {
      const patientId = user?.patientId || user?.userId || user?.id;
      if (!patientId) return;
      setLoading(true);
      try {
        const orderRes = await labOrderApi.getByPatient(patientId);
        const orders = orderRes.data || [];

        // Map every lab order 1-to-1 into report entry to synchronize with dashboard total count
        const reportList = await Promise.all(
          orders.map(async (order) => {
            let reportDetails = null;
            try {
              const repRes = await labReportApi.getByLabOrder(order.id);
              const repData = repRes.data;
              if (repData) {
                if (Array.isArray(repData) && repData.length > 0) {
                  reportDetails = repData[0];
                } else if (repData.id || repData.report) {
                  reportDetails = repData;
                }
              }
            } catch (e) {
              // Report not yet uploaded by lab technician
            }

            return {
              id: reportDetails?.id || order.id,
              labOrderId: order.id,
              testName: order.testName || order.labTestName || `Lab Test #${order.labTestId}`,
              doctorName: order.doctorName,
              doctorId: order.doctorId,
              appointmentId: order.appointmentId,
              report: reportDetails?.report || order.clinicalNotes || 'Diagnostic order submitted to laboratory.',
              status: reportDetails?.status || order.status || 'ORDERED',
              createdAt: reportDetails?.createdAt || order.orderDate || order.createdAt,
            };
          })
        );

        setReports(reportList);
      } catch (err) {
        console.error('Failed to load patient lab reports:', err);
        toast.error('Failed to load lab reports');
      } finally {
        setLoading(false);
      }
    };
    fetchPatientReports();
  }, [user]);

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      // Filter by status tab
      if (activeFilter !== 'ALL') {
        const st = (r.status || 'PENDING').toUpperCase();
        if (activeFilter === 'PENDING' && st !== 'PENDING' && st !== 'ORDERED') return false;
        if (activeFilter === 'IN_PROGRESS' && st !== 'IN_PROGRESS' && st !== 'SUBMITTED') return false;
        if (activeFilter === 'COMPLETED' && st !== 'COMPLETED' && st !== 'REVIEWED') return false;
      }
      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const testName = (r.testName || '').toLowerCase();
        const docName = (r.doctorName || '').toLowerCase();
        const idStr = String(r.id || r.labOrderId || '');
        return testName.includes(q) || docName.includes(q) || idStr.includes(q);
      }
      return true;
    });
  }, [reports, activeFilter, searchQuery]);

  const columns = [
    {
      header: 'Report ID',
      accessor: 'id',
      render: (row) => <span className="font-mono text-xs font-bold text-slate-700">#{row.id}</span>,
    },
    {
      header: 'Lab Test Name',
      accessor: 'testName',
      render: (row) => (
        <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
          <FlaskConical className="h-3.5 w-3.5 text-indigo-600" />
          {row.testName}
        </span>
      ),
    },
    {
      header: 'Doctor',
      accessor: 'doctorName',
      render: (row) => (
        <span className="font-semibold text-slate-800 text-xs">
          {row.doctorName ? `Dr. ${row.doctorName}` : `Doctor #${row.doctorId}`}
        </span>
      ),
    },
    {
      header: 'Report Date',
      accessor: 'createdAt',
      render: (row) => (
        <span className="text-xs text-slate-600 font-medium">
          {row.createdAt || row.orderDate ? new Date(row.createdAt || row.orderDate).toLocaleString('en-IN') : '—'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => {
        const st = (row.status || 'COMPLETED').toUpperCase();
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedReportModal(row)}
            className="inline-flex items-center gap-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-2.5 py-1.5 text-xs font-semibold transition-colors"
          >
            <Eye className="h-3.5 w-3.5" />
            View Report
          </button>
          <button
            onClick={() => setDownloadNoticeOpen(true)}
            className="inline-flex items-center gap-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 text-xs font-semibold transition-colors"
            title="Download PDF"
          >
            <Download className="h-3.5 w-3.5" />
            PDF
          </button>
        </div>
      ),
    },
  ];

  if (loading && reports.length === 0) return <LoadingSpinner fullPage />;

  const inputClass =
    'w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <FileText className="h-7 w-7 text-blue-600" />
          My Lab Test Reports
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Track and download diagnostic lab results prescribed by doctors
        </p>
      </div>

      {/* Backend PDF Support Notice Banner */}
      {downloadNoticeOpen && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 space-y-1.5 animate-fade-in relative">
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm text-amber-800 flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              Backend Support Required
            </span>
            <button onClick={() => setDownloadNoticeOpen(false)} className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="leading-relaxed">
            Backend support is required because there is currently no endpoint to retrieve Patient Lab Tests / Patient Lab Reports PDF download.
          </p>
        </div>
      )}

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

        {filteredReports.length === 0 ? (
          <div className="text-center py-12 text-slate-400 space-y-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 mx-auto text-slate-400">
              <FileCheck className="h-8 w-8" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-700">No laboratory reports found</p>
              <p className="text-xs text-slate-400 mt-1">Try switching status filters or looking up other test parameters.</p>
            </div>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredReports}
            emptyMessage="No laboratory reports found"
          />
        )}
      </div>

      {/* View Report Modal */}
      {selectedReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <FileText className="h-5 w-5 text-blue-600" />
                <h3 className="font-bold text-slate-900">Diagnostic Report #{selectedReportModal.id}</h3>
              </div>
              <button
                onClick={() => setSelectedReportModal(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-400 font-medium">Test Name</span>
                <span className="font-bold text-slate-800">{selectedReportModal.testName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-400 font-medium">Prescribing Doctor</span>
                <span className="font-bold text-slate-800">
                  {selectedReportModal.doctorName ? `Dr. ${selectedReportModal.doctorName}` : `Doctor #${selectedReportModal.doctorId}`}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-400 font-medium">Report Status</span>
                <span className="font-bold text-emerald-700">{selectedReportModal.status}</span>
              </div>

              <div className="space-y-1 pt-1">
                <span className="text-slate-400 font-medium">Diagnostic Findings & Observations:</span>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 text-slate-800 font-mono leading-relaxed whitespace-pre-wrap">
                  {selectedReportModal.report || 'No detailed findings text uploaded yet.'}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setSelectedReportModal(null);
                  setDownloadNoticeOpen(true);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline"
              >
                <Download className="h-4 w-4" />
                Download Report PDF
              </button>
              <button
                onClick={() => setSelectedReportModal(null)}
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
