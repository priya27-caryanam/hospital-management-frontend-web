/**
 * Receptionist Appointments & Booking Page
 * Features:
 *  1. Book Appointment Wizard (Step 1 -> Step 2 -> Step 3)
 *  2. Manage Appointments (View, Approve, Reject, Filter)
 */
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import toast from 'react-hot-toast';
import {
  Calendar,
  Search,
  User,
  ClipboardList,
  CheckCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Filter,
  RefreshCw,
  CalendarDays,
  Receipt,
  CreditCard,
  X,
  Info,
} from 'lucide-react';
import patientApi from '../../api/patientApi';
import departmentApi from '../../api/departmentApi';
import doctorApi from '../../api/doctorApi';
import appointmentApi from '../../api/appointmentApi';
import receptionistApi from '../../api/receptionistApi';
import doctorAvailabilityApi from '../../api/doctorAvailabilityApi';
import DataTable from '../../components/common/DataTable';
import ViewAppointmentDetailsModal from '../../components/common/ViewAppointmentDetailsModal';

const STATUS_STYLES = {
  PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
  APPROVED: 'bg-blue-100 text-blue-800 border-blue-200',
  CONSULTATION_DONE: 'bg-purple-100 text-purple-800 border-purple-200',
  CONSULTATION_COMPLETED: 'bg-purple-100 text-purple-800 border-purple-200',
  COMPLETED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  REJECTED: 'bg-rose-100 text-rose-800 border-rose-200',
};

