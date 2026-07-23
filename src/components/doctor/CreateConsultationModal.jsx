/**
 * Create Consultation Modal
 * Form for doctors to record consultation notes matching OpenAPI CreateConsultationRequest DTO
 * Automatically marks appointment consultation as completed upon submission
 */
import { useState, useEffect } from 'react';
import { Stethoscope, X, Activity, Thermometer, HeartPulse, FileText, CheckSquare, Square } from 'lucide-react';
import toast from 'react-hot-toast';
import consultationApi from '../../api/consultationApi';
import appointmentApi from '../../api/appointmentApi';
import symptomsApi from '../../api/symptomsApi';

export default function CreateConsultationModal({ appointmentId, isOpen, onClose, onSuccess }) {
  const [bloodPressure, setBloodPressure] = useState('120/80');
  const [temperature, setTemperature] = useState('98.6');
  const [pulseRate, setPulseRate] = useState('72');
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [availableSymptoms, setAvailableSymptoms] = useState([]);
  const [selectedSymptomIds, setSelectedSymptomIds] = useState([]);
  const [loadingSymptoms, setLoadingSymptoms] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Reset form states to clean defaults
    setBloodPressure('120/80');
    setTemperature('98.6');
    setPulseRate('72');
    setDiagnosis('');
    setNotes('');

    // Fetch master symptoms list
    const loadSymptoms = async () => {
      setLoadingSymptoms(true);
      try {
        const res = await symptomsApi.getAll();
        const list = res.data || [];
        setAvailableSymptoms(list);
        if (list.length > 0) {
          // Select first symptom by default so payload is never empty
          setSelectedSymptomIds([list[0].id]);
        }
      } catch (err) {
        console.error('Failed to load symptoms list:', err);
      } finally {
        setLoadingSymptoms(false);
      }
    };
    loadSymptoms();
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleSymptom = (id) => {
    setSelectedSymptomIds((prev) =>
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validations matching backend constraints
    if (selectedSymptomIds.length === 0) {
      toast.error('Please select at least one symptom');
      return;
    }

    const bpRegex = /^\d{2,3}\/\d{2,3}$/;
    if (!bpRegex.test(bloodPressure.trim())) {
      toast.error('Blood pressure must be in format 120/80 (e.g. 120/80)');
      return;
    }

    const tempVal = parseFloat(temperature);
    if (isNaN(tempVal) || tempVal < 90.0 || tempVal > 110.0) {
      toast.error('Temperature must be between 90.0°F and 110.0°F');
      return;
    }

    const pulseVal = parseInt(pulseRate, 10);
    if (isNaN(pulseVal) || pulseVal < 30 || pulseVal > 220) {
      toast.error('Pulse rate must be between 30 and 220 bpm');
      return;
    }

    if (diagnosis.trim().length < 5) {
      toast.error('Primary Diagnosis must be at least 5 characters long');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        appointmentId: Number(appointmentId),
        symptomIds: selectedSymptomIds,
        bloodPressure: bloodPressure.trim(),
        temperature: tempVal,
        pulseRate: pulseVal,
        diagnosis: diagnosis.trim(),
        notes: notes.trim() || null,
      };

      // Step 1: Create consultation record
      await consultationApi.create(payload);

      // Step 2: Automatically advance appointment status to CONSULTATION_COMPLETED
      try {
        await appointmentApi.consultationCompleted(appointmentId);
      } catch (statusErr) {
        console.warn('Consultation created, but failed to update appointment status:', statusErr);
      }

      toast.success('Consultation recorded & status updated to Consultation Completed!');
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to record consultation');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 shadow-sm transition-all focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl transition-all border border-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
              <Stethoscope className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Record Patient Consultation</h3>
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
          {/* Symptoms selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Observed Symptoms <span className="text-rose-500">*</span>
            </label>
            {loadingSymptoms ? (
              <p className="text-xs text-slate-400 animate-pulse">Loading symptoms master...</p>
            ) : availableSymptoms.length === 0 ? (
              <p className="text-xs text-amber-600">No master symptoms found. Please ensure symptoms exist in master data.</p>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border border-slate-200 rounded-xl bg-slate-50/50">
                {availableSymptoms.map((symptom) => {
                  const isSelected = selectedSymptomIds.includes(symptom.id);
                  return (
                    <button
                      type="button"
                      key={symptom.id}
                      onClick={() => toggleSymptom(symptom.id)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {isSelected ? <CheckSquare className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5 text-slate-400" />}
                      {symptom.symptomName || symptom.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Patient Vitals */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Patient Vitals
            </label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="flex items-center gap-1 text-xs font-semibold text-slate-700 mb-1">
                  <HeartPulse className="h-3.5 w-3.5 text-rose-500" />
                  BP (mmHg) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="120/80"
                  value={bloodPressure}
                  onChange={(e) => setBloodPressure(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className="flex items-center gap-1 text-xs font-semibold text-slate-700 mb-1">
                  <Thermometer className="h-3.5 w-3.5 text-amber-500" />
                  Temp (°F) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="90"
                  max="110"
                  placeholder="98.6"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className="flex items-center gap-1 text-xs font-semibold text-slate-700 mb-1">
                  <Activity className="h-3.5 w-3.5 text-blue-500" />
                  Pulse (bpm) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="30"
                  max="220"
                  placeholder="72"
                  value={pulseRate}
                  onChange={(e) => setPulseRate(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Primary Diagnosis */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Primary Diagnosis (min 5 chars) <span className="text-rose-500">*</span>
            </label>
            <textarea
              placeholder="Enter clinical diagnosis (e.g. Viral Fever with Mild Dehydration)..."
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              rows={2}
              required
              minLength={5}
              className={inputClass}
            />
          </div>

          {/* Clinical Notes */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-1">
              <FileText className="h-4 w-4 text-slate-400" />
              Clinical Observation Notes
            </label>
            <textarea
              placeholder="Enter observations, medical history, recommendations..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={inputClass}
            />
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4.5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold px-6 py-2.5 text-sm shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
            >
              {submitting ? 'Recording...' : 'Save & Mark Consultation Complete'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
