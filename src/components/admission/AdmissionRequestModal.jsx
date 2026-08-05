/**
 * AdmissionRequestModal Component
 * Dialog modal to create a patient admission request (Status: REQUESTED)
 */
import { useState, useEffect } from 'react';
import { X, User, FileText, Calendar, AlertCircle, HeartPulse } from 'lucide-react';
import toast from 'react-hot-toast';
import admissionApi from '../../api/admissionApi';
import patientApi from '../../api/patientApi';

export default function AdmissionRequestModal({ isOpen, onClose, patient, onSuccess }) {
  const [patientId, setPatientId] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [expectedDischargeDate, setExpectedDischargeDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [patientList, setPatientList] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (patient && (patient.id || patient.patientId)) {
        setPatientId(patient.id || patient.patientId);
      } else {
        setPatientId('');
        fetchPatients();
      }
      setReason('');
      setNotes('');
      setExpectedDischargeDate('');
    }
  }, [isOpen, patient]);

  const fetchPatients = async () => {
    setLoadingPatients(true);
    try {
      const res = await patientApi.search('');
      setPatientList(res.data || []);
    } catch (err) {
      console.error('Failed to load patients list:', err);
    } finally {
      setLoadingPatients(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!patientId) {
      toast.error('Please select a patient');
      return;
    }
    if (!reason.trim()) {
      toast.error('Please enter the reason for admission');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        patientId: Number(patientId),
        reason: reason.trim(),
        notes: notes.trim() || null,
        expectedDischargeDate: expectedDischargeDate ? expectedDischargeDate : null,
      };

      const res = await admissionApi.createRequest(payload);
      const newAdm = res?.data || {
        id: Date.now(),
        patientId: Number(patientId),
        patientName: selectedPatientObj?.firstName ? `${selectedPatientObj.firstName} ${selectedPatientObj.lastName || ''}`.trim() : `Patient #${patientId}`,
        patientMobile: selectedPatientObj?.mobile || '',
        reason: reason.trim(),
        notes: notes.trim() || null,
        expectedDischargeDate: expectedDischargeDate || null,
        admissionStatus: 'REQUESTED',
        createdAt: new Date().toISOString(),
      };

      const existingLocal = JSON.parse(localStorage.getItem('hms_created_admissions') || '[]');
      localStorage.setItem('hms_created_admissions', JSON.stringify([newAdm, ...existingLocal]));

      toast.success('Patient admission request created successfully!');
      window.dispatchEvent(new Event('hms_dashboard_refresh'));
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create admission request');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedPatientObj = patient || patientList.find((p) => String(p.id) === String(patientId));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 space-y-5">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 font-bold">
              <HeartPulse className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">New Patient Admission Request</h3>
              <p className="text-xs text-slate-500">Submit IPD admission request for hospital care</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Selected Patient Banner if provided */}
        {selectedPatientObj ? (
          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-sm">
                {selectedPatientObj.firstName?.charAt(0) || 'P'}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  {selectedPatientObj.firstName} {selectedPatientObj.lastName}
                </p>
                <p className="text-xs text-blue-600">ID: #{selectedPatientObj.id} | Mobile: {selectedPatientObj.mobile}</p>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Select Patient *
            </label>
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              required
              disabled={loadingPatients}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="">-- Choose Patient --</option>
              {patientList.map((p) => (
                <option key={p.id} value={p.id}>
                  #{p.id} - {p.firstName} {p.lastName} ({p.mobile})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Reason for Admission *
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              placeholder="Primary diagnosis, symptoms, or medical condition requiring IPD admission..."
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Expected Discharge Date (Optional)
            </label>
            <input
              type="datetime-local"
              value={expectedDischargeDate}
              onChange={(e) => setExpectedDischargeDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Additional Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Special requirements, allergies, attending nurse instructions..."
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              {submitting ? 'Creating Request...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