export default function BookAppointment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Page Mode: 'book' | 'manage'
  const [activePageMode, setActivePageMode] = useState('book');

  // Sync mode with URL params
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'manage') {
      setActivePageMode('manage');
    } else {
      setActivePageMode('book');
    }
  }, [searchParams]);

  // ==================== BOOKING STEPPER STATE ====================
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
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [fetchingSlots, setFetchingSlots] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [booking, setBooking] = useState(false);
  const [createdAppointment, setCreatedAppointment] = useState(null);

  // ==================== OFFLINE PATIENT REGISTRATION STATE ====================
  const [showOfflineReg, setShowOfflineReg] = useState(false);
  const [offlineRegLoading, setOfflineRegLoading] = useState(false);
  const [offlineForm, setOfflineForm] = useState({
    firstName: '',
    lastName: '',
    mobile: '',
    email: '',
    dateOfBirth: '',
    gender: 'MALE',
    address: '',
    bloodGroup: 'O+',
    height: '',
    weight: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    emergencyContact: '',
    password: 'Patient@123',
  });

  const handleOfflineRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!offlineForm.firstName || !offlineForm.lastName || !offlineForm.mobile || !offlineForm.dateOfBirth || !offlineForm.address) {
      toast.error('Please fill in all required fields (*)');
      return;
    }

    setOfflineRegLoading(true);
    try {
      const payload = {
        ...offlineForm,
        email: offlineForm.email.trim() || `patient_${Date.now()}@hospital.com`,
        emergencyContact: offlineForm.emergencyContact.trim() || offlineForm.mobile,
      };

      const res = await receptionistApi.registerPatient(payload);
      const newPatient = res.data?.data || res.data;
      toast.success('Offline patient registered successfully!');

      setShowOfflineReg(false);
      setOfflineForm({
        firstName: '',
        lastName: '',
        mobile: '',
        email: '',
        dateOfBirth: '',
        gender: 'MALE',
        address: '',
        bloodGroup: 'O+',
        height: '',
        weight: '',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        emergencyContact: '',
        password: 'Patient@123',
      });

      await fetchPatients();
      if (newPatient && (newPatient.id || newPatient.patientId)) {
        handleSelectPatient(newPatient);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to register patient offline');
    } finally {
      setOfflineRegLoading(false);
    }
  };

  // ==================== MANAGE APPOINTMENTS STATE ====================
  const [manageAppointments, setManageAppointments] = useState([]);
  const [loadingManageApps, setLoadingManageApps] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'APPROVED' | 'COMPLETED' | 'REJECTED'

  // Sync activePageMode and statusFilter with URL search parameters
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const statusParam = searchParams.get('status');
    if (tabParam === 'manage' || statusParam) {
      setActivePageMode('manage');
    }
    if (statusParam) {
      setStatusFilter(statusParam.toUpperCase());
    }
  }, [searchParams]);

  const [manageSearchText, setManageSearchText] = useState('');
  const [allDoctorsList, setAllDoctorsList] = useState([]);
  const [filterDocId, setFilterDocId] = useState('');
  const [selectedDetailApptId, setSelectedDetailApptId] = useState(null);

  // Billing Modal State
  const [paymentModalAppt, setPaymentModalAppt] = useState(null);
  const [paymentMode, setPaymentMode] = useState('CASH');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [receiptResult, setReceiptResult] = useState(null);

  // Load departments on step 2
  useEffect(() => {
    if (step === 2 && departments.length === 0) {
      const loadDepts = async () => {
        try {
          const res = await departmentApi.getAll();
          setDepartments(res.data || []);
        } catch (err) {
          toast.error('Failed to load departments');
        }
      };
      loadDepts();
    }
  }, [step, departments]);

  // Load doctors when department selected
  useEffect(() => {
    if (selectedDeptId) {
      const loadDocs = async () => {
        try {
          const res = await doctorApi.getByDepartment(selectedDeptId);
          setDoctors(res.data || []);
          setSelectedDocId('');
          setAvailableSlots([]);
        } catch (err) {
          toast.error('Failed to load doctors for selected department');
        }
      };
      loadDocs();
    } else {
      setDoctors([]);
      setAvailableSlots([]);
    }
  }, [selectedDeptId]);

  // Fetch available slots when doctor and date change: GET /api/appointments/available-slots
  useEffect(() => {
    const activeDate = appointmentDate && appointmentDate.includes('T')
      ? appointmentDate.split('T')[0]
      : selectedDate;

    if (selectedDocId && activeDate) {
      const fetchSlots = async () => {
        setFetchingSlots(true);
        try {
          const res = await appointmentApi.getAvailableSlots(selectedDocId, activeDate);
          setAvailableSlots(res.data || []);
        } catch (err) {
          console.error(err);
          setAvailableSlots([]);
        } finally {
          setFetchingSlots(false);
        }
      };
      fetchSlots();
    } else {
      setAvailableSlots([]);
    }
  }, [selectedDocId, appointmentDate, selectedDate]);

  const [dateAvailabilities, setDateAvailabilities] = useState([]);

  const activeDate = appointmentDate && appointmentDate.includes('T')
    ? appointmentDate.split('T')[0]
    : selectedDate;

  // Fetch date-wise doctor availability
  useEffect(() => {
    if (activeDate) {
      const fetchDateAvail = async () => {
        try {
          const res = await doctorAvailabilityApi.getByDate(activeDate);
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
  }, [activeDate]);

  /** Helper to determine exact date-wise status for a doctor */
  const getDoctorDateStatus = (doc) => {
    if (activeDate && dateAvailabilities.length > 0) {
      const record = dateAvailabilities.find((a) => Number(a.doctorId) === Number(doc.id));
      if (record && record.status) {
        return record.status;
      }
    }
    return doc.available !== false ? 'AVAILABLE' : 'UNAVAILABLE';
  };

  // Load all patients automatically on step 1
  useEffect(() => {
    if (step === 1 && activePageMode === 'book') {
      fetchPatients();
    }
  }, [step, activePageMode]);

  const fetchPatients = async (query = '') => {
    setSearching(true);
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
      toast.error('Failed to load patient list');
    } finally {
      setSearching(false);
    }
  };

  const handlePatientSearch = (e) => {
    if (e) e.preventDefault();
    fetchPatients(searchQuery.trim());
  };

  // Client-side filtering for fast instant search
  const filteredPatients = patients.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const fullName = `${p.firstName || ''} ${p.lastName || ''}`.toLowerCase();
    const email = (p.email || '').toLowerCase();
    const mobile = (p.mobile || '').toLowerCase();
    return fullName.includes(q) || email.includes(q) || mobile.includes(q);
  });

  const handleSelectPatient = (patient) => {
    setSelectedPatient(patient);
    setStep(2);
  };

  const handleSlotSelect = (slot) => {
    if (!slot) return;

    if (slot.includes('T')) {
      setAppointmentDate(slot.slice(0, 16));
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
      setAppointmentDate(`${baseDate}T${hh}:${minutes}`);
      return;
    }

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

  /** Handle POST /api/appointments */
  const handleBook = async (e) => {
    e.preventDefault();
    if (!selectedDocId) {
      toast.error('Please select a doctor');
      return;
    }
    if (!appointmentDate) {
      toast.error('Please select an appointment date & time');
      return;
    }
    if (!symptoms.trim()) {
      toast.error('Please enter symptoms / reason for the appointment');
      return;
    }

    // Backend Slot Validation Rules
    const dateObj = new Date(appointmentDate);
    const hour = dateObj.getHours();
    const minute = dateObj.getMinutes();

    if (hour < 10 || hour >= 20) {
      toast.error('Hospital timing is between 10 AM to 8 PM');
      return;
    }

    if (hour >= 14 && hour < 15) {
      toast.error('Hospital break time is between 2 PM to 3 PM');
      return;
    }

    if (minute !== 0 && minute !== 20 && minute !== 40) {
      toast.error('Appointments must be booked on 20-minute slots (e.g. 10:00, 10:20, 10:40). Please pick a valid time slot.');
      return;
    }

    setBooking(true);

    const primaryApptDate = formatForBackend(appointmentDate);
    const payload = {
      patientId: Number(selectedPatient.id),
      doctorId: Number(selectedDocId),
      departmentId: Number(selectedDeptId),
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

      setCreatedAppointment(res.data);
      toast.success('Appointment booked successfully!');
      setStep(3); // success view
    } catch (err) {
      console.error(err);
      const backendMsg = typeof err.response?.data === 'string'
        ? err.response.data
        : err.response?.data?.message || err.response?.data?.error || 'Failed to book appointment';
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
    setSelectedDate('');
    setAvailableSlots([]);
    setAppointmentDate('');
    setSymptoms('');
    setSearchQuery('');
    setPatients([]);
    setCreatedAppointment(null);
  };

  // ==================== MANAGE APPOINTMENTS LOGIC ====================

  // Fetch doctors list for filter via departments
  const fetchAllDoctors = async () => {
    try {
      const deptRes = await departmentApi.getAll();
      const depts = deptRes.data || [];
      const allDocs = [];
      for (const d of depts) {
        try {
          const docRes = await doctorApi.getByDepartment(d.id);
          if (Array.isArray(docRes.data)) {
            allDocs.push(...docRes.data);
          }
        } catch (e) {
          // ignore
        }
      }
      const map = new Map();
      allDocs.forEach((doc) => map.set(doc.id, doc));
      const uniqueDocs = Array.from(map.values());
      setAllDoctorsList(uniqueDocs);
      return uniqueDocs;
    } catch (err) {
      console.error('Failed to load doctors list:', err);
      return [];
    }
  };

  useEffect(() => {
    fetchAllDoctors();
  }, []);

  // Fetch appointments for Manage tab
  const fetchManageAppointments = async () => {
    setLoadingManageApps(true);
    try {
      let list = [];
      if (filterDocId) {
        const res = await appointmentApi.getByDoctor(filterDocId);
        list = res.data || [];
      } else if (allDoctorsList.length > 0) {
        const promises = allDoctorsList.map((doc) =>
          appointmentApi.getByDoctor(doc.id).catch(() => ({ data: [] }))
        );
        const results = await Promise.all(promises);
        const map = new Map();
        results.forEach((res) => {
          (res.data || []).forEach((item) => {
            if (item.id || item.appointmentId) {
              map.set(item.id || item.appointmentId, item);
            }
          });
        });
        list = Array.from(map.values());
      } else {
        // Fallback: try fetching with doctor IDs 1..5 if list empty
        const sampleIds = [1, 2, 3, 4, 5];
        const promises = sampleIds.map((id) =>
          appointmentApi.getByDoctor(id).catch(() => ({ data: [] }))
        );
        const results = await Promise.all(promises);
        const map = new Map();
        results.forEach((res) => {
          (res.data || []).forEach((item) => {
            if (item.id || item.appointmentId) {
              map.set(item.id || item.appointmentId, item);
            }
          });
        });
        list = Array.from(map.values());
      }
      setManageAppointments(list);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load appointments');
    } finally {
      setLoadingManageApps(false);
    }
  };

  useEffect(() => {
    if (activePageMode === 'manage') {
      fetchManageAppointments();
    }
  }, [activePageMode, filterDocId, allDoctorsList]);

  // Handle Approve: PUT /api/appointments/{id}/approve
  const handleApprove = async (id) => {
    setActionLoadingId(id);
    try {
      await appointmentApi.approve(id);
      toast.success(`Appointment #${id} approved successfully!`);
      setManageAppointments((prev) =>
        prev.map((a) => ((a.id || a.appointmentId) === id ? { ...a, status: 'APPROVED' } : a))
      );
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to approve appointment');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Reject: PUT /api/appointments/{id}/reject
  const handleReject = async (id) => {
    setActionLoadingId(id);
    try {
      await appointmentApi.reject(id);
      toast.success(`Appointment #${id} rejected!`);
      setManageAppointments((prev) =>
        prev.map((a) => ((a.id || a.appointmentId) === id ? { ...a, status: 'REJECTED' } : a))
      );
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to reject appointment');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter manage appointments by status and search text
  const filteredManageAppointments = manageAppointments.filter((a) => {
    if (statusFilter !== 'ALL' && a.status !== statusFilter) {
      return false;
    }
    if (manageSearchText.trim()) {
      const q = manageSearchText.toLowerCase().trim();
      const patientName = (a.patientName || '').toLowerCase();
      const doctorName = (a.doctorName || '').toLowerCase();
      const idStr = String(a.id || a.appointmentId || '');
      const symptoms = (a.symptoms || '').toLowerCase();
      return patientName.includes(q) || doctorName.includes(q) || idStr.includes(q) || symptoms.includes(q);
    }
    return true;
  });

  const pendingCount = manageAppointments.filter((a) => a.status === 'PENDING').length;
  const approvedCount = manageAppointments.filter((a) => a.status === 'APPROVED').length;
  const rejectedCount = manageAppointments.filter((a) => a.status === 'REJECTED').length;
  const allCount = manageAppointments.length;

  // Process Consultation Payment: POST /api/receptionists/consultation-payment/{appointmentId}
  const handleProcessConsultationPayment = async () => {
    if (!paymentModalAppt) return;
    const apptId = paymentModalAppt.id || paymentModalAppt.appointmentId;

    setProcessingPayment(true);
    try {
      const res = await receptionistApi.consultationPayment(apptId, paymentMode);
      toast.success('Consultation payment recorded successfully!');
      setPaymentModalAppt(null);

      try {
        const receiptRes = await receptionistApi.consultationReceipt(apptId);
        setReceiptResult(receiptRes.data || res.data);
      } catch (rErr) {
        setReceiptResult(res.data);
      }

      fetchManageAppointments();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const manageColumns = [
    {
      header: 'ID',
      accessor: 'id',
      render: (row) => (
        <button
          onClick={() => setSelectedDetailApptId(row.id || row.appointmentId)}
          className="font-mono text-xs font-bold text-blue-600 hover:underline"
        >
          #{row.id || row.appointmentId}
        </button>
      ),
    },
    {
      header: 'Patient',
      accessor: 'patientName',
      render: (row) => (
        <div>
          <p className="font-semibold text-slate-800">{row.patientName || `Patient #${row.patientId}`}</p>
          <p className="text-xs text-slate-400">ID: #{row.patientId}</p>
        </div>
      ),
    },
    {
      header: 'Doctor / Dept',
      accessor: 'doctorName',
      render: (row) => (
        <div>
          <p className="font-medium text-slate-800">{row.doctorName ? `Dr. ${row.doctorName}` : `Doctor #${row.doctorId}`}</p>
          <p className="text-xs text-slate-400">{row.departmentName || `Dept #${row.departmentId}`}</p>
        </div>
      ),
    },
    {
      header: 'Date & Time',
      accessor: 'appointmentDate',
      render: (row) => (
        <span className="text-xs font-medium text-slate-700">
          {row.appointmentDate ? new Date(row.appointmentDate).toLocaleString('en-IN') : '—'}
        </span>
      ),
    },
    {
      header: 'Symptoms',
      accessor: 'symptoms',
      render: (row) => (
        <p className="text-xs text-slate-600 max-w-xs truncate" title={row.symptoms}>
          {row.symptoms || '—'}
        </p>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${STATUS_STYLES[row.status] || 'bg-slate-100 text-slate-700'}`}>
          {row.status}
        </span>
      ),
    },
    {
      header: 'Actions',
      render: (row) => {
        const apptId = row.id || row.appointmentId;
        const isPending = row.status === 'PENDING';
        const isConsulted =
          row.status === 'CONSULTATION_DONE' ||
          row.status === 'CONSULTATION_COMPLETED' ||
          row.status === 'COMPLETED' ||
          row.status === 'APPROVED';
        const isActioning = actionLoadingId === apptId;

        return (
          <div className="flex items-center gap-2">
            {isPending && (
              <>
                <button
                  onClick={() => handleApprove(apptId)}
                  disabled={isActioning}
                  className="flex items-center gap-1 rounded-lg bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 shadow-sm"
                  title="Approve Appointment"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Approve
                </button>
                <button
                  onClick={() => handleReject(apptId)}
                  disabled={isActioning}
                  className="flex items-center gap-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 shadow-sm"
                  title="Reject Appointment"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Reject
                </button>
              </>
            )}

            {isConsulted && (
              <button
                onClick={() => setPaymentModalAppt(row)}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-semibold transition-colors shadow-sm"
                title="Record / Process Consultation Billing"
              >
                <Receipt className="h-3.5 w-3.5" />
                Process Billing
              </button>
            )}

            {!isPending && !isConsulted && (
              <span className="text-xs text-slate-400 font-medium italic">No action needed</span>
            )}

            <button
              onClick={() => setSelectedDetailApptId(apptId)}
              className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 transition-colors"
              title="View Details"
            >
              <Eye className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      },
    },
  ];

  const formatSlotTime = (isoString) => {
    try {
      return new Date(isoString).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return isoString;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Header & Page Mode Selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Appointments Management</h1>
          <p className="text-sm text-slate-500">Book new appointments or review, approve, and reject patient requests</p>
        </div>

        {/* Main Tabs */}
        <div className="flex items-center rounded-xl bg-slate-100 p-1">
          <button
            onClick={() => {
              setActivePageMode('book');
              resetStepper();
            }}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${activePageMode === 'book' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <Calendar className="h-4 w-4" />
            Book New Appointment
          </button>
          <button
            onClick={() => setActivePageMode('manage')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all relative ${activePageMode === 'manage' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <CheckCircle2 className="h-4 w-4" />
            Approve & Manage
            {pendingCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white px-1.5">
                {pendingCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ================= PAGE MODE 1: BOOK NEW APPOINTMENT ================= */}
      {activePageMode === 'book' && (
        <div className="max-w-3xl space-y-6">
          {/* Informational Callout */}
          <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-xs text-blue-900 flex items-start gap-3 shadow-xs">
            <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-blue-900">Book Walk-in Appointment</p>
              <p className="text-slate-600 mt-0.5 leading-relaxed">
                This section is for WALK-IN / OFFLINE registered patients only. Online appointment requests are handled in{' '}
                <button
                  type="button"
                  onClick={() => setActivePageMode('manage')}
                  className="font-bold text-blue-600 underline hover:text-blue-800"
                >
                  Approve & Manage
                </button>.
              </p>
            </div>
          </div>

          {/* Stepper Header */}
          <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
            <div className={`flex items-center gap-2 text-sm font-semibold ${step >= 1 ? 'text-blue-600' : 'text-slate-400'}`}>
              <span className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs ${step >= 1 ? 'border-blue-600 bg-blue-50' : 'border-slate-300'}`}>1</span>
              Select Patient
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

          {/* Stepper Content */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            {step === 1 && (
              <div className="space-y-6">
                {showOfflineReg ? (
                  <div className="space-y-5 border border-emerald-200 bg-emerald-50/20 p-5 rounded-2xl shadow-xs">
                    <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">Offline Patient Registration</h3>
                        <p className="text-xs text-slate-500">Register new walk-in patient</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowOfflineReg(false)}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline"
                      >
                        Cancel / Back to Search
                      </button>
                    </div>

                    <form onSubmit={handleOfflineRegisterSubmit} className="space-y-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="text-xs font-semibold text-slate-700">First Name *</label>
                          <input
                            type="text"
                            placeholder="Enter first name"
                            value={offlineForm.firstName}
                            onChange={(e) => setOfflineForm({ ...offlineForm, firstName: e.target.value })}
                            required
                            className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-emerald-500 bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-700">Last Name *</label>
                          <input
                            type="text"
                            placeholder="Enter last name"
                            value={offlineForm.lastName}
                            onChange={(e) => setOfflineForm({ ...offlineForm, lastName: e.target.value })}
                            required
                            className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-emerald-500 bg-white"
                          />
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="text-xs font-semibold text-slate-700">Mobile Number *</label>
                          <input
                            type="tel"
                            placeholder="Enter mobile number"
                            value={offlineForm.mobile}
                            onChange={(e) => setOfflineForm({ ...offlineForm, mobile: e.target.value })}
                            required
                            className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-emerald-500 bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-700">Email (optional)</label>
                          <input
                            type="email"
                            placeholder="Enter email (optional)"
                            value={offlineForm.email}
                            onChange={(e) => setOfflineForm({ ...offlineForm, email: e.target.value })}
                            className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-emerald-500 bg-white"
                          />
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="text-xs font-semibold text-slate-700">Date of Birth *</label>
                          <input
                            type="date"
                            value={offlineForm.dateOfBirth}
                            onChange={(e) => setOfflineForm({ ...offlineForm, dateOfBirth: e.target.value })}
                            required
                            className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-emerald-500 bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-700">Gender *</label>
                          <select
                            value={offlineForm.gender}
                            onChange={(e) => setOfflineForm({ ...offlineForm, gender: e.target.value })}
                            required
                            className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-emerald-500 bg-white"
                          >
                            <option value="MALE">Male</option>
                            <option value="FEMALE">Female</option>
                            <option value="OTHER">Other</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700">Address *</label>
                        <textarea
                          placeholder="Enter full address"
                          value={offlineForm.address}
                          onChange={(e) => setOfflineForm({ ...offlineForm, address: e.target.value })}
                          rows={2}
                          required
                          className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-emerald-500 bg-white"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={offlineRegLoading}
                        className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 text-xs transition-colors disabled:opacity-50 shadow-sm"
                      >
                        {offlineRegLoading ? 'Registering Patient...' : 'Register Patient'}
                      </button>

                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900 flex items-center gap-2">
                        <Info className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                        <span>This patient will be saved as an offline (walk-in) patient. You can now book an appointment.</span>
                      </div>
                    </form>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="text-base font-bold text-slate-800">Search Walk-in Patients</h3>
                      <span className="text-xs font-medium text-slate-500">
                        {searching ? 'Loading...' : `${filteredPatients.length} walk-in patient${filteredPatients.length === 1 ? '' : 's'} available`}
                      </span>
                    </div>

                    <form onSubmit={handlePatientSearch} className="flex gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search by name, mobile, or email..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 rounded-xl border border-slate-200 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
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
                          <span>Loading patient list...</span>
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
                        <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl">
                          <p className="text-sm font-medium text-slate-600">No patient records found.</p>
                          <p className="text-xs text-slate-400 mt-1">Try clearing or changing your search keywords.</p>
                        </div>
                      )}

                      {/* Shortcut to Register Walk-in Patient */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <p className="text-xs text-slate-500">Can&apos;t find the patient in the directory?</p>
                        <button
                          type="button"
                          onClick={() => setShowOfflineReg(true)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors shadow-2xs"
                        >
                          <User className="h-3.5 w-3.5" />
                          Register New Walk-in Patient
                        </button>
                      </div>
                    </div>
                  </>
                )}
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
                        className="w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-blue-500"
                      >
                        <option value="">-- Select Department --</option>
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
                        className="w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-blue-500"
                      >
                        <option value="">-- Select Doctor --</option>
                        {doctors.map((doc) => {
                          const status = getDoctorDateStatus(doc);
                          const isAvail = status === 'AVAILABLE';
                          const spec = doc.specializationName || doc.specialization || '';
                          const specText = spec ? ` - ${spec}` : '';
                          
                          let availBadge = '🟢 Available';
                          if (status === 'UNAVAILABLE') availBadge = '🔴 Not Available';
                          else if (status === 'LEAVE') availBadge = '🟡 On Leave';
                          else if (status === 'EMERGENCY') availBadge = '🔴 Emergency';

                          return (
                            <option key={doc.id} value={doc.id}>
                              Dr. {doc.firstName} {doc.lastName}{specText} ({availBadge})
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
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                🟢 (Available) Doctor is Available for Consultation {activeDate ? `on ${activeDate}` : ''}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg">
                                <span className="h-2 w-2 rounded-full bg-rose-500" />
                                🔴 ({status.replace('_', ' ')}) Doctor is Currently Unavailable / On Leave {activeDate ? `on ${activeDate}` : ''}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Date & Available Slots */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-slate-700">Appointment Date & Time *</label>
                    <input
                      type="datetime-local"
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                      required
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Real-time Available Slots */}
                  {selectedDocId && (appointmentDate || selectedDate) && (
                    <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 space-y-2">
                      <p className="text-xs font-bold text-blue-800 flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-blue-600" />
                        Available Slots for {appointmentDate ? appointmentDate.split('T')[0] : selectedDate}:
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
                      className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 transition-colors disabled:opacity-50 text-sm"
                    >
                      {booking ? 'Scheduling...' : 'Schedule Appointment'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {step === 3 && (
              <div className="flex flex-col items-center justify-center text-center py-8 space-y-4">
                <div className="rounded-full bg-green-50 border border-green-200 p-4 text-green-600 animate-scale-in">
                  <CheckCircle className="h-10 w-10" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900">Booking Confirmed!</h3>
                  <p className="text-sm text-slate-500 max-w-sm">
                    Appointment has been successfully recorded in the hospital registry.
                  </p>
                </div>

                {createdAppointment && (
                  <div className="w-full max-w-md bg-slate-50 p-4 rounded-xl border border-slate-200 text-left text-xs space-y-2">
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
                      <span className="text-slate-500 font-medium">Symptoms:</span>
                      <span className="font-bold text-slate-800">{createdAppointment.symptoms}</span>
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
                  Book Another Appointment
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= PAGE MODE 2: MANAGE & APPROVE APPOINTMENTS ================= */}
      {activePageMode === 'manage' && (
        <div className="space-y-6">
          {/* Informational Banner */}
          <div className="rounded-2xl border border-purple-100 bg-purple-50/60 p-4 text-xs text-purple-900 flex items-start gap-3 shadow-xs">
            <Info className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-purple-900">Online Appointment Requests</p>
              <p className="text-slate-600 mt-0.5 leading-relaxed">
                Only online appointment requests from Patient Portal are shown here. Walk-in appointments are not listed in this section. Review and approve or reject patient requests below.
              </p>
            </div>
          </div>

          {/* Controls Bar: Doctor Filter & Search Input */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              {/* Doctor Dropdown */}
              <div className="w-full sm:w-64">
                <select
                  value={filterDocId}
                  onChange={(e) => setFilterDocId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 bg-slate-50/50"
                >
                  <option value="">All Doctors</option>
                  {allDoctorsList.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      Dr. {doc.firstName} {doc.lastName} ({doc.specialization || 'General'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Text filter */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by patient name, doctor, ID, or symptoms..."
                  value={manageSearchText}
                  onChange={(e) => setManageSearchText(e.target.value)}
                  className="w-full pl-9 rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <button
              onClick={fetchManageAppointments}
              disabled={loadingManageApps}
              className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingManageApps ? 'animate-spin' : ''}`} />
              Refresh List
            </button>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {[
              { id: 'PENDING', label: `Pending (${pendingCount})` },
              { id: 'APPROVED', label: `Approved (${approvedCount})` },
              { id: 'REJECTED', label: `Rejected (${rejectedCount})` },
              { id: 'COMPLETED', label: 'Completed' },
              { id: 'ALL', label: `All (${allCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all whitespace-nowrap border ${statusFilter === tab.id ? (tab.id === 'PENDING' ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-sm' : 'bg-blue-50 text-blue-600 border-blue-300 shadow-sm') : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Table displaying Appointments with Approve / Reject action buttons */}
          <DataTable
            columns={manageColumns}
            data={filteredManageAppointments}
            loading={loadingManageApps}
            emptyMessage="No appointments matched your current filters."
          />
        </div>
      )}

      {/* Appointment Details Modal */}
      <ViewAppointmentDetailsModal
        appointmentId={selectedDetailApptId}
        isOpen={Boolean(selectedDetailApptId)}
        onClose={() => setSelectedDetailApptId(null)}
      />

      {/* Consultation Payment Modal */}
      {paymentModalAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Process Consultation Billing #{paymentModalAppt.id || paymentModalAppt.appointmentId}
                </h3>
              </div>
              <button
                onClick={() => setPaymentModalAppt(null)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Patient:</span>
                <span className="font-bold text-slate-800">{paymentModalAppt.patientName || `Patient #${paymentModalAppt.patientId}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Doctor:</span>
                <span className="font-bold text-slate-800">{paymentModalAppt.doctorName ? `Dr. ${paymentModalAppt.doctorName}` : `Doctor #${paymentModalAppt.doctorId}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Department:</span>
                <span className="font-bold text-slate-800">{paymentModalAppt.departmentName || `Dept #${paymentModalAppt.departmentId}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Status:</span>
                <span className="font-bold text-purple-700">{paymentModalAppt.status}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Select Payment Mode *</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'CASH', label: '💵 Cash' },
                  { id: 'CARD', label: '💳 Card' },
                  { id: 'UPI', label: '📱 UPI' },
                  { id: 'NET_BANKING', label: '🏦 Net Banking' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setPaymentMode(mode.id)}
                    className={`rounded-xl border p-3 text-xs font-semibold transition-all ${paymentMode === mode.id ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPaymentModalAppt(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProcessConsultationPayment}
                disabled={processingPayment}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 text-xs font-semibold transition-colors disabled:opacity-50 shadow-sm flex items-center gap-1.5"
              >
                <CreditCard className="h-4 w-4" />
                {processingPayment ? 'Recording...' : 'Record Payment & Receipt'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Details Modal */}
      {receiptResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Payment Receipt Recorded</h3>
              </div>
              <button
                onClick={() => setReceiptResult(null)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Receipt Number:</span>
                <span className="font-bold text-slate-800">{receiptResult.receiptNumber || `REC-${receiptResult.paymentId || '1001'}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Transaction ID:</span>
                <span className="font-bold text-slate-800">{receiptResult.transactionId || 'TXN-SUCCESS'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Amount Paid:</span>
                <span className="font-bold text-emerald-700">₹{receiptResult.amount ?? 500}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Payment Mode:</span>
                <span className="font-bold text-slate-800">{receiptResult.paymentMode || paymentMode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Status:</span>
                <span className="font-bold text-emerald-700">{receiptResult.paymentStatus || 'COMPLETED'}</span>
              </div>
            </div>

            <button
              onClick={() => setReceiptResult(null)}
              className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 text-xs font-semibold transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
