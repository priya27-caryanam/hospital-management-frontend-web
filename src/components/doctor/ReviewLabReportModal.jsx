/**
 * Review Lab Report Modal (Doctor)
 *
 * Implements:
 *   - GET /api/lab-reports/order/{labOrderId} — View lab report
 *   - PUT /api/lab-reports/{id}/review — Submit doctor remarks/review
 *
 * Swagger Request Schema (PUT /api/lab-reports/{id}/review):
 *   { doctorRemarks }
 *
 * Swagger Response Schema (GET /api/lab-reports/order/{labOrderId}):
 *   { id, labOrderId, report, filePath, status, createdAt, updatedAt }
 */
import { useState, useEffect } from 'react';
import { FileCheck, X, Send, Loader2, FileText, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import labReportApi from '../../api/labReportApi';
import LoadingSpinner from '../common/LoadingSpinner';

export default function ReviewLabReportModal({ labOrderId, isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [doctorRemarks, setDoctorRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !labOrderId) return;
    const fetchReport = async () => {
      setLoading(true);
      try {
        const res = await labReportApi.getByLabOrder(labOrderId);
        setReportData(res.data);
      } catch (err) {
        console.error('Failed to load lab report:', err);
        setReportData(null);
        toast.error('Lab report not found for this order.');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [labOrderId, isOpen]);

  if (!isOpen) return null;

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reportData?.id) {
      toast.error('No report available to review');
      return;
    }
    if (!doctorRemarks.trim()) {
      toast.error('Please enter your remarks');
      return;
    }

    setSubmitting(true);
    try {
      await labReportApi.review(reportData.id, {
        doctorRemarks: doctorRemarks.trim(),
      });
      toast.success('Lab report reviewed & remarks saved successfully!');
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to submit report review');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-IN');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl transition-all border border-slate-100 max-h-[90vh] overflow-y-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20">
              <FileCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Review Lab Report</h3>
              <p className="text-xs text-slate-500">Lab Order #{labOrderId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-10">
            <LoadingSpinner />
          </div>
        ) : reportData ? (
          <form onSubmit={handleReviewSubmit} className="space-y-4">
            {/* Report Metadata (100% LabReportResponse Field Mapping) */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-2 text-xs">
              <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
                <span className="font-bold text-slate-800 text-sm">{reportData.report || 'Lab Diagnostic Report'}</span>
                <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 font-bold">
                  {reportData.status || 'PENDING'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1">
                <div><span className="text-slate-400 font-medium">Report ID:</span> #{reportData.id}</div>
                <div><span className="text-slate-400 font-medium">Order ID:</span> #{reportData.labOrderId}</div>
                <div className="col-span-2"><span className="text-slate-400 font-medium">Uploaded Date:</span> {formatDate(reportData.createdAt)}</div>
                {reportData.filePath && (
                  <div className="col-span-2 text-blue-600 font-mono underline truncate">
                    Attachment: {reportData.filePath}
                  </div>
                )}
              </div>
            </div>

            {/* Doctor Remarks Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Doctor Remarks & Rationale <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Enter clinical assessment, notes on findings, or follow-up instructions..."
                value={doctorRemarks}
                onChange={(e) => setDoctorRemarks(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 focus:border-purple-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-100 resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold px-6 py-2.5 text-sm shadow-md shadow-purple-500/20 transition-all disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Submit Review
              </button>
            </div>
          </form>
        ) : (
          <div className="py-8 text-center text-slate-500 space-y-3">
            <p className="text-sm font-semibold">No lab report document found for this order ID.</p>
            <button
              onClick={onClose}
              className="rounded-xl bg-slate-100 px-5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
