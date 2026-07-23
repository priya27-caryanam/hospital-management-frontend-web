/**
 * ViewAppointmentDetailsModal Component
 *
 * Displays 100% of AppointmentResponse fields returned by GET /api/appointments/{id}:
 *   { id, patientId, patientName, doctorId, doctorName, departmentId, departmentName, appointmentDate, symptoms, status, createdAt, updatedAt }
 */
import { useState, useEffect } from 'react';
import { Calendar, User, Stethoscope, Building2, Clock, X, FileText, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import appointmentApi from '../../api/appointmentApi';
import LoadingSpinner from './LoadingSpinner';

export default function ViewAppointmentDetailsModal({ appointmentId, isOpen, onClose }) {
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && appointmentId) {
      const fetchDetails = async () => {
        setLoading(true);
        try {
          const res = await appointmentApi.getById(appointmentId);
          setAppointment(res.data);
        } catch (err) {
          console.error(err);
          toast.error('Failed to fetch appointment details');
        } finally {
          setLoading(false);
        }
      };
      fetchDetails();
    } else {
      setAppointment(null);
    }
  }, [isOpen, appointmentId]);

  if (!isOpen) return null;

  const formatDate = (dateStr) => (dateStr ? new Date(dateStr).toLocaleString('en-IN') : '—');

  const STATUS_STYLES = {
    PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
    APPROVED: 'bg-blue-100 text-blue-800 border-blue-200',
    CONSULTATION_COMPLETED: 'bg-purple-100 text-purple-800 border-purple-200',
    COMPLETED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    REJECTED: 'bg-rose-100 text-rose-800 border-rose-200',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-5 animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900">
              Appointment Details #{appointmentId}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-slate-100 text-slate-500 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : appointment ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 divide-y divide-slate-100 text-sm">
              {[
                ['Appointment ID', `#${appointment.id}`],
                ['Patient ID', `#${appointment.patientId}`],
                ['Patient Name', appointment.patientName || '—'],
                ['Doctor ID', `#${appointment.doctorId}`],
                ['Doctor Name', appointment.doctorName ? `Dr. ${appointment.doctorName}` : '—'],
                ['Department ID', `#${appointment.departmentId}`],
                ['Department Name', appointment.departmentName || '—'],
                ['Scheduled Date & Time', formatDate(appointment.appointmentDate)],
                ['Symptoms / Complaint', appointment.symptoms || '—'],
                ['Current Status', appointment.status],
                ['Created At', formatDate(appointment.createdAt)],
                ['Last Updated At', formatDate(appointment.updatedAt)],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between py-2.5 first:pt-0 last:pb-0">
                  <span className="text-slate-500 font-medium text-xs">{label}</span>
                  {label === 'Current Status' ? (
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${STATUS_STYLES[val] || 'bg-slate-100 text-slate-700'}`}>
                      {val}
                    </span>
                  ) : (
                    <span className="font-bold text-slate-800 text-sm">{val || '—'}</span>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={onClose}
              className="w-full rounded-xl bg-blue-600 text-white font-semibold py-2.5 text-sm hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <p className="text-center text-slate-400 py-6 text-sm">Appointment details unavailable.</p>
        )}
      </div>
    </div>
  );
}
