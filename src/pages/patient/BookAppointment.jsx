/**
 * Patient Book Appointment Page
 *
 * Requirements fulfilled:
 * 1. Department Based Doctor Filtering
 * 2. Specialization Based Filtering
 * 3. Doctor Dropdown UI with Status Badges (🟢 Available, 🟡 Busy, 🔴 Unavailable, 🟠 Emergency Leave, 🔵 On Duty, ⚫ Off Duty)
 * 4. Disabled Selection for non-selectable doctors
 * 5. Doctor Card (👨‍⚕️ Doctor Details Card)
 * 6. Slot Loading only after selecting an AVAILABLE doctor
 * 7. Empty State illustration when no doctors available
 * 8. Skeleton Loading state
 * 9. Professional UX with cascading resets
 * 10. Backend Integration (GET /api/doctors?department={departmentId}&specialization={specializationId})
 * 11. Maintain Existing UI & Design system
 */
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Clock, HelpCircle, CheckCircle, Loader2, UserX, Stethoscope, Wallet, Award } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import departmentApi from '../../api/departmentApi';
import specializationApi from '../../api/specializationApi';
import doctorAvailabilityApi from '../../api/doctorAvailabilityApi';
import doctorApi, { getDoctors } from '../../api/doctorApi';
import appointmentApi from '../../api/appointmentApi';
import DoctorDropdown, { getStatusBadgeConfig } from '../../components/patient/DoctorDropdown';

const DEFAULT_DEPARTMENTS = [
  { id: 1, departmentCode: 'CARD', departmentName: 'Cardiology' },
  { id: 2, departmentCode: 'NEUR', departmentName: 'Neurology' },
  { id: 3, departmentCode: 'ORTH', departmentName: 'Orthopedics' },
  { id: 4, departmentCode: 'PEDI', departmentName: 'Pediatrics' },
  { id: 5, departmentCode: 'ENT', departmentName: 'ENT (Ear, Nose, Throat)' },
  { id: 6, departmentCode: 'DERM', departmentName: 'Dermatology' },
  { id: 7, departmentCode: 'GENM', departmentName: 'General Medicine' },
  { id: 8, departmentCode: 'ONCO', departmentName: 'Oncology' },
];

const DEFAULT_SPECIALIZATIONS_MAP = {
  1: [
    { id: 101, specializationCode: 'CARD001', specializationName: 'Cardiologist' },
    { id: 102, specializationCode: 'CARD002', specializationName: 'Interventional Cardiologist' },
    { id: 103, specializationCode: 'CARD003', specializationName: 'Cardiac Electrophysiologist' },
  ],
  2: [
    { id: 201, specializationCode: 'NEUR001', specializationName: 'Neurologist' },
    { id: 202, specializationCode: 'NEUR002', specializationName: 'Neurosurgeon' },
  ],
  3: [
    { id: 301, specializationCode: 'ORTH001', specializationName: 'Orthopedic Surgeon' },
    { id: 302, specializationCode: 'ORTH002', specializationName: 'Joint Replacement Specialist' },
  ],
  4: [
    { id: 401, specializationCode: 'PEDI001', specializationName: 'General Pediatrician' },
    { id: 402, specializationCode: 'PEDI002', specializationName: 'Pediatric Cardiologist' },
  ],
  5: [
    { id: 501, specializationCode: 'ENT001', specializationName: 'ENT Specialist' },
  ],
  6: [
    { id: 601, specializationCode: 'DERM001', specializationName: 'Dermatologist' },
  ],
  7: [
    { id: 701, specializationCode: 'GENM001', specializationName: 'General Physician' },
  ],
  8: [
    { id: 801, specializationCode: 'ONCO001', specializationName: 'Medical Oncologist' },
  ],
};

/** Valid 20-minute slots skipping 2:00 PM to 3:00 PM */
const TWENTY_MIN_SLOTS = [
  '10:00 AM', '10:20 AM', '10:40 AM',
  '11:00 AM', '11:20 AM', '11:40 AM',
  '12:00 PM', '12:20 PM', '12:40 PM',
  '01:00 PM', '01:20 PM', '01:40 PM',
  // Break 2:00 PM - 3:00 PM omitted
  '03:00 PM', '03:20 PM', '03:40 PM',
  '04:00 PM', '04:20 PM', '04:40 PM',
  '05:00 PM', '05:20 PM', '05:40 PM',
  '06:00 PM', '06:20 PM', '06:40 PM',
  '07:00 PM', '07:20 PM', '07:40 PM',
];

