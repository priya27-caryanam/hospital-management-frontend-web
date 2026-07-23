/**
 * View Prescription Modal
 * Reusable modal for viewing full prescription details by appointmentId or prescriptionId.
 * OpenAPI Spec: prescription-controller
 *
 * Swagger Response Schema (PrescriptionResponse):
 * {
 *   prescriptionId, appointmentId, patientName, doctorName, diagnosis,
 *   medicines: [ { medicineId, medicineName, dosage, frequency, duration, quantity } ],
 *   instructions, status, createdAt
 * }
 */
import { useState, useEffect } from 'react';
import { Pill, X, Calendar, User, FileText, CheckCircle2, Tag, Stethoscope } from 'lucide-react';
import toast from 'react-hot-toast';
import prescriptionApi from '../../api/prescriptionApi';
import LoadingSpinner from './LoadingSpinner';

export default function ViewPrescriptionModal({ appointmentId, prescriptionId, isOpen, onClose }) {
  const [loading, setLoading] = useState(true);
  const [prescription, setPrescription] = useState(null);

  useEffect(() => {
    if (!isOpen || (!appointmentId && !prescriptionId)) return;

    const fetchPrescription = async () => {
      setLoading(true);
      try {
        let res;
        if (prescriptionId) {
          res = await prescriptionApi.getById(prescriptionId);
        } else {
          res = await prescriptionApi.getByAppointment(appointmentId);
        }
        setPrescription(res.data);
      } catch (err) {
        console.error('Failed to fetch prescription:', err);
        setPrescription(null);
        toast.error('Prescription details not found.');
      } finally {
        setLoading(false);
      }
    };

    fetchPrescription();
  }, [appointmentId, prescriptionId, isOpen]);

  if (!isOpen) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('en-IN');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl transition-all border border-slate-100 max-h-[90vh] overflow-y-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/20">
              <Pill className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Prescription Record</h3>
              <p className="text-xs text-slate-500">
                Prescription #{prescription?.prescriptionId || '—'} | Appointment #{prescription?.appointmentId || appointmentId || '—'}
              </p>
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
        ) : prescription ? (
          <div className="space-y-4">
            {/* Header badges & status */}
            <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs">
              <div>
                <p className="text-slate-400 font-medium uppercase text-[10px]">Patient Name</p>
                <p className="font-bold text-slate-800 text-sm">{prescription.patientName || '—'}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 font-medium uppercase text-[10px]">Status</p>
                <span
                  className={`inline-flex rounded-full px-3 py-0.5 text-xs font-bold ${
                    prescription.status === 'DISPENSED'
                      ? 'bg-emerald-100 text-emerald-700'
                      : prescription.status === 'ISSUED'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {prescription.status || 'PENDING'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs">
              <div>
                <p className="text-slate-400 font-medium text-[10px] uppercase">Prescribing Doctor</p>
                <p className="font-bold text-slate-800">{prescription.doctorName ? `Dr. ${prescription.doctorName}` : '—'}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium text-[10px] uppercase">Created At</p>
                <p className="font-semibold text-slate-800">{formatDate(prescription.createdAt)}</p>
              </div>
            </div>

            {/* Diagnosis */}
            <div className="rounded-2xl border border-slate-200/80 bg-blue-50/40 p-4 space-y-1">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Clinical Diagnosis
              </h4>
              <p className="text-sm font-bold text-blue-700">{prescription.diagnosis || '—'}</p>
            </div>

            {/* Prescribed Medicines */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Pill className="h-3.5 w-3.5 text-emerald-600" />
                Prescribed Medicines ({prescription.medicines?.length || 0})
              </h4>
              {prescription.medicines && prescription.medicines.length > 0 ? (
                <div className="space-y-2 max-h-[35vh] overflow-y-auto pr-1">
                  {prescription.medicines.map((m, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-200/70 bg-emerald-50/40 p-3 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-slate-900 text-sm">
                          {m.medicineName || `Medicine #${m.medicineId}`}
                        </p>
                        <span className="rounded-lg bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                          Qty: {m.quantity}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600 pt-1 border-t border-emerald-100">
                        <div>
                          <span className="text-slate-400 font-medium">Dosage:</span>
                          <p className="font-semibold text-slate-800">{m.dosage}</p>
                        </div>
                        <div>
                          <span className="text-slate-400 font-medium">Frequency:</span>
                          <p className="font-semibold text-slate-800">{m.frequency || 'As directed'}</p>
                        </div>
                        <div>
                          <span className="text-slate-400 font-medium">Duration:</span>
                          <p className="font-semibold text-slate-800">{m.duration || '—'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No medicines listed.</p>
              )}
            </div>

            {/* Special Instructions */}
            {prescription.instructions && (
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 space-y-1">
                <div className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-slate-400" />
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Doctor Instructions
                  </h4>
                </div>
                <p className="text-xs text-slate-700 italic leading-relaxed">
                  "{prescription.instructions}"
                </p>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold px-6 py-2 text-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-500 space-y-3">
            <p className="text-sm font-semibold">No prescription record found.</p>
            <button
              onClick={onClose}
              className="rounded-xl bg-slate-100 px-5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
