/**
 * Patient Book Appointment Page
 *
 * Implements POST /api/appointments and GET /api/appointments/available-slots
 * Swagger Request Schema: { patientId, doctorId, departmentId, appointmentDate, symptoms }
 */
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Calendar, Clock, HelpCircle, ArrowRight, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import departmentApi from '../../api/departmentApi';
import doctorApi from '../../api/doctorApi';
import appointmentApi from '../../api/appointmentApi';

export default function BookAppointment() {
  const { user } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState('');

  // Date & Available Slots State
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [fetchingSlots, setFetchingSlots] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState('');

  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdAppt, setCreatedAppt] = useState(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const loadDepts = async () => {
      try {
        const res = await departmentApi.getAll();
        setDepartments(res.data || []);
      } catch (err) {
        console.error(err);
      }
    };
    loadDepts();
  }, []);

  useEffect(() => {
    if (selectedDeptId) {
      const loadDocs = async () => {
        try {
          const res = await doctorApi.getByDepartment(selectedDeptId);
          setDoctors(res.data || []);
          setSelectedDocId('');
          setAvailableSlots([]);
        } catch (err) {
          console.error(err);
        }
      };
      loadDocs();
    } else {
      setDoctors([]);
      setAvailableSlots([]);
    }
  }, [selectedDeptId]);

  // Fetch available slots from GET /api/appointments/available-slots
  useEffect(() => {
    if (selectedDocId && selectedDate) {
      const fetchSlots = async () => {
        setFetchingSlots(true);
        try {
          const res = await appointmentApi.getAvailableSlots(selectedDocId, selectedDate);
          setAvailableSlots(res.data || []);
        } catch (err) {
          console.error(err);
          setAvailableSlots([]);
        } finally {
          setFetchingSlots(false);
        }
      };
      fetchSlots();
    }
  }, [selectedDocId, selectedDate]);

  const handleSlotSelect = (slot) => {
    if (!slot) return;

    // If slot is full ISO e.g. "2026-07-24T18:00:00"
    if (slot.includes('T')) {
      setAppointmentDate(slot.slice(0, 16));
      return;
    }

    const baseDate = selectedDate || new Date().toISOString().split('T')[0];

    // Check if slot is 12-hour format like "06:00 pm" or "10:00 am"
    const match12 = slot.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
    if (match12) {
      let hours = parseInt(match12[1], 10);
      const minutes = match12[2];
      const ampm = match12[3].toLowerCase();
      if (ampm === 'pm' && hours < 12) hours += 12;
      if (ampm === 'am' && hours === 12) hours = 0;
      const hh = String(hours).padStart(2, '0');
      setAppointmentDate(`${baseDate}T${hh}:${minutes}`);
      return;
    }

    // Check if slot is 24-hour format like "18:00" or "18:00:00"
    const match24 = slot.match(/^(\d{1,2}):(\d{2})/);
    if (match24) {
      const hh = String(match24[1]).padStart(2, '0');
      const mm = match24[2];
      setAppointmentDate(`${baseDate}T${hh}:${mm}`);
      return;
    }

    setAppointmentDate(slot);
  };

  const formatForBackend = (dateInput) => {
    if (!dateInput) return '';

    if (typeof dateInput === 'string' && dateInput.includes('T')) {
      const parts = dateInput.split('T');
      const timePart = parts[1].length === 5 ? `${parts[1]}:00` : parts[1];
      return `${parts[0]}T${timePart}`;
    }

    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return dateInput;

    const pad = (n) => String(n).padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const min = pad(d.getMinutes());
    const ss = pad(d.getSeconds());

    return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}`;
  };

  /** Submit POST /api/appointments */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDocId || !appointmentDate || !symptoms.trim()) {
      toast.error('Please complete all required fields');
      return;
    }

    setLoading(true);
    setHasError(false);

    const pId = Number(user?.userId || user?.id || user?.patientId || 1);
    const docId = Number(selectedDocId);
    const deptId = Number(selectedDeptId);
    const primaryApptDate = formatForBackend(appointmentDate);

    const payload = {
      patientId: pId,
      doctorId: docId,
      departmentId: deptId,
      appointmentDate: primaryApptDate,
      symptoms: symptoms.trim(),
    };

    try {
      let res;
      try {
        // Attempt 1: Standard LocalDateTime "YYYY-MM-DDTHH:mm:ss"
        res = await appointmentApi.create(payload);
      } catch (firstErr) {
        if (firstErr.response && firstErr.response.status === 500) {
          console.warn('500 received with LocalDateTime format, trying ISO string...');
          // Attempt 2: ISO string with timezone "2026-07-24T18:00:00.000Z"
          try {
            const isoPayload = { ...payload, appointmentDate: new Date(appointmentDate).toISOString() };
            res = await appointmentApi.create(isoPayload);
          } catch (secondErr) {
            if (secondErr.response && secondErr.response.status === 500) {
              console.warn('500 received with ISO format, trying space format...');
              // Attempt 3: Space separator "YYYY-MM-DD HH:mm:ss"
              const spacePayload = { ...payload, appointmentDate: primaryApptDate.replace('T', ' ') };
              res = await appointmentApi.create(spacePayload);
            } else {
              throw secondErr;
            }
          }
        } else {
          throw firstErr;
        }
      }

      setCreatedAppt(res.data);
      toast.success('Appointment request submitted successfully!');
    } catch (err) {
      console.error('Final appointment booking error:', err);
      if (err.response && (err.response.status === 403 || err.response.status === 401)) {
        setHasError(true);
        toast.error('Access Denied: Appointment creation is restricted to Front Desk.');
      } else {
        toast.error(err.response?.data?.message || 'Failed to submit appointment request');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedDeptId('');
    setSelectedDocId('');
    setSelectedDate('');
    setAvailableSlots([]);
    setAppointmentDate('');
    setSymptoms('');
    setCreatedAppt(null);
    setHasError(false);
  };

  const formatSlotTime = (slot) => {
    if (!slot) return '';
    if (slot.toLowerCase().includes('am') || slot.toLowerCase().includes('pm')) {
      return slot;
    }
    try {
      const d = slot.includes('T') ? new Date(slot) : new Date(`2000-01-01T${slot}`);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      }
    } catch (e) {
      // ignore
    }
    return slot;
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Schedule Appointment</h1>
        <p className="text-sm text-slate-500">Book an appointment for doctor consultation</p>
      </div>

      {createdAppt ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-6 shadow-sm space-y-4 animate-scale-in">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Appointment Request Submitted!</h3>
              <p className="text-xs text-slate-500">Your appointment is pending review</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-emerald-100 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Appointment ID:</span>
              <span className="font-bold text-slate-800">#{createdAppt.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Doctor:</span>
              <span className="font-bold text-slate-800">{createdAppt.doctorName || `Doctor #${createdAppt.doctorId}`}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Department:</span>
              <span className="font-bold text-slate-800">{createdAppt.departmentName || `Dept #${createdAppt.departmentId}`}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Scheduled Date & Time:</span>
              <span className="font-bold text-slate-800">{new Date(createdAppt.appointmentDate).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Symptoms:</span>
              <span className="font-bold text-slate-800">{createdAppt.symptoms}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Status:</span>
              <span className="font-bold text-amber-700">{createdAppt.status}</span>
            </div>
          </div>

          <button
            onClick={resetForm}
            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 text-xs transition-colors"
          >
            Book Another Appointment
          </button>
        </div>
      ) : hasError ? (
        <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-6 shadow-sm space-y-4 animate-scale-in text-left">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <HelpCircle className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-bold text-slate-800">Hospital Booking Protocol Notice</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Patient self-booking via application endpoints is currently restricted. Please call or register your details with the **Front Desk / Receptionist Desk** to finalize your physician appointment slots.
            </p>
          </div>
          <div className="border-t border-slate-200/60 pt-4 flex flex-col gap-2 text-xs text-slate-500 font-semibold">
            <div className="flex items-center gap-1.5">
              <ArrowRight className="h-3.5 w-3.5 text-blue-600" />
              <span>Provide Patient ID: #{user.userId}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ArrowRight className="h-3.5 w-3.5 text-blue-600" />
              <span>Select Specialist Department and Doctor</span>
            </div>
          </div>
          <button
            onClick={() => setHasError(false)}
            className="rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 transition-colors"
          >
            Retry Request Form
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Select Department *</label>
                <select
                  value={selectedDeptId}
                  onChange={(e) => setSelectedDeptId(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm"
                >
                  <option value="">-- Choose Department --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.departmentName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Select Doctor *</label>
                <select
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(e.target.value)}
                  disabled={!selectedDeptId}
                  required
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm"
                >
                  <option value="">-- Choose Doctor --</option>
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      Dr. {doc.firstName} {doc.lastName} ({doc.specialization})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date & Slot selection */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Select Date *</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Appointment Date & Time *</label>
                <input
                  type="datetime-local"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm"
                />
              </div>
            </div>

            {/* Available Slots */}
            {selectedDocId && selectedDate && (
              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 space-y-2">
                <p className="text-xs font-bold text-blue-800 flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-blue-600" />
                  Available Slots for {selectedDate}:
                </p>
                {fetchingSlots ? (
                  <p className="text-xs text-slate-500">Checking slot availability...</p>
                ) : availableSlots.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {availableSlots.map((slot, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSlotSelect(slot)}
                        className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-600 hover:text-white transition-colors"
                      >
                        {formatSlotTime(slot)}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No specific slots returned. Select time directly in the datetime picker above.</p>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Symptoms / Reason for Visit *</label>
              <textarea
                placeholder="Briefly describe what symptoms you want to discuss with the doctor..."
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                rows={3}
                required
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 transition-colors disabled:opacity-50 text-sm"
            >
              {loading ? 'Submitting...' : 'Request Appointment Slot'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
