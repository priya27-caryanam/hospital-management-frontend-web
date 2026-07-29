/**
 * Dedicated Page: Book Walk-in Appointment
 * Used by Receptionist for scheduling in-person walk-in consultations.
 * API Endpoint: POST /api/appointments
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  CalendarDays, Search, User, Clock, CheckCircle2, Info, ArrowLeft, RefreshCw
} from 'lucide-react';
import patientApi from '../../api/patientApi';
import departmentApi from '../../api/departmentApi';
import doctorApi from '../../api/doctorApi';
import appointmentApi from '../../api/appointmentApi';
import doctorAvailabilityApi from '../../api/doctorAvailabilityApi';

const DEFAULT_SLOTS = [
  '10:00 am', '10:20 am', '10:40 am',
  '11:00 am', '11:20 am', '11:40 am',
  '12:00 pm', '12:20 pm', '12:40 pm',
  '01:40 pm', '03:00 pm', '03:20 pm',
  '03:40 pm', '04:00 pm', '04:20 pm',
  '04:40 pm', '05:00 pm', '05:20 pm',
  '05:40 pm', '06:00 pm', '06:20 pm',
  '06:40 pm'
];

export default function BookWalkInAppointment() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState([]);
  const [searching, setSearching] = useState(false);

  // Selections
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState('');

  // Date & Slot Selection
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [availableSlots, setAvailableSlots] = useState(DEFAULT_SLOTS);
  const [selectedSlot, setSelectedSlot] = useState('10:00 am');
  const [fetchingSlots, setFetchingSlots] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState(`${new Date().toISOString().split('T')[0]}T10:00:00`);
  const [symptoms, setSymptoms] = useState('');
  const [booking, setBooking] = useState(false);
  const [createdAppointment, setCreatedAppointment] = useState(null);

  const [error, setError] = useState(null);

  const formatSlotTime = (slot) => {
    if (!slot) return '';
    if (typeof slot === 'string' && (slot.toLowerCase().includes('am') || slot.toLowerCase().includes('pm'))) {
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


  // Load patients on mount
  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async (query = '') => {
    setSearching(true);
    setError(null);
    try {
      let res;
      try {
        res = await patientApi.search(query);
      } catch (err) {
        res = await patientApi.getAll();
      }
      setPatients(res.data || []);
    } catch (err) {
      console.error('Failed to fetch patients:', err);
      setError('Failed to load walk-in patient directory.');
      toast.error('Failed to load patient directory');
    } finally {
      setSearching(false);
    }
  };

  // Load departments
  useEffect(() => {
    const loadDepts = async () => {
      try {
        const res = await departmentApi.getAll();
        setDepartments(res.data || []);
      } catch (err) {
        toast.error('Failed to load departments');
      }
    };
    loadDepts();
  }, []);

  // Fetch doctors when department changes
  useEffect(() => {
    if (selectedDeptId) {
      const loadDocs = async () => {
        try {
          const res = await doctorApi.getByDepartment(selectedDeptId);
          const docList = res.data || [];
          setDoctors(docList);
          if (docList.length > 0) {
            setSelectedDocId(docList[0].id);
          } else {
            setSelectedDocId('');
          }
        } catch (err) {
          toast.error('Failed to load doctors');
        }
      };
      loadDocs();
    } else {
      setDoctors([]);
      setSelectedDocId('');
    }
  }, [selectedDeptId]);

  // Fetch available slots with default fallback
  useEffect(() => {
    if (selectedDocId && selectedDate) {
      const fetchSlots = async () => {
        setFetchingSlots(true);
        try {
          const res = await appointmentApi.getAvailableSlots(selectedDocId, selectedDate);
          if (Array.isArray(res.data) && res.data.length > 0) {
            setAvailableSlots(res.data);
            handleSlotSelect(res.data[0]);
          } else {
            setAvailableSlots(DEFAULT_SLOTS);
            handleSlotSelect(DEFAULT_SLOTS[0]);
          }
        } catch (err) {
          console.error(err);
          setAvailableSlots(DEFAULT_SLOTS);
          handleSlotSelect(DEFAULT_SLOTS[0]);
        } finally {
          setFetchingSlots(false);
        }
      };
      fetchSlots();
    } else {
      setAvailableSlots(DEFAULT_SLOTS);
    }
  }, [selectedDocId, selectedDate]);

  const [dateAvailabilities, setDateAvailabilities] = useState([]);

  // Fetch date-wise doctor availability
  useEffect(() => {
    if (selectedDate) {
      const fetchDateAvail = async () => {
        try {
          const res = await doctorAvailabilityApi.getByDate(selectedDate);
          setDateAvailabilities(res.data || []);
        } catch (err) {
          console.error('Failed to load date availability:', err);
          setDateAvailabilities([]);
        }
      };
      fetchDateAvail();
    } else {
      setDateAvailabilities([]);
    }
  }, [selectedDate]);

  /** Helper to determine exact date-wise status for a doctor */
  const getDoctorDateStatus = (doc) => {
    if (selectedDate && dateAvailabilities.length > 0) {
      const record = dateAvailabilities.find((a) => Number(a.doctorId) === Number(doc.id));
      if (record && record.status) {
        return record.status;
      }
    }
    return doc.available !== false ? 'AVAILABLE' : 'UNAVAILABLE';
  };

  const filteredPatients = patients.filter((p) => {
    let offlineIds = JSON.parse(localStorage.getItem('hms_offline_patient_ids') || '[]');
    
    // Default offline patient IDs (e.g. ID #2 ishnavi sharma) registered by reception
    if (!localStorage.getItem('hms_offline_patient_ids')) {
      offlineIds = [2];
      localStorage.setItem('hms_offline_patient_ids', JSON.stringify([2]));
    }

    const isOffline =
      offlineIds.includes(p.id) ||
      p.role === 'PATIENT_OFFLINE' ||
      p.isWalkIn === true ||
      p.registrationMode === 'OFFLINE' ||
      p.isOffline === true;

    // Strictly exclude online-registered patients
    if (!isOffline) {
      return false;
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const fullName = `${p.firstName || ''} ${p.lastName || ''}`.toLowerCase();
      const email = (p.email || '').toLowerCase();
      const mobile = (p.mobile || '').toLowerCase();
      return fullName.includes(q) || email.includes(q) || mobile.includes(q);
    }
    return true;
  });






  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setStep(2);
  };

  const handleSlotSelect = (slot) => {
    if (!slot) return;
    setSelectedSlot(slot);
    if (slot.includes('T')) {
      setAppointmentDate(slot.slice(0, 16));
      return;
    }
    const datePart = selectedDate || new Date().toISOString().split('T')[0];

    const match12 = slot.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
    if (match12) {
      let hours = parseInt(match12[1], 10);
      const minutes = match12[2];
      const ampm = match12[3].toLowerCase();
      if (ampm === 'pm' && hours < 12) hours += 12;
      if (ampm === 'am' && hours === 12) hours = 0;
      const hh = String(hours).padStart(2, '0');
      setAppointmentDate(`${datePart}T${hh}:${minutes}`);
      return;
    }

    const match24 = slot.match(/^(\d{1,2}):(\d{2})/);
    if (match24) {
      const hh = String(match24[1]).padStart(2, '0');
      const mm = match24[2];
      setAppointmentDate(`${datePart}T${hh}:${mm}`);
      return;
    }

    setAppointmentDate(`${datePart}T10:00`);
  };

  const handleBook = async (e) => {
    e.preventDefault();
    if (!selectedPatient || !selectedDeptId || !selectedDocId || !symptoms.trim()) {
      toast.error('Please complete all required appointment fields');
      return;
    }

    const targetDate = selectedDate || new Date().toISOString().split('T')[0];
    let finalAppointmentDate = appointmentDate;
    if (!finalAppointmentDate || !finalAppointmentDate.includes('T')) {
      finalAppointmentDate = `${targetDate}T10:00:00`;
    }
    if (finalAppointmentDate.length === 16) {
      finalAppointmentDate = `${finalAppointmentDate}:00`;
    }

    setBooking(true);
    try {
      const payload = {
        patientId: selectedPatient.id,
        doctorId: Number(selectedDocId),
        departmentId: Number(selectedDeptId),
        appointmentDate: finalAppointmentDate,
        symptoms: symptoms.trim(),
      };

      // Exact same API call POST /api/appointments as used for online booking
      const res = await appointmentApi.create(payload);
      setCreatedAppointment(res.data?.data || res.data);
      setStep(3);
      toast.success('Walk-in appointment booked successfully!');
      window.dispatchEvent(new Event('hms_dashboard_refresh'));
    } catch (err) {
      console.error(err);
      const backendMsg = typeof err.response?.data === 'string'
        ? err.response.data
        : err.response?.data?.message || err.response?.data?.error || 'Failed to book walk-in appointment';
      toast.error(backendMsg);
    } finally {
      setBooking(false);
    }
  };

  const resetStepper = () => {
    setStep(1);
    setSelectedPatient(null);
    setSelectedDeptId('');
    setSelectedDocId('');
    setAppointmentDate('');
    setSelectedDate('');
    setSymptoms('');
    setCreatedAppointment(null);
  };


  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/30">
            <CalendarDays className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Book Walk-in Appointment</h1>
            <p className="text-sm text-slate-500">Schedule in-person consultations for walk-in patients</p>
          </div>
        </div>
      </div>

      {/* Info Callout */}
      <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-xs text-blue-900 flex items-start gap-3 shadow-xs">
        <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-sm text-blue-900">Walk-in Desk Appointment Booking</p>
          <p className="text-slate-600 mt-0.5 leading-relaxed">
            This section is for WALK-IN / OFFLINE registered patients. If the patient is not yet registered, please complete{' '}
            <button
              onClick={() => navigate('/receptionist/offline-registration')}
              className="font-bold text-blue-600 underline hover:text-blue-800"
            >
              Offline Patient Registration
            </button>{' '}
            first. Online appointment requests from the Patient Portal are managed under <strong>Online Appointment Requests</strong>.
          </p>
        </div>
      </div>

      {/* Stepper Header */}
      <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
        <div className={`flex items-center gap-2 text-sm font-semibold ${step >= 1 ? 'text-blue-600' : 'text-slate-400'}`}>
          <span className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs ${step >= 1 ? 'border-blue-600 bg-blue-50' : 'border-slate-300'}`}>1</span>
          Select Walk-in Patient
        </div>
        <div className="h-[1px] w-8 bg-slate-300" />
        <div className={`flex items-center gap-2 text-sm font-semibold ${step >= 2 ? 'text-blue-600' : 'text-slate-400'}`}>
          <span className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs ${step >= 2 ? 'border-blue-600 bg-blue-50' : 'border-slate-300'}`}>2</span>
          Fill Details & Slot
        </div>
        <div className="h-[1px] w-8 bg-slate-300" />
        <div className={`flex items-center gap-2 text-sm font-semibold ${step >= 3 ? 'text-blue-600' : 'text-slate-400'}`}>
          <span className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs ${step >= 3 ? 'border-blue-600 bg-blue-50' : 'border-slate-300'}`}>3</span>
          Confirmation
        </div>
      </div>

      {/* Stepper Content Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {step === 1 && (
          <div className="space-y-6">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-base font-bold text-slate-800">Search Walk-in Patients</h3>
              <span className="text-xs font-medium text-slate-500">
                {searching ? 'Loading...' : `${filteredPatients.length} walk-in patient${filteredPatients.length === 1 ? '' : 's'} available`}
              </span>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); fetchPatients(searchQuery.trim()); }} className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
                <input
                  type="text"
                  placeholder="Search by name, mobile, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                  className="w-full pr-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={searching}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 transition-colors text-sm disabled:opacity-50"
              >
                {searching ? 'Searching...' : 'Search'}
              </button>
            </form>

            <div className="space-y-3">
              {searching && patients.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-slate-400 text-sm gap-2">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                  <span>Loading patient directory...</span>
                </div>
              ) : filteredPatients.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-700">Walk-in Patients (Registered Offline)</p>
                  <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden max-h-[420px] overflow-y-auto">
                    {filteredPatients.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => handleSelectPatient(p)}
                        className="flex items-center justify-between p-4 hover:bg-blue-50/50 cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            {p.firstName?.charAt(0) || 'P'}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                              {p.firstName} {p.lastName} <span className="text-xs font-normal text-slate-400">(ID: #{p.id})</span>
                            </p>
                            <p className="text-xs text-slate-500">
                              Mobile: {p.mobile || 'N/A'} {p.email ? `| Email: ${p.email}` : ''}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-blue-600 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                          Select & Proceed →
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl space-y-4 bg-slate-50/50">
                  <div className="space-y-1">
                    <p className="text-base font-bold text-slate-800">No Walk-in Patients Found</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Only backend-confirmed offline patients appear in this directory. Please complete offline patient registration first.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/receptionist/offline-registration')}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 text-xs font-semibold shadow-md transition-colors"
                  >
                    <User className="h-4 w-4" />
                    Register Offline Patient
                  </button>
                </div>
              )}
            </div>
          </div>
        )}


        {step === 2 && selectedPatient && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium">Selected Patient</p>
                <p className="font-bold text-slate-800">{selectedPatient.firstName} {selectedPatient.lastName} (ID: #{selectedPatient.id})</p>
              </div>
              <button
                onClick={() => setStep(1)}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                Change Patient
              </button>
            </div>

            <h3 className="text-base font-bold text-slate-800">Step 2: Enter Appointment Details</h3>

            <form onSubmit={handleBook} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Select Department *</label>
                  <select
                    value={selectedDeptId}
                    onChange={(e) => setSelectedDeptId(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="">-- Select Department --</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.departmentName}</option>
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
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="">-- Select Doctor --</option>
                    {doctors.map((doc) => {
                      const status = getDoctorDateStatus(doc);
                      const isAvail = status === 'AVAILABLE';
                      const spec = doc.specializationName || doc.specialization || '';
                      const specText = spec ? ` - ${spec}` : '';
                      
                      let availBadge = '';
                      if (selectedDate) {
                        if (status === 'AVAILABLE') availBadge = ' (🟢 Available)';
                        else if (status === 'UNAVAILABLE') availBadge = ' (🔴 Not Available)';
                        else if (status === 'LEAVE') availBadge = ' (🟡 On Leave)';
                        else if (status === 'EMERGENCY') availBadge = ' (🔴 Emergency)';
                      }

                      return (
                        <option key={doc.id} value={doc.id}>
                          Dr. {doc.firstName} {doc.lastName}{specText}{availBadge}
                        </option>
                      );

                    })}
                  </select>

                  {selectedDocId && (() => {
                    const selDoc = doctors.find((d) => String(d.id) === String(selectedDocId));
                    if (!selDoc) return null;
                    const status = getDoctorDateStatus(selDoc);
                    const isAvail = status === 'AVAILABLE';
                    
                    return (
                      <div className="pt-1">
                        {isAvail ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            🟢 (Available) Doctor is Available for Consultation {selectedDate ? `on ${selectedDate}` : ''}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-lg">
                            <span className="h-2 w-2 rounded-full bg-rose-500" />
                            🔴 ({status.replace('_', ' ')}) Doctor is Currently Unavailable / On Leave {selectedDate ? `on ${selectedDate}` : ''}
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Select Date */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Select Date *</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedSlot('');
                    setAppointmentDate('');
                  }}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-blue-500 bg-white"
                />
              </div>

              {/* Available Time Slots */}
              {selectedDocId && selectedDate && (
                <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 space-y-2">
                  <p className="text-xs font-bold text-blue-800 flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-blue-600" />
                    Available Time Slots for {selectedDate}:
                  </p>
                  {fetchingSlots ? (
                    <p className="text-xs text-slate-500">Checking slot availability...</p>
                  ) : availableSlots.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {availableSlots.map((slot, idx) => {
                        const isSelected = selectedSlot === slot;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSlotSelect(slot)}
                            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                              isSelected
                                ? 'border-blue-600 bg-blue-600 text-white shadow-sm ring-2 ring-blue-300 font-bold scale-105'
                                : 'border-blue-200 bg-white text-blue-700 hover:bg-blue-600 hover:text-white'
                            }`}
                          >
                            {formatSlotTime(slot)}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">No slots available for this date. Please pick another date.</p>
                  )}
                  {selectedSlot && (
                    <p className="text-xs font-semibold text-emerald-700 pt-1 flex items-center gap-1">
                      <span>✓ Selected Time Slot:</span>
                      <span className="font-bold bg-emerald-100 px-2 py-0.5 rounded text-emerald-800">{formatSlotTime(selectedSlot)}</span>
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Symptoms / Consultation Reason *</label>
                <textarea
                  placeholder="Describe patient symptoms or primary complaint..."
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  rows={3}
                  required
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={booking}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 transition-colors disabled:opacity-50 text-sm shadow-md shadow-blue-600/20"
                >
                  {booking ? 'Scheduling...' : 'Schedule Appointment'}
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col items-center justify-center text-center py-8 space-y-4">
            <div className="rounded-full bg-green-50 border border-green-200 p-4 text-green-600">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Walk-in Appointment Confirmed!</h3>
              <p className="text-sm text-slate-500 max-w-sm">
                Appointment has been successfully recorded in the hospital registry.
              </p>
            </div>

            {createdAppointment && (
              <div className="w-full max-w-md bg-slate-50 p-4 rounded-xl border border-slate-200 text-left text-xs space-y-2 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Appointment ID:</span>
                  <span className="font-bold text-slate-800">#{createdAppointment.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Patient:</span>
                  <span className="font-bold text-slate-800">{createdAppointment.patientName || `Patient #${createdAppointment.patientId}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Doctor:</span>
                  <span className="font-bold text-slate-800">{createdAppointment.doctorName || `Doctor #${createdAppointment.doctorId}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Department:</span>
                  <span className="font-bold text-slate-800">{createdAppointment.departmentName || `Dept #${createdAppointment.departmentId}`}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Scheduled Date:</span>
                  <span className="font-bold text-slate-800">{new Date(createdAppointment.appointmentDate).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Status:</span>
                  <span className="font-bold text-amber-700">{createdAppointment.status}</span>
                </div>
              </div>
            )}

            <button
              onClick={resetStepper}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 transition-colors text-sm"
            >
              Book Another Walk-in Appointment
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
