/**
 * Lab Reports Management Page (Lab Technician)
 *
 * Implements:
 *   - POST /api/lab-reports/upload — Upload a lab report file
 *   - GET /api/lab-reports/order/{labOrderId} — View lab report for a lab order
 *
 * Swagger Request Schema (POST /api/lab-reports/upload):
 *   Query params: labOrderId, report
 *   Multipart form-data: file
 *
 * Swagger Response Schema (LabReportResponse):
 *   { id, labOrderId, report, filePath, status, createdAt, updatedAt }
 */
import { useState } from 'react';
import { Upload, TestTube, Search, FileText, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import labReportApi from '../../api/labReportApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function LabReports() {
  const [labOrderId, setLabOrderId] = useState('');
  const [reportNotes, setReportNotes] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedReport, setUploadedReport] = useState(null);

  // Search state
  const [searchOrderId, setSearchOrderId] = useState('');
  const [searchedReport, setSearchedReport] = useState(null);
  const [searching, setSearching] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!labOrderId || !file) {
      toast.error('Please enter Lab Order ID and select a report file');
      return;
    }

    setUploading(true);
    setUploadedReport(null);
    try {
      const res = await labReportApi.upload(
        Number(labOrderId),
        reportNotes.trim() || 'Diagnostic Lab Report',
        file
      );
      setUploadedReport(res.data);
      toast.success('Lab report uploaded successfully!');
      setLabOrderId('');
      setReportNotes('');
      setFile(null);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to upload lab report');
    } finally {
      setUploading(false);
    }
  };

  const handleSearchReport = async (e) => {
    e.preventDefault();
    if (!searchOrderId) {
      toast.error('Please enter a Lab Order ID');
      return;
    }

    setSearching(true);
    setSearchedReport(null);
    try {
      const res = await labReportApi.getByLabOrder(searchOrderId);
      setSearchedReport(res.data);
    } catch (err) {
      console.error(err);
      toast.error('No lab report found for this order ID.');
    } finally {
      setSearching(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-IN');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <TestTube className="h-7 w-7 text-indigo-600" />
          Lab Diagnostic Reports Portal
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Upload report files and inspect report records by Lab Order ID
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 items-start">
        {/* Left Column: Upload Form */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Upload className="h-5 w-5 text-indigo-600" />
            Upload Lab Report
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Lab Order ID *</label>
              <input
                type="number"
                placeholder="e.g. 101"
                value={labOrderId}
                onChange={(e) => setLabOrderId(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Report Remarks / Test Title *</label>
              <textarea
                rows={2}
                placeholder="Summary of test results or laboratory observations..."
                value={reportNotes}
                onChange={(e) => setReportNotes(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Report File (PDF / Image) *</label>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => setFile(e.target.files[0])}
                required
                className="w-full text-xs file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={uploading}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2 text-xs transition-colors disabled:opacity-50 shadow-sm"
              >
                <Upload className="h-3.5 w-3.5" />
                {uploading ? 'Uploading...' : 'Upload Report'}
              </button>
            </div>
          </form>

          {/* Upload Success Details (100% LabReportResponse Mapping) */}
          {uploadedReport && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-2 text-xs animate-fade-in">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Report Uploaded Successfully
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-700 pt-2 border-t border-emerald-100">
                <div><span className="text-slate-400 font-medium">Report ID:</span> #{uploadedReport.id}</div>
                <div><span className="text-slate-400 font-medium">Order ID:</span> #{uploadedReport.labOrderId}</div>
                <div className="col-span-2"><span className="text-slate-400 font-medium">Title:</span> {uploadedReport.report}</div>
                <div className="col-span-2"><span className="text-slate-400 font-medium">Status:</span> {uploadedReport.status}</div>
                <div className="col-span-2"><span className="text-slate-400 font-medium">Path:</span> {uploadedReport.filePath}</div>
                <div className="col-span-2"><span className="text-slate-400 font-medium">Created:</span> {formatDate(uploadedReport.createdAt)}</div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Search & Inspect Reports */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-600" />
            Lookup Report by Lab Order ID
          </h3>

          <form onSubmit={handleSearchReport} className="flex gap-2">
            <input
              type="number"
              placeholder="Enter Lab Order ID..."
              value={searchOrderId}
              onChange={(e) => setSearchOrderId(e.target.value)}
              required
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={searching}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 text-xs transition-colors disabled:opacity-50"
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </form>

          {searching && <LoadingSpinner />}

          {searchedReport && (
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 space-y-3 text-xs animate-fade-in">
              <div className="flex justify-between items-center border-b border-blue-100 pb-2">
                <span className="font-bold text-slate-900 text-sm">{searchedReport.report || 'Diagnostic Report'}</span>
                <span className="rounded-full bg-blue-100 text-blue-800 px-2.5 py-0.5 font-bold">
                  {searchedReport.status}
                </span>
              </div>
              <div className="space-y-1.5 text-slate-700">
                <p><span className="text-slate-400 font-medium">Report ID:</span> #{searchedReport.id}</p>
                <p><span className="text-slate-400 font-medium">Lab Order ID:</span> #{searchedReport.labOrderId}</p>
                <p><span className="text-slate-400 font-medium">File Path:</span> {searchedReport.filePath}</p>
                <p><span className="text-slate-400 font-medium">Created At:</span> {formatDate(searchedReport.createdAt)}</p>
                <p><span className="text-slate-400 font-medium">Last Updated:</span> {formatDate(searchedReport.updatedAt)}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