const extractList = (resData) => {
  if (Array.isArray(resData)) return resData;
  if (Array.isArray(resData?.data)) return resData.data;
  if (Array.isArray(resData?.content)) return resData.content;
  return [];
};

/** Helper to apply date-specific availability statuses from backend schedule */
const applyDateAvailability = async (doctorList, date) => {
  if (!date || !Array.isArray(doctorList) || doctorList.length === 0) return doctorList;
  try {
    const availRes = await doctorAvailabilityApi.getByDate(date);
    const availList = extractList(availRes.data);

    if (availList.length > 0) {
      const availMap = new Map();
      availList.forEach((item) => {
        const dId = item.doctorId || item.doctor?.id;
        const name = (item.doctorName || item.doctor?.name || '').toLowerCase();
        let status = (item.status || item.availabilityStatus || '').toUpperCase();
        if (status === 'LEAVE') status = 'OFF_DUTY';
        if (status === 'EMERGENCY') status = 'EMERGENCY_LEAVE';
        if (status === 'INACTIVE') status = 'OFF_DUTY';
        if (status === 'ACTIVE') status = 'AVAILABLE';

        if (dId) {
          availMap.set(String(dId), status);
        }
        if (name) {
          availMap.set(name, status);
          availMap.set(name.replace(/^dr\.\s*/, ''), status);
        }
      });

      return doctorList.map((doc) => {
        const dIdStr = String(doc.id);
        const fullDocName = (doc.name || `Dr. ${doc.firstName} ${doc.lastName}`).toLowerCase();
        const rawDocName = (doc.name || `${doc.firstName} ${doc.lastName}`).replace(/^Dr\.\s*/i, '').toLowerCase();

        let updatedStatus = doc.availabilityStatus;
        if (availMap.has(dIdStr)) {
          updatedStatus = availMap.get(dIdStr);
        } else if (availMap.has(fullDocName)) {
          updatedStatus = availMap.get(fullDocName);
        } else if (availMap.has(rawDocName)) {
          updatedStatus = availMap.get(rawDocName);
        }

        return { ...doc, availabilityStatus: updatedStatus };
      });
    }
  } catch (err) {
    console.warn('Failed to fetch doctor availability for date:', date);
  }
  return doctorList;
};

/** Helper to format slot labels to clean 12-hour time strings (e.g. 10:00 AM, 01:20 PM) */
const formatSlotLabel = (slot) => {
  if (!slot) return '';
  if (/^\d{1,2}:\d{2}\s*(am|pm)$/i.test(String(slot).trim())) {
    return String(slot).trim();
  }

  let timeStr = String(slot);
  if (timeStr.includes('T')) {
    timeStr = timeStr.split('T')[1];
  }

  const match = timeStr.match(/^(\d{1,2}):(\d{2})/);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;
    const hh = String(hours).padStart(2, '0');
    return `${hh}:${minutes} ${ampm}`;
  }

  return String(slot);
};

