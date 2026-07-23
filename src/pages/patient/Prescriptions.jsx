/**
 * Patient Prescriptions Directory Page
 * Fetches completed appointments and loads associated prescriptions.
 */
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ClipboardList, Stethoscope, Search, Eye, AlertCircle, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import appointmentApi from '../../api/appointmentApi';
import prescriptionApi from '../../api/prescriptionApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function Prescriptions() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppId, setSelectedAppId] = useState('');
  const [prescription, setPrescription] = useState(null);
  const [loadingPrescription, setLoadingPrescription] = useState(false);

  useEffect(() => {
    const loadAppointments = async () => {
      try {
        const res = await appointmentApi.getByPatient(user.userId);
        // filter CONSULTATION_DONE and COMPLETED appointments
        const eligible = (res.data || []).filter(
          (app) => app.status === 'CONSULTATION_DONE' || app.status === 'COMPLETED'
        );
        setAppointments(eligible);
      } catch (err) {
        toast.error('Failed to load appointment list');
      } finally {
        setLoading(false);
      }
    };
    loadAppointments();
  }, [user]);

  const handleSelectAppointment = async (e) => {
    const appId = e.target.value;
    setSelectedAppId(appId);
    if (!appId) {
      setPrescription(null);
      return;
    }

    setLoadingPrescription(true);
    setPrescription(null);
    try {
      const res = await prescriptionApi.getByAppointment(appId);
      setPrescription(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Prescription details not found for selected appointment.');
    } finally {
      setLoadingPrescription(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Prescriptions</h1>
        <p className="text-sm text-slate-500">Access and read instructions on prescriptions issued by consulting doctors</p>
      </div>

      {/* Select Box */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm max-w-md space-y-2">
        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Select Appointment Slot</label>
        <select
          value={selectedAppId}
          onChange={handleSelectAppointment}
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-800 focus:border-blue-500 focus:outline-none"
        >
          <option value="">-- Choose Appointment Slot --</option>
          {appointments.map((app) => (
            <option key={app.id || app.appointmentId} value={app.id || app.appointmentId}>
              ID: #{app.id || app.appointmentId} | Dr. {app.doctorName} ({app.status})
            </option>
          ))}
        </select>
      </div>

      {/* Prescription View */}
      <div className="space-y-4">
        {loadingPrescription ? (
          <LoadingSpinner />
        ) : prescription ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-100 max-w-2xl space-y-6 animate-fade-in text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Prescription Details</h3>
                  <p className="text-xs text-slate-400">Appointment #{prescription.appointmentId}</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3.5 py-1 text-xs text-emerald-700 font-semibold uppercase tracking-wide">
                {prescription.status || 'ISSUED'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">Consulting Physician</p>
                <p className="font-bold text-slate-800 mt-0.5">{prescription.doctorName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">Primary Diagnosis</p>
                <p className="font-bold text-slate-800 mt-0.5">{prescription.diagnosis || 'N/A'}</p>
              </div>
            </div>

            {/* Prescribed Medicines List */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Prescribed Medications</p>
              <div className="space-y-2">
                {(prescription.medicines || []).map((m, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-sm">
                    <div>
                      <p className="font-bold text-slate-800">{m.medicineName}</p>
                      <p className="text-xs text-slate-500">Dosage: {m.dosage} | Frequency: {m.frequency}</p>
                    </div>
                    <div className="text-right text-xs">
                      <p className="font-semibold text-blue-600">Qty: {m.quantity}</p>
                      <p className="text-slate-400">{m.duration}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {prescription.instructions && (
              <div className="pt-3 border-t border-slate-100">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Special Instructions</p>
                <p className="text-slate-700 text-xs italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                  "{prescription.instructions}"
                </p>
              </div>
            )}
          </div>
        ) : (
          selectedAppId && (
            <p className="text-sm text-slate-400 text-center py-6">No prescription document matches this appointment ID.</p>
          )
        )}
      </div>
    </div>
  );
}
