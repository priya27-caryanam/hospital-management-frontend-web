/**
 * Create Lab Order Modal (Doctor)
 *
 * Implements POST /api/lab-orders
 * Swagger Request Schema: { appointmentId, labTestId, clinicalNotes, priority, instructions }
 * Swagger Response Schema: { id, appointmentId, labTestId, labTestName, clinicalNotes, priority, instructions, status, createdAt, updatedAt }
 */
import { useState, useEffect } from 'react';
import { FlaskConical, X, Send, Loader2, FileText, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import labOrderApi from '../../api/labOrderApi';
import labTestApi from '../../api/labTestApi';

import { saveAppointmentName } from '../../utils/appointmentCache';

export default function CreateLabOrderModal({ appointmentId, patientName, doctorName, isOpen, onClose, onSuccess }) {
  const [labTestId, setLabTestId] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [priority, setPriority] = useState('NORMAL'); // NORMAL | URGENT
  const [instructions, setInstructions] = useState('');
  const [labTests, setLabTests] = useState([]);
  const [loadingTests, setLoadingTests] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const fetchTests = async () => {
      setLoadingTests(true);
      try {
        const res = await labTestApi.getAll();
        setLabTests(res.data || []);
      } catch (err) {
        console.error('Failed to load lab tests:', err);
        toast.error('Failed to load lab tests catalog');
      } finally {
        setLoadingTests(false);
      }
    };
    fetchTests();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!labTestId) {
      toast.error('Please select a diagnostic lab test');
      return;
    }
    if (!clinicalNotes.trim()) {
      toast.error('Please enter clinical notes');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        appointmentId: Number(appointmentId),
        labTestId: Number(labTestId),
        clinicalNotes: clinicalNotes.trim(),
        priority: priority || 'NORMAL',
        instructions: instructions.trim() || 'Fasting required prior to sample collection',
      };

      const res = await labOrderApi.create(payload);
      toast.success(`Lab Order #${res.data?.id || ''} created successfully!`);

      // Save real patient and doctor names into cache for lab technician view
      if (patientName || doctorName) {
        saveAppointmentName(appointmentId, patientName, doctorName);
        if (res.data?.id) {
          saveAppointmentName(res.data.id, patientName, doctorName);
        }
      }

      // Trigger Notifications for LAB_TECHNICIAN and PATIENT
      const labNotif = {
        id: `notif-lab-${Date.now()}`,
        title: 'New Lab Test Order',
        message: `New lab order requested for Appointment #${appointmentId}.`,
        createdAt: new Date().toISOString(),
        read: false,
        role: 'LAB_TECHNICIAN',
      };
      const patientNotif = {
        id: `notif-patient-lab-${Date.now()}`,
        title: 'Lab Test Ordered',
        message: `A diagnostic lab test has been ordered for your Appointment #${appointmentId}.`,
        createdAt: new Date().toISOString(),
        read: false,
        role: 'PATIENT',
      };

      const existingNotifs = JSON.parse(localStorage.getItem('hms_local_notifications') || '[]');
      localStorage.setItem('hms_local_notifications', JSON.stringify([labNotif, patientNotif, ...existingNotifs]));

      window.dispatchEvent(new CustomEvent('hms_notification_trigger', { detail: labNotif }));
      window.dispatchEvent(new Event('hms_dashboard_refresh'));

      onSuccess?.();
      onClose();

    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to create lab order');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl transition-all border border-slate-100 max-h-[90vh] overflow-y-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
              <FlaskConical className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Order Diagnostic Lab Test</h3>
              <p className="text-xs text-slate-500">Appointment #{appointmentId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Select Lab Test */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Select Lab Test <span className="text-rose-500">*</span>
            </label>
            {loadingTests ? (
              <p className="text-xs text-slate-400 py-2">Loading test catalog...</p>
            ) : (
              <select
                value={labTestId}
                onChange={(e) => setLabTestId(e.target.value)}
                required
                className={inputClass}
              >
                <option value="">-- Choose Diagnostic Test --</option>
                {labTests.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.testName} (Price: ₹{t.price})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Order Priority <span className="text-rose-500">*</span>
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              required
              className={inputClass}
            >
              <option value="NORMAL">NORMAL</option>
              <option value="URGENT">URGENT</option>
            </select>
          </div>

          {/* Clinical Notes */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Clinical Notes / Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Enter symptoms, preliminary findings, or test rationale..."
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              required
              className={inputClass}
            />
          </div>

          {/* Special Instructions */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Instructions for Patient / Lab Tech
            </label>
            <input
              type="text"
              placeholder="e.g. 12-hour fasting required before blood draw"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className={inputClass}
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
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-6 py-2.5 text-sm shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Create Lab Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