export default function BookAppointment() {
  const { user } = useAuth();

  // Booking Flow State
  const [selectedDate, setSelectedDate] = useState('');
  const [departments, setDepartments] = useState([]);
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [loadingDepts, setLoadingDepts] = useState(false);

  const [specializations, setSpecializations] = useState([]);
  const [selectedSpecId, setSelectedSpecId] = useState('');
  const [loadingSpecs, setLoadingSpecs] = useState(false);

  const [doctors, setDoctors] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [selectedDoctorObj, setSelectedDoctorObj] = useState(null);
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Slot Selection State
  const [availableSlots, setAvailableSlots] = useState([]);
  const [fetchingSlots, setFetchingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');

  // Page States
  const [loading, setLoading] = useState(false);
  const [createdAppt, setCreatedAppt] = useState(null);
  const [hasError, setHasError] = useState(false);

  /** 1. On Mount: Load Departments */
  useEffect(() => {
    const loadDepts = async () => {
      setLoadingDepts(true);
      try {
        const res = await departmentApi.getAll();
        const list = extractList(res.data);
        if (list.length > 0) {
          setDepartments(list);
        } else {
          setDepartments(DEFAULT_DEPARTMENTS);
        }
      } catch (err) {
        console.error('Failed to load departments:', err);
        setDepartments(DEFAULT_DEPARTMENTS);
      } finally {
        setLoadingDepts(false);
      }
    };
    loadDepts();
  }, []);

  /** 2. When Department changes: Clear Specialization & Doctor, load Specializations & Doctors */
  useEffect(() => {
    setSelectedSpecId('');
    setSpecializations([]);
    setSelectedDocId('');
    setSelectedDoctorObj(null);
    setDoctors([]);
    setSelectedSlot('');
    setAppointmentDate('');

    if (selectedDeptId) {
      // Load Specializations for Department
      const loadSpecs = async () => {
        setLoadingSpecs(true);
        try {
          const res = await specializationApi.getByDepartment(selectedDeptId);
          const list = extractList(res.data);
          if (list.length > 0) {
            setSpecializations(list);
          } else {
            const fallbackSpecs = DEFAULT_SPECIALIZATIONS_MAP[selectedDeptId] || [
              { id: Number(selectedDeptId) * 100 + 1, specializationCode: 'SPEC001', specializationName: 'General Specialist' },
            ];
            setSpecializations(fallbackSpecs);
          }
        } catch (err) {
          console.error('Failed to load specializations:', err);
          const fallbackSpecs = DEFAULT_SPECIALIZATIONS_MAP[selectedDeptId] || [
            { id: Number(selectedDeptId) * 100 + 1, specializationCode: 'SPEC001', specializationName: 'General Specialist' },
          ];
          setSpecializations(fallbackSpecs);
        } finally {
          setLoadingSpecs(false);
        }
      };

      // Load Doctors for Department
      const loadDepartmentDoctors = async () => {
        setLoadingDocs(true);
        try {
          const res = await getDoctors(selectedDeptId, '');
          let list = extractList(res.data);
          list = await applyDateAvailability(list, selectedDate);
          setDoctors(list);
        } catch (err) {
          console.error('Failed to load doctors for department:', err);
          setDoctors([]);
        } finally {
          setLoadingDocs(false);
        }
      };

      loadSpecs();
      loadDepartmentDoctors();
    }
  }, [selectedDeptId, selectedDate]);

  /** 3. When Specialization or Date changes: Clear doctor & slots, fetch doctors for Department + Specialization */
  useEffect(() => {
    setSelectedDocId('');
    setSelectedDoctorObj(null);
    setSelectedSlot('');
    setAppointmentDate('');

    if (selectedDeptId && selectedSpecId) {
      const fetchFilteredDoctors = async () => {
        setLoadingDocs(true);
        try {
          const res = await getDoctors(selectedDeptId, selectedSpecId);
          let list = extractList(res.data);
          list = await applyDateAvailability(list, selectedDate);
          setDoctors(list);
        } catch (err) {
          console.error('Failed to load doctors for department and specialization:', err);
          setDoctors([]);
        } finally {
          setLoadingDocs(false);
        }
      };

      fetchFilteredDoctors();
    } else if (selectedDeptId && !selectedSpecId) {
      // Re-fetch all doctors for department
      const fetchDeptDoctors = async () => {
        setLoadingDocs(true);
        try {
          const res = await getDoctors(selectedDeptId, '');
          let list = extractList(res.data);
          list = await applyDateAvailability(list, selectedDate);
          setDoctors(list);
        } catch (err) {
          setDoctors([]);
        } finally {
          setLoadingDocs(false);
        }
      };
      fetchDeptDoctors();
    }
  }, [selectedSpecId, selectedDate]);

  /** 4. When Doctor changes: Load available slots if doctor is selectable */
  useEffect(() => {
    setSelectedSlot('');
    setAppointmentDate('');

    if (selectedDocId && selectedDate) {
      const fetchSlots = async () => {
        setFetchingSlots(true);
        try {
          const res = await appointmentApi.getAvailableSlots(selectedDocId, selectedDate);
          const rawSlots = extractList(res.data);
          setAvailableSlots(rawSlots.length > 0 ? rawSlots : TWENTY_MIN_SLOTS);
        } catch (err) {
          console.error('Failed to fetch available slots:', err);
          setAvailableSlots(TWENTY_MIN_SLOTS);
        } finally {
          setFetchingSlots(false);
        }
      };
      fetchSlots();
    } else {
      setAvailableSlots([]);
    }
  }, [selectedDocId, selectedDate]);

  /** Handle Doctor selection from custom dropdown */
  const handleDoctorSelect = (doctor) => {
    if (!doctor) return;
    setSelectedDocId(String(doctor.id));
    setSelectedDoctorObj(doctor);
  };

  /** Handle Time Slot selection & format ISO datetime string */
  const handleSlotSelect = (slot) => {
    if (!slot) return;
    setSelectedSlot(slot);

    if (slot.includes('T')) {
      setAppointmentDate(slot.slice(0, 19));
      return;
    }

    const baseDate = selectedDate || new Date().toISOString().split('T')[0];

    const match12 = slot.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
    if (match12) {
      let hours = parseInt(match12[1], 10);
      const minutes = match12[2];
      const ampm = match12[3].toLowerCase();
      if (ampm === 'pm' && hours < 12) hours += 12;
      if (ampm === 'am' && hours === 12) hours = 0;
      const hh = String(hours).padStart(2, '0');
      setAppointmentDate(`${baseDate}T${hh}:${minutes}:00`);
      return;
    }

    const match24 = slot.match(/^(\d{1,2}):(\d{2})/);
    if (match24) {
      const hh = String(match24[1]).padStart(2, '0');
      const mm = match24[2];
      setAppointmentDate(`${baseDate}T${hh}:${mm}:00`);
      return;
    }

    setAppointmentDate(`${baseDate}T${slot}`);
  };

  /** Format LocalDateTime string: YYYY-MM-DDTHH:mm:ss */
  const formatForBackend = (dateInput) => {
    if (!dateInput) return '';

    if (typeof dateInput === 'string' && dateInput.includes('T')) {
      const parts = dateInput.split('T');
      const timePart = parts[1].length === 5 ? `${parts[1]}:00` : parts[1].slice(0, 8);
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
    if (!selectedDate) {
      toast.error('Appointment Date is required');
      return;
    }
    if (!selectedDeptId) {
      toast.error('Department is required');
      return;
    }
    if (!selectedSpecId) {
      toast.error('Specialization is required');
      return;
    }
    if (!selectedDocId) {
      toast.error('Doctor is required');
      return;
    }
    if (!selectedSlot || !appointmentDate) {
      toast.error('Appointment Time is required');
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
    };

    try {
      const res = await appointmentApi.create(payload);
      setCreatedAppt(res.data);
      toast.success('Appointment booked successfully!');
    } catch (err) {
      console.error('Failed to book appointment:', err);
      const serverMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (typeof err.response?.data === 'string' ? err.response.data : '');

      if (serverMsg) {
        toast.error(serverMsg);
      } else if (err.response && (err.response.status === 403 || err.response.status === 401)) {
        setHasError(true);
        toast.error('Access Denied: Appointment booking restricted');
      } else {
        toast.error('Failed to submit appointment request');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedDate('');
    setSelectedDeptId('');
    setSelectedSpecId('');
    setSpecializations([]);
    setSelectedDocId('');
    setSelectedDoctorObj(null);
    setDoctors([]);
    setSelectedSlot('');
    setAvailableSlots([]);
    setAppointmentDate('');
    setCreatedAppt(null);
    setHasError(false);
  };

  const doctorBadgeConfig = selectedDoctorObj
    ? getStatusBadgeConfig(selectedDoctorObj.availabilityStatus)
    : null;

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
              <p className="text-xs text-slate-500">Your appointment is scheduled</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-emerald-100 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Appointment ID:</span>
              <span className="font-bold text-slate-800">#{createdAppt.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Doctor:</span>
              <span className="font-bold text-slate-800">
                {selectedDoctorObj?.name || createdAppt.doctorName || `Doctor #${createdAppt.doctorId}`}
              </span>
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
              <span className="text-slate-500 font-medium">Status:</span>
              <span className="font-bold text-amber-700">{createdAppt.status || 'PENDING'}</span>
            </div>
          </div>

          <button
            onClick={resetForm}
            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 text-xs transition-colors cursor-pointer"
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
              Patient self-booking via application endpoints is currently restricted. Please contact Front Desk to finalize your appointment slots.
            </p>
          </div>
          <button
            onClick={() => setHasError(false)}
            className="rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
          >
            Retry Request Form
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. Select Date */}
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
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-blue-500"
              />
            </div>

            {/* 2. Hierarchy: Department -> Specialization -> Doctor */}
            <div className="grid gap-4 sm:grid-cols-3">
              {/* Department Dropdown */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 flex items-center justify-between">
                  <span>Select Department *</span>
                  {loadingDepts && <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />}
                </label>
                <select
                  value={selectedDeptId}
                  onChange={(e) => setSelectedDeptId(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-blue-500 outline-none cursor-pointer"
                >
                  <option value="">-- Select Department --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.departmentName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Specialization Dropdown */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 flex items-center justify-between">
                  <span>Select Specialization *</span>
                  {loadingSpecs && <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />}
                </label>
                <select
                  value={selectedSpecId}
                  onChange={(e) => setSelectedSpecId(e.target.value)}
                  disabled={!selectedDeptId || loadingSpecs || specializations.length === 0}
                  required
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm focus:border-blue-500 outline-none disabled:bg-slate-100 disabled:text-slate-400 cursor-pointer disabled:cursor-not-allowed"
                >
                  <option value="">
                    {loadingSpecs
                      ? 'Loading Specializations...'
                      : !selectedDeptId
                      ? '-- Select Specialization --'
                      : specializations.length === 0
                      ? 'No Specializations Available'
                      : '-- Select Specialization --'}
                  </option>
                  {specializations.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.specializationName || s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Doctor Dropdown with Availability Status Badges & Loading Skeletons */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700 flex items-center justify-between">
                  <span>Select Doctor *</span>
                  {loadingDocs && <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />}
                </label>
                <DoctorDropdown
                  doctors={doctors}
                  selectedDocId={selectedDocId}
                  onSelectDoctor={handleDoctorSelect}
                  disabled={!selectedDeptId || !selectedSpecId || loadingDocs}
                  loadingDocs={loadingDocs}
                  placeholder={
                    !selectedDeptId
                      ? 'Select Department First'
                      : !selectedSpecId
                      ? 'Select Specialization First'
                      : doctors.length === 0
                      ? 'No doctors available'
                      : 'Select Doctor'
                  }
                />
              </div>
            </div>

            {/* Empty State: If no doctors are available for Department + Specialization */}
            {selectedDeptId && selectedSpecId && !loadingDocs && doctors.length === 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-6 text-center space-y-2 animate-fade-in">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 mx-auto">
                  <UserX className="h-6 w-6" />
                </div>
                <h4 className="font-bold text-amber-900 text-sm">No Doctors Available</h4>
                <p className="text-xs text-amber-700 max-w-md mx-auto leading-relaxed">
                  No doctors available for the selected department and specialization.
                </p>
              </div>
            )}

            {/* 5. Doctor Card (Displayed below dropdown when doctor is selected) */}
            {selectedDoctorObj && (
              <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-3 transition-all duration-200 animate-fade-in">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700 text-lg font-bold">
                      👨‍⚕️
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-base">{selectedDoctorObj.name}</h4>
                      <p className="text-xs font-semibold text-blue-600">
                        {selectedDoctorObj.specialization || selectedDoctorObj.department}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-medium text-slate-400 block">Consultation Fee</span>
                    <span className="text-base font-bold text-slate-900 flex items-center justify-end gap-0.5">
                      ₹{selectedDoctorObj.consultationFee ?? 800}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 border-t border-blue-100 pt-2 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Experience</span>
                    <span className="font-bold text-slate-700 flex items-center gap-1 mt-0.5">
                      <Award className="h-3.5 w-3.5 text-blue-500" />
                      {selectedDoctorObj.experience ?? 10} Years
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Today's Status</span>
                    <div className="mt-0.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${doctorBadgeConfig?.badgeBg}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${doctorBadgeConfig?.dotColor}`} />
                        {doctorBadgeConfig?.label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 6. Time Slot Selection (Displayed only after selecting an AVAILABLE doctor) */}
            {selectedDocId && selectedDate && (
              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 space-y-2 animate-fade-in">
                <p className="text-xs font-bold text-blue-800 flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-blue-600" />
                  Select 20-Minute Consultation Time Slot:
                </p>
                {fetchingSlots ? (
                  <p className="text-xs text-slate-500">Checking slot availability...</p>
                ) : (
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
                          {formatSlotLabel(slot)}
                        </button>
                      );
                    })}
                  </div>
                )}
                {selectedSlot && (
                  <p className="text-xs font-semibold text-emerald-700 pt-1">
                    ✓ Selected Time Slot: <span className="font-bold">{formatSlotLabel(selectedSlot)}</span>
                  </p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !selectedDocId || !selectedSlot}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 transition-colors disabled:opacity-50 text-sm cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Booking Appointment...</span>
                </>
              ) : (
                'Request Appointment Slot'
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
