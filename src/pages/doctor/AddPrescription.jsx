/**
 * AddPrescription — Standalone page for doctors to create a new prescription
 * Matches PrescriptionRequest DTO: appointmentId, diagnosis, instructions, medicines array
 * Only permits selecting appointments in CONSULTATION_COMPLETED status
 * Auto-completes appointment upon successful submission
 */
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FileText,
  Pill,
  Send,
  Loader2,
  Plus,
  Trash2,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import doctorApi from '../../api/doctorApi';
import appointmentApi from '../../api/appointmentApi';
import prescriptionApi from '../../api/prescriptionApi';
import medicineApi from '../../api/medicineApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const EMPTY_MEDICINE = {
  medicineId: '',
  dosage: '',
  quantity: 1,
  frequency: 'Once daily',
  duration: '5 days',
};

export default function AddPrescription() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paramApptId = searchParams.get('appointmentId') || '';

  const [appointmentId, setAppointmentId] = useState(paramApptId);
  const [diagnosis, setDiagnosis] = useState('');
  const [instructions, setInstructions] = useState('');
  const [medicines, setMedicines] = useState([{ ...EMPTY_MEDICINE }]);

  const [eligibleAppointments, setEligibleAppointments] = useState([]);
  const [availableMedicines, setAvailableMedicines] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  /** Fetch doctor profile, appointments (filtered for CONSULTATION_COMPLETED), and medicine catalog */
  useEffect(() => {
    const load = async () => {
      try {
        const profileRes = await doctorApi.getById(user.userId).catch(() => ({ data: { id: user.userId } }));
        const doctorId = profileRes.data.id ?? user.userId;

        const [apptRes, medRes] = await Promise.all([
          appointmentApi.getByDoctor(doctorId).catch(() => ({ data: [] })),
          medicineApi.getAll().catch(() => ({ data: [] }))
        ]);

        // Filter appointments that are in CONSULTATION_DONE or CONSULTATION_COMPLETED or APPROVED state (or currently selected)
        const filtered = (apptRes.data || []).filter(
          (a) =>
            a.status === 'CONSULTATION_DONE' ||
            a.status === 'CONSULTATION_COMPLETED' ||
            a.status === 'APPROVED' ||
            String(a.id || a.appointmentId) === paramApptId
        );

        setEligibleAppointments(filtered);
        setAvailableMedicines(medRes.data || []);
      } catch (err) {
        console.error('Failed to load prescription metadata:', err);
      } finally {
        setPageLoading(false);
      }
    };
    load();
  }, [user.userId, paramApptId]);

  const handleMedicineChange = (index, field, value) => {
    setMedicines((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addMedicineRow = () => {
    setMedicines((prev) => [...prev, { ...EMPTY_MEDICINE }]);
  };

  const removeMedicineRow = (index) => {
    if (medicines.length === 1) return;
    setMedicines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!appointmentId) {
      toast.error('Please select an appointment in Consultation Completed status');
      return;
    }
    if (!diagnosis.trim()) {
      toast.error('Please enter diagnosis');
      return;
    }
    if (medicines.some((m) => !m.medicineId || !m.dosage)) {
      toast.error('Please complete all medicine entries');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        appointmentId: Number(appointmentId),
        diagnosis: diagnosis.trim(),
        instructions: instructions.trim() || 'Take as directed',
        medicines: medicines.map((m) => ({
          medicineId: Number(m.medicineId),
          dosage: m.dosage.trim(),
          quantity: m.quantity ? Number(m.quantity) : 1,
          frequency: m.frequency ? m.frequency.trim() : 'Once daily',
          duration: m.duration ? m.duration.trim() : '5 days',
        })),
      };

      // Step 1: Create Prescription
      await prescriptionApi.create(payload);

      toast.success('Prescription created successfully!');
      navigate('/doctor/appointments');
    } catch (err) {
      console.error('Prescription creation failed:', err);
      toast.error(err.response?.data?.message || 'Failed to create prescription.');
    } finally {
      setSubmitting(false);
    }
  };

  if (pageLoading) return <LoadingSpinner fullPage />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Add Prescription</h1>
        <p className="mt-1 text-sm text-slate-500">Create a prescription for appointments with Consultation Completed status</p>
      </div>

      <form onSubmit={handleSubmit} className="mx-auto max-w-3xl rounded-3xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-slate-100 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/20">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Prescription Header</h2>
            <p className="text-xs text-slate-400">Select eligible appointment & diagnosis</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Appointment *</label>
            <select
              value={appointmentId}
              onChange={(e) => setAppointmentId(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="">— Select Consultation Completed Appointment —</option>
              {eligibleAppointments.map((appt) => (
                <option key={appt.id || appt.appointmentId} value={appt.id || appt.appointmentId}>
                  #{appt.id || appt.appointmentId} — {appt.patientName || `Patient #${appt.patientId}`} ({appt.status})
                </option>
              ))}
            </select>
            {eligibleAppointments.length === 0 && (
              <p className="mt-1 text-xs text-amber-600 font-medium">
                ⚠️ No appointments found in Consultation Completed status for Dr. {user.name}. Please complete patient consultation first.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Diagnosis *</label>
            <input
              type="text"
              placeholder="e.g. Acute Bronchitis"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* Dynamic Medicines Table */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Pill className="h-4 w-4 text-emerald-600" />
              Prescribed Medicines *
            </h3>
            <button
              type="button"
              onClick={addMedicineRow}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Add Medicine
            </button>
          </div>

          {availableMedicines.length === 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium">
              ⚠️ No medicines found in DB inventory. Pharmacist / Admin needs to add medicines under Pharmacist → Manage Medicines.
            </div>
          )}

          {medicines.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200/60 items-center">
              <div className="col-span-4">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Medicine *</label>
                <select
                  value={item.medicineId}
                  onChange={(e) => handleMedicineChange(index, 'medicineId', e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select Medicine</option>
                  {availableMedicines.map((m) => (
                    <option key={m.id} value={m.id}>{m.medicineName || m.name} ({m.category})</option>
                  ))}
                </select>
              </div>

              <div className="col-span-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Dosage *</label>
                <input
                  type="text"
                  placeholder="500mg"
                  value={item.dosage}
                  onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="col-span-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Qty</label>
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => handleMedicineChange(index, 'quantity', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="col-span-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Duration</label>
                <input
                  type="text"
                  placeholder="5 days"
                  value={item.duration}
                  onChange={(e) => handleMedicineChange(index, 'duration', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="col-span-1 flex justify-center pt-3">
                <button
                  type="button"
                  onClick={() => removeMedicineRow(index)}
                  disabled={medicines.length === 1}
                  className="text-rose-400 hover:text-rose-600 disabled:opacity-30 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Additional Instructions</label>
          <textarea
            rows={3}
            placeholder="e.g. Take after food with warm water..."
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold px-7 py-3 text-sm shadow-md shadow-emerald-500/20 disabled:opacity-60 transition-all"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Submit Prescription & Complete Appointment
          </button>
        </div>
      </form>
    </div>
  );
}
