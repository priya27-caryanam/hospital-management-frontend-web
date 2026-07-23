/**
 * Add Prescription Modal
 * Allows doctors to create a prescription for an appointment in CONSULTATION_COMPLETED status
 * Automatically calls PUT /api/appointments/{id}/complete after successful creation
 */
import { useState, useEffect } from 'react';
import { Pill, X, Plus, Trash2, FileText, Send, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import prescriptionApi from '../../api/prescriptionApi';
import appointmentApi from '../../api/appointmentApi';
import medicineApi from '../../api/medicineApi';

const EMPTY_MEDICINE = {
  medicineId: '',
  dosage: '',
  quantity: 1,
  frequency: 'Once daily',
  duration: '5 days',
};

export default function AddPrescriptionModal({ appointmentId, isOpen, onClose, onSuccess }) {
  const [diagnosis, setDiagnosis] = useState('');
  const [instructions, setInstructions] = useState('');
  const [medicines, setMedicines] = useState([{ ...EMPTY_MEDICINE }]);
  const [availableMedicines, setAvailableMedicines] = useState([]);
  const [loadingMeds, setLoadingMeds] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const fetchMeds = async () => {
      setLoadingMeds(true);
      try {
        const res = await medicineApi.getAll();
        setAvailableMedicines(res.data || []);
      } catch (err) {
        console.error('Failed to load medicines:', err);
      } finally {
        setLoadingMeds(false);
      }
    };
    fetchMeds();
  }, [isOpen]);

  if (!isOpen) return null;

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
    if (!diagnosis.trim()) {
      toast.error('Please enter diagnosis');
      return;
    }
    if (medicines.some((m) => !m.medicineId || !m.dosage)) {
      toast.error('Please select medicine and specify dosage for all rows');
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

      // Step 1: Create prescription
      await prescriptionApi.create(payload);

      toast.success('Prescription created successfully!');
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Prescription creation failed:', err);
      toast.error(err.response?.data?.message || 'Failed to create prescription.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl transition-all border border-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/20">
              <Pill className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Write Prescription</h3>
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
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Diagnosis <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Upper Respiratory Tract Infection"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Medicines Section */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Pill className="h-3.5 w-3.5 text-emerald-600" />
                Prescribed Medicines
              </label>
              <button
                type="button"
                onClick={addMedicineRow}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" /> Add Medicine
              </button>
            </div>

            {loadingMeds ? (
              <p className="text-xs text-slate-400 py-2">Loading medicine catalog...</p>
            ) : (
              medicines.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 bg-slate-50/70 p-3 rounded-2xl border border-slate-200/60 items-center">
                  <div className="col-span-4">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Medicine</label>
                    <select
                      value={item.medicineId}
                      onChange={(e) => handleMedicineChange(index, 'medicineId', e.target.value)}
                      required
                      className={inputClass}
                    >
                      <option value="">Select</option>
                      {availableMedicines.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.medicineName || m.name} ({m.category})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-3">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Dosage</label>
                    <input
                      type="text"
                      placeholder="500mg"
                      value={item.dosage}
                      onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)}
                      required
                      className={inputClass}
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Qty</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleMedicineChange(index, 'quantity', e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Duration</label>
                    <input
                      type="text"
                      placeholder="5 days"
                      value={item.duration}
                      onChange={(e) => handleMedicineChange(index, 'duration', e.target.value)}
                      className={inputClass}
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
              ))
            )}
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              <FileText className="h-3.5 w-3.5 text-slate-400" />
              Special Instructions
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Take after meals with warm water..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
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
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold px-6 py-2.5 text-sm shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Save Prescription & Complete
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
