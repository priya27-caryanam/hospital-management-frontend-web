/**
 * Patient Search & Offline Registration Page (Receptionist)
 *
 * Implements Receptionist Patient endpoints:
 *   - Search Patients: GET /api/patients/search (returns List<UserResponse>)
 *   - Register Walk-in Patient: POST /api/receptionists/register/patients
 *
 * Swagger Request Schema (POST /api/receptionists/register/patients):
 *   { firstName, lastName, email, mobile, password, gender, dateOfBirth, bloodGroup, height, weight, address, city, state, pincode, emergencyContact }
 *
 * Swagger Response Schema (POST /api/receptionists/register/patients):
 *   { message, status, data: { id, firstName, lastName, email, mobile, gender, dateOfBirth, bloodGroup, height, weight, address, city, state, pincode, emergencyContact, role, status } }
 */
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import {
  Search,
  User,
  Mail,
  Phone,
  BadgeCheck,
  UserPlus,
  X,
  Calendar,
  Heart,
  Ruler,
  Weight,
  MapPin,
  CheckCircle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import patientApi from '../../api/patientApi';
import receptionistApi from '../../api/receptionistApi';
import appointmentApi from '../../api/appointmentApi';
import SearchBar from '../../components/common/SearchBar';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const GENDERS = ['MALE', 'FEMALE', 'OTHER'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const INITIAL_PATIENT_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  mobile: '',
  password: '',
  gender: 'MALE',
  dateOfBirth: '',
  bloodGroup: 'A+',
  height: '',
  weight: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  emergencyContact: '',
};

export default function PatientSearch() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isTodayFilter = searchParams.get('filter') === 'today';
  const [activeTab, setActiveTab] = useState('search'); // 'search' | 'register'

  // Search state
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [expandedPatientDetails, setExpandedPatientDetails] = useState(null);
  const [loadingPatientDetails, setLoadingPatientDetails] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Patient Appointments state for expanded card
  const [patientAppointments, setPatientAppointments] = useState([]);
  const [loadingPatientAppts, setLoadingPatientAppts] = useState(false);
  const [actionLoadingApptId, setActionLoadingApptId] = useState(null);

  // Patient Registration state
  const [form, setForm] = useState(INITIAL_PATIENT_FORM);
  const [registering, setRegistering] = useState(false);
  const [registeredPatientResponse, setRegisteredPatientResponse] = useState(null);

  // Auto-load patients on tab mount
  useEffect(() => {
    if (activeTab === 'search') {
      loadAllPatients();
    }
  }, [activeTab]);

  const loadAllPatients = async () => {
    setLoading(true);
    try {
      let response;
      try {
        response = await patientApi.search('');
      } catch (err) {
        response = await patientApi.getAll();
      }
      
      let data = response.data || [];
      if (isTodayFilter) {
        // Logic for filtering by today would go here if required
      }
      setPatients(data);
      setHasSearched(true);
    } catch (error) {
      console.error('Failed to load patient list:', error);
    } finally {
      setLoading(false);
    }
  };

  /** Search patients via API */
  const handleSearch = async (query) => {
    setSearchQuery(query);

    if (!query || query.trim().length === 0) {
      loadAllPatients();
      return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      const response = await patientApi.search(query.trim());
      setPatients(response.data || []);
      setCurrentPage(1);
    } catch (error) {
      toast.error('Failed to search patients');
      console.error('Patient search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientAppointments = async (patientId) => {
    setLoadingPatientAppts(true);
    try {
      const res = await appointmentApi.getByPatient(patientId);
      setPatientAppointments(res.data || []);
    } catch (err) {
      console.error('Failed to load patient appointments:', err);
      setPatientAppointments([]);
    } finally {
      setLoadingPatientAppts(false);
    }
  };

  /** Toggle Expand & Fetch Patient Details via GET /api/patients/{id} */
  const toggleExpand = async (id) => {
    if (expandedId !== null && String(expandedId) === String(id)) {
      setExpandedId(null);
      setExpandedPatientDetails(null);
      setPatientAppointments([]);
    } else {
      setExpandedId(id);
      setExpandedPatientDetails(null);
      setLoadingPatientDetails(true);

      // 1. Fetch full patient profile via GET /api/patients/{id}
      try {
        const res = await patientApi.getById(id);
        setExpandedPatientDetails(res.data);
      } catch (err) {
        console.error('Failed to fetch patient profile:', err);
        // Fallback to locally loaded row object if getById endpoint errors out
        const fallback = patients.find((p) => String(p.id) === String(id));
        setExpandedPatientDetails(fallback || null);
      } finally {
        setLoadingPatientDetails(false);
      }

      // 2. Fetch patient appointments via GET /api/appointments/patient/{id}
      fetchPatientAppointments(id);
    }
  };

  // Auto-scroll to expanded details panel when opened
  useEffect(() => {
    if (expandedId !== null) {
      setTimeout(() => {
        const el = document.getElementById('expanded-patient-panel');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
    }
  }, [expandedId, expandedPatientDetails]);

  const handleApprovePatientAppt = async (apptId) => {
    setActionLoadingApptId(apptId);
    try {
      await appointmentApi.approve(apptId);
      toast.success(`Appointment #${apptId} approved successfully!`);
      setPatientAppointments((prev) =>
        prev.map((a) => ((a.id || a.appointmentId) === apptId ? { ...a, status: 'APPROVED' } : a))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve appointment');
    } finally {
      setActionLoadingApptId(null);
    }
  };

  const handleRejectPatientAppt = async (apptId) => {
    setActionLoadingApptId(apptId);
    try {
      await appointmentApi.reject(apptId);
      toast.success(`Appointment #${apptId} rejected!`);
      setPatientAppointments((prev) =>
        prev.map((a) => ((a.id || a.appointmentId) === apptId ? { ...a, status: 'REJECTED' } : a))
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject appointment');
    } finally {
      setActionLoadingApptId(null);
    }
  };

  /** Form input change for patient registration */
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  /** Handle POST /api/receptionists/register/patients */
  const handleRegisterPatientSubmit = async (e) => {
    e.preventDefault();

    if (
      !form.firstName.trim() ||
      !form.lastName.trim() ||
      !form.email.trim() ||
      !form.mobile.trim() ||
      !form.password ||
      !form.gender ||
      !form.dateOfBirth ||
      !form.bloodGroup ||
      !form.address.trim() ||
      !form.city.trim() ||
      !form.state.trim() ||
      !form.pincode.trim() ||
      !form.emergencyContact.trim()
    ) {
      toast.error('Please fill in all required fields marked with *');
      return;
    }

    setRegistering(true);
    try {
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        mobile: form.mobile.trim(),
        password: form.password,
        gender: form.gender,
        dateOfBirth: form.dateOfBirth,
        bloodGroup: form.bloodGroup,
        height: form.height ? Number(form.height) : 0,
        weight: form.weight ? Number(form.weight) : 0,
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        emergencyContact: form.emergencyContact.trim(),
      };

      const res = await receptionistApi.registerPatient(payload);
      // Response: { message, status, data: { ... } }
      setRegisteredPatientResponse(res.data);
      const savedPatientData = res.data?.data || res.data;
      if (savedPatientData && (savedPatientData.id || savedPatientData.patientId)) {
        const pId = savedPatientData.id || savedPatientData.patientId;
        const currentOfflineIds = JSON.parse(localStorage.getItem('hms_offline_patient_ids') || '[]');
        if (!currentOfflineIds.includes(pId)) {
          currentOfflineIds.push(pId);
          localStorage.setItem('hms_offline_patient_ids', JSON.stringify(currentOfflineIds));
        }

        const todayRegisteredList = JSON.parse(localStorage.getItem('hms_today_registered_patients') || '[]');
        const todayStr = new Date().toISOString().split('T')[0];
        if (!todayRegisteredList.some((item) => item.id === pId)) {
          todayRegisteredList.push({ id: pId, date: todayStr, timestamp: Date.now() });
          localStorage.setItem('hms_today_registered_patients', JSON.stringify(todayRegisteredList));
        }
      }
      window.dispatchEvent(new Event('hms_dashboard_refresh'));
      toast.success(res.data?.message || 'Patient registered successfully!');
      setForm(INITIAL_PATIENT_FORM);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Patient registration failed');
      console.error(err);
    } finally {
      setRegistering(false);
    }
  };


  const inputClass =
    'w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all';

  /** Table columns */
  const columns = [
    { header: 'ID', accessor: 'id' },
    {
      header: 'Name',
      render: (row) => (
        <span className="font-medium text-slate-800">
          {row.firstName} {row.lastName}
        </span>
      ),
    },
    { header: 'Email', accessor: 'email' },
    { header: 'Mobile', accessor: 'mobile' },
    {
      header: 'Status',
      render: (row) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            row.status === 'ACTIVE'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          {row.status || 'ACTIVE'}
        </span>
      ),
    },
    {
      header: 'Actions',
      render: (row) => {
        const isExpanded = expandedId !== null && String(expandedId) === String(row.id);
        return (
          <button
            onClick={() => toggleExpand(row.id)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              isExpanded
                ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
            }`}
          >
            <User className="h-3.5 w-3.5" />
            {isExpanded ? 'Hide' : 'View Details'}
          </button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Page Header & Tabs ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Patient Directory</h1>
          <p className="mt-1 text-sm text-slate-500">
            Search patient records or register new walk-in patients
          </p>
        </div>

        <div className="flex rounded-xl bg-slate-100 p-1 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('search')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === 'search'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Search className="h-3.5 w-3.5" />
            Search Patients
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
              activeTab === 'register'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus className="h-3.5 w-3.5" />
            Register Walk-in Patient
          </button>
        </div>
      </div>

      {/* ── TAB 1: SEARCH PATIENTS ── */}
      {activeTab === 'search' && (
        <div className="space-y-6">
          <div className="max-w-xl">
            <SearchBar
              placeholder="Search by name, email, or mobile..."
              onSearch={handleSearch}
              className="w-full"
            />
          </div>

          {!hasSearched ? (
            <EmptyState
              icon={Search}
              title="Search for Patients"
              message="Enter at least 2 characters to start searching for patient records."
            />
          ) : (
            <>
              {!loading && patients.length > 0 && (
                <p className="text-sm text-slate-500">
                  Found <span className="font-semibold text-slate-700">{patients.length}</span> patient(s)
                  for &quot;{searchQuery}&quot;
                </p>
              )}

              <DataTable
                columns={columns}
                data={patients}
                loading={loading}
                emptyMessage={`No patients found for "${searchQuery}"`}
                pageSize={10}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />

              {expandedId !== null && (
                <div id="expanded-patient-panel" className="rounded-2xl border border-blue-200 bg-blue-50/40 p-6 shadow-sm space-y-6 animate-fade-in mt-6">
                  {loadingPatientDetails ? (
                    <div className="py-10 text-center text-slate-500 space-y-2">
                      <LoadingSpinner />
                      <p className="text-xs font-medium text-slate-500">Fetching patient profile via GET /api/patients/{expandedId}...</p>
                    </div>
                  ) : (() => {
                    const patient = expandedPatientDetails || patients.find((p) => String(p.id) === String(expandedId));
                    if (!patient) return <p className="text-xs text-slate-400">Patient details unavailable.</p>;

                    return (
                      <>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-blue-100 pb-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-lg shadow-md">
                              {patient.firstName?.charAt(0) || 'P'}
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-slate-800">
                                {patient.firstName} {patient.lastName}
                              </h3>
                              <p className="text-xs font-semibold text-blue-600">Patient ID: #{patient.id}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              onClick={() => navigate('/receptionist/appointments')}
                              className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-semibold transition-colors shadow-sm"
                            >
                              <Calendar className="h-3.5 w-3.5" />
                              Book Appointment
                            </button>
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
                                patient.status === 'ACTIVE'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              <BadgeCheck className="h-3.5 w-3.5" />
                              {patient.status || 'ACTIVE'}
                            </span>
                            <button
                              onClick={() => toggleExpand(patient.id)}
                              className="rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 px-3 py-1.5 text-xs font-semibold transition-colors"
                            >
                              Hide
                            </button>
                          </div>
                        </div>

                        {/* Patient info details - 100% Backend Field Mapping */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm bg-white p-4 rounded-xl border border-blue-100 shadow-xs">
                          <DetailItem icon={User} label="Full Name" value={`${patient.firstName || ''} ${patient.lastName || ''}`} />
                          <DetailItem icon={Mail} label="Email" value={patient.email} />
                          <DetailItem icon={Phone} label="Mobile" value={patient.mobile} />
                          <DetailItem label="Role" value={patient.role} />
                          <DetailItem label="Status" value={patient.status} />
                          {patient.gender && <DetailItem label="Gender" value={patient.gender} />}
                          {patient.dateOfBirth && <DetailItem icon={Calendar} label="Date of Birth" value={patient.dateOfBirth} />}
                          {patient.bloodGroup && <DetailItem icon={Heart} label="Blood Group" value={patient.bloodGroup} />}
                          {patient.height && <DetailItem icon={Ruler} label="Height" value={`${patient.height} cm`} />}
                          {patient.weight && <DetailItem icon={Weight} label="Weight" value={`${patient.weight} kg`} />}
                          {patient.address && (
                            <DetailItem
                              icon={MapPin}
                              label="Address"
                              value={`${patient.address}${patient.city ? `, ${patient.city}` : ''}${patient.state ? `, ${patient.state}` : ''}${patient.pincode ? ` - ${patient.pincode}` : ''}`}
                            />
                          )}
                          {patient.emergencyContact && <DetailItem icon={Phone} label="Emergency Contact" value={patient.emergencyContact} />}
                          {patient.additionalDetails && <DetailItem label="Additional Details" value={patient.additionalDetails} />}
                        </div>

                    {/* Patient Appointments list with direct Approve / Reject buttons */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          Appointments for {patient.firstName} ({patientAppointments.length})
                        </h4>
                        <button
                          onClick={() => navigate('/receptionist/appointments')}
                          className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                        >
                          Go to Appointments Desk <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>

                      {loadingPatientAppts ? (
                        <p className="text-xs text-slate-400 py-3">Loading appointments...</p>
                      ) : patientAppointments.length > 0 ? (
                        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white overflow-hidden text-xs">
                          {patientAppointments.map((appt) => {
                            const isPending = appt.status === 'PENDING';
                            const isActioning = actionLoadingApptId === (appt.id || appt.appointmentId);
                            const STATUS_CLASSES = {
                              PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
                              APPROVED: 'bg-blue-100 text-blue-800 border-blue-200',
                              COMPLETED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                              REJECTED: 'bg-rose-100 text-rose-800 border-rose-200',
                            };

                            return (
                              <div key={appt.id || appt.appointmentId} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-2 hover:bg-slate-50">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-blue-600">#{appt.id || appt.appointmentId}</span>
                                    <span className="font-semibold text-slate-800">
                                      {appt.doctorName ? `Dr. ${appt.doctorName}` : `Doctor #${appt.doctorId}`}
                                    </span>
                                    <span className="text-slate-400">({appt.departmentName || `Dept #${appt.departmentId}`})</span>
                                  </div>
                                  <p className="text-slate-500 mt-0.5">
                                    Scheduled: {appt.appointmentDate ? new Date(appt.appointmentDate).toLocaleString('en-IN') : '—'} | Symptoms: {appt.symptoms || 'None'}
                                  </p>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${STATUS_CLASSES[appt.status] || 'bg-slate-100 text-slate-700'}`}>
                                    {appt.status}
                                  </span>

                                  {isPending && (
                                    <>
                                      <button
                                        onClick={() => handleApprovePatientAppt(appt.id || appt.appointmentId)}
                                        disabled={isActioning}
                                        className="flex items-center gap-1 rounded-lg bg-green-600 hover:bg-green-700 text-white px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-50"
                                      >
                                        <CheckCircle2 className="h-3 w-3" />
                                        Approve
                                      </button>
                                      <button
                                        onClick={() => handleRejectPatientAppt(appt.id || appt.appointmentId)}
                                        disabled={isActioning}
                                        className="flex items-center gap-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-50"
                                      >
                                        <XCircle className="h-3 w-3" />
                                        Reject
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 py-3 italic bg-white p-3 rounded-xl border border-slate-200">
                          No appointments found for this patient. Click &quot;Book Appointment&quot; above to schedule one.
                        </p>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          )}
        </>
      )}
        </div>
      )}

      {/* ── TAB 2: REGISTER WALK-IN PATIENT (POST /api/receptionists/register/patients) ── */}
      {activeTab === 'register' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 max-w-4xl space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-blue-600" />
              Walk-in Patient Registration Form
            </h2>
            <p className="text-sm text-slate-500">
              Complete offline patient registration into the system registry
            </p>
          </div>

          <form onSubmit={handleRegisterPatientSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={form.firstName}
                  onChange={handleFormChange}
                  required
                  className={inputClass}
                  placeholder="John"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  value={form.lastName}
                  onChange={handleFormChange}
                  required
                  className={inputClass}
                  placeholder="Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleFormChange}
                  required
                  className={inputClass}
                  placeholder="patient@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mobile *</label>
                <input
                  type="tel"
                  name="mobile"
                  value={form.mobile}
                  onChange={handleFormChange}
                  required
                  className={inputClass}
                  placeholder="9876543210"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password *</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleFormChange}
                  required
                  className={inputClass}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Gender *</label>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleFormChange}
                  required
                  className={inputClass}
                >
                  {GENDERS.map((g) => (
                    <option key={g} value={g}>
                      {g.charAt(0) + g.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth *</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={form.dateOfBirth}
                  onChange={handleFormChange}
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Blood Group *</label>
                <select
                  name="bloodGroup"
                  value={form.bloodGroup}
                  onChange={handleFormChange}
                  required
                  className={inputClass}
                >
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Height (cm)</label>
                <input
                  type="number"
                  name="height"
                  value={form.height}
                  onChange={handleFormChange}
                  className={inputClass}
                  placeholder="170"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Weight (kg)</label>
                <input
                  type="number"
                  name="weight"
                  value={form.weight}
                  onChange={handleFormChange}
                  className={inputClass}
                  placeholder="70"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Emergency Contact *</label>
                <input
                  type="tel"
                  name="emergencyContact"
                  value={form.emergencyContact}
                  onChange={handleFormChange}
                  required
                  className={inputClass}
                  placeholder="9876543210"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">City *</label>
                <input
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleFormChange}
                  required
                  className={inputClass}
                  placeholder="Mumbai"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">State *</label>
                <input
                  type="text"
                  name="state"
                  value={form.state}
                  onChange={handleFormChange}
                  required
                  className={inputClass}
                  placeholder="Maharashtra"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pincode *</label>
                <input
                  type="text"
                  name="pincode"
                  value={form.pincode}
                  onChange={handleFormChange}
                  required
                  className={inputClass}
                  placeholder="400001"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-sm font-medium text-slate-700 mb-1">Address *</label>
                <textarea
                  name="address"
                  value={form.address}
                  onChange={handleFormChange}
                  required
                  rows={2}
                  className={inputClass}
                  placeholder="Street address details..."
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={registering}
                className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-2.5 transition-colors disabled:opacity-50 shadow-sm"
              >
                {registering ? 'Registering Patient...' : 'Register Patient'}
              </button>
            </div>
          </form>

          {/* ── Registered Patient Success Result Modal / Card ── */}
          {registeredPatientResponse && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                    <CheckCircle className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{registeredPatientResponse.message || 'Registration Success'}</h3>
                    <p className="text-xs text-slate-500">Response Status Code: {registeredPatientResponse.status}</p>
                  </div>
                </div>
                <button
                  onClick={() => setRegisteredPatientResponse(null)}
                  className="rounded-full p-1 hover:bg-emerald-100 text-slate-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {registeredPatientResponse.data && (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs bg-white p-4 rounded-xl border border-emerald-100">
                    <div>
                      <span className="text-slate-400 font-medium">Patient ID</span>
                      <p className="font-bold text-slate-800">#{registeredPatientResponse.data.id}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Name</span>
                      <p className="font-bold text-slate-800">{registeredPatientResponse.data.firstName} {registeredPatientResponse.data.lastName}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Email</span>
                      <p className="font-bold text-slate-800">{registeredPatientResponse.data.email}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Mobile</span>
                      <p className="font-bold text-slate-800">{registeredPatientResponse.data.mobile}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Gender</span>
                      <p className="font-bold text-slate-800">{registeredPatientResponse.data.gender}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">DOB</span>
                      <p className="font-bold text-slate-800">{registeredPatientResponse.data.dateOfBirth}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Blood Group</span>
                      <p className="font-bold text-slate-800">{registeredPatientResponse.data.bloodGroup}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Height / Weight</span>
                      <p className="font-bold text-slate-800">{registeredPatientResponse.data.height} cm / {registeredPatientResponse.data.weight} kg</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Emergency Contact</span>
                      <p className="font-bold text-slate-800">{registeredPatientResponse.data.emergencyContact}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">City / State</span>
                      <p className="font-bold text-slate-800">{registeredPatientResponse.data.city}, {registeredPatientResponse.data.state}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Role / Status</span>
                      <p className="font-bold text-slate-800">{registeredPatientResponse.data.role} ({registeredPatientResponse.data.status})</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Address</span>
                      <p className="font-bold text-slate-800">{registeredPatientResponse.data.address} - {registeredPatientResponse.data.pincode}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      onClick={() => navigate('/receptionist/appointments')}
                      className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-semibold transition-colors shadow-sm"
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      Book Appointment for {registeredPatientResponse.data.firstName}
                    </button>
                    <button
                      onClick={() => navigate('/receptionist/appointments')}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 text-xs font-semibold transition-colors shadow-sm"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Approve & Manage Appointments
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DetailItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      {Icon && <Icon className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />}
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="font-medium text-slate-800">{value || '—'}</p>
      </div>
    </div>
  );
}
