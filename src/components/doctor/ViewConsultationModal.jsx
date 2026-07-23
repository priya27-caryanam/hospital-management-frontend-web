/**
 * View Consultation Modal
 * Component to view recorded consultation details for an appointment.
 * 100% Swagger field mapping for ConsultationResponse.
 */
import { useState, useEffect } from 'react';
import { Stethoscope, X, Activity, Thermometer, HeartPulse, FileText, Calendar, CheckSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import consultationApi from '../../api/consultationApi';
import LoadingSpinner from '../common/LoadingSpinner';

export default function ViewConsultationModal({ appointmentId, isOpen, onClose }) {
  const [loading, setLoading] = useState(true);
  const [consultation, setConsultation] = useState(null);

  useEffect(() => {
    if (!isOpen || !appointmentId) return;

    const fetchConsultation = async () => {
      setLoading(true);
      try {
        const res = await consultationApi.getByAppointment(appointmentId);
        setConsultation(res.data);
      } catch (err) {
        console.error('Failed to fetch consultation:', err);
        setConsultation(null);
        toast.error('No consultation notes found for this appointment.');
      } finally {
        setLoading(false);
      }
    };

    fetchConsultation();
  }, [appointmentId, isOpen]);

  if (!isOpen) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleString('en-IN');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Consultation Profile & Notes</h3>
              <p className="text-xs text-slate-500">Appointment #{appointmentId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-8">
            <LoadingSpinner />
          </div>
        ) : consultation ? (
          <div className="space-y-5">
            {/* Created date banner */}
            {consultation.createdAt && (
              <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <Calendar className="h-3.5 w-3.5 text-blue-500" />
                <span>Recorded on {formatDate(consultation.createdAt)}</span>
              </div>
            )}

            {/* Observed Symptoms */}
            {consultation.symptoms && consultation.symptoms.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Observed Symptoms
                </h4>
                <div className="flex flex-wrap gap-2">
                  {consultation.symptoms.map((s, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700"
                    >
                      <CheckSquare className="h-3 w-3 text-blue-500" />
                      {typeof s === 'object' ? s.symptomName || s.name : s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Vitals Badges */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Patient Vitals
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-red-50/70 border border-red-100 rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-xs font-medium text-red-600 mb-0.5">
                    <HeartPulse className="h-3.5 w-3.5" />
                    <span>Blood Pressure</span>
                  </div>
                  <p className="text-sm font-bold text-slate-800">
                    {consultation.bloodPressure || '—'}
                  </p>
                </div>

                <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-xs font-medium text-amber-600 mb-0.5">
                    <Thermometer className="h-3.5 w-3.5" />
                    <span>Temperature</span>
                  </div>
                  <p className="text-sm font-bold text-slate-800">
                    {consultation.temperature ? `${consultation.temperature} °F` : '—'}
                  </p>
                </div>

                <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center gap-1 text-xs font-medium text-blue-600 mb-0.5">
                    <Activity className="h-3.5 w-3.5" />
                    <span>Pulse Rate</span>
                  </div>
                  <p className="text-sm font-bold text-slate-800">
                    {consultation.pulseRate ? `${consultation.pulseRate} bpm` : '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* Primary Diagnosis */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Primary Diagnosis
              </h4>
              <p className="text-sm font-semibold text-slate-800">
                {consultation.diagnosis || 'No diagnosis recorded'}
              </p>
            </div>

            {/* Clinical Notes */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4">
              <div className="flex items-center gap-1.5 mb-1">
                <FileText className="h-3.5 w-3.5 text-slate-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Clinical Observation & Notes
                </h4>
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                {consultation.notes || 'No detailed clinical notes provided.'}
              </p>
            </div>

            {/* Close action */}
            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-5 py-2 text-sm transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-500">
            <p>No consultation record found.</p>
            <button
              onClick={onClose}
              className="mt-4 rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
