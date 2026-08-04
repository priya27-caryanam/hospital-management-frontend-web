/**
 * Daily Doctor Availability Page (Receptionist)
 *
 * Tech Stack: React + Vite + Tailwind CSS + Axios + Lucide Icons + React Hot Toast
 * Theme: Professional Hospital Dashboard (White background, Blue primary #2563EB, rounded cards, glass effect)
 *
 * Backend APIs Used:
 *   - GET /api/departments
 *   - GET /api/doctors/all
 *   - GET /api/doctor-availability/date?date={selectedDate}
 *   - GET /api/doctor-availability/{id}
 *   - POST /api/doctor-availability
 *   - PUT /api/doctor-availability/{id}
 *   - DELETE /api/doctor-availability/{id}
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  AlertCircle,
  UserCheck,
  AlertTriangle,
  UserX,
  CalendarOff,
  X,
  Loader2,
  Search,
  Filter,
  CheckCircle,
  Stethoscope,
  Building2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import doctorAvailabilityApi from '../../api/doctorAvailabilityApi';
import departmentApi from '../../api/departmentApi';
import doctorApi from '../../api/doctorApi';

const STATUS_OPTIONS = [
  { value: 'AVAILABLE', label: 'Available', color: 'emerald' },
  { value: 'EMERGENCY', label: 'Emergency', color: 'rose' },
  { value: 'LEAVE', label: 'Leave', color: 'amber' },
  { value: 'UNAVAILABLE', label: 'Unavailable', color: 'slate' },
];

const STATUS_BADGE_STYLES = {
  AVAILABLE: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20',
  EMERGENCY: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/20 animate-pulse',
  LEAVE: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/20',
  UNAVAILABLE: 'bg-slate-100 text-slate-700 border-slate-200 ring-slate-500/20',
};

const EMPTY_ADD_FORM = {
  doctorId: '',
  date: new Date().toISOString().split('T')[0],
  status: 'AVAILABLE',
  startTime: '09:00',
  endTime: '17:00',
};

export default function DoctorAvailability() {
  // Main Page States
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');

  // Data States
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [availabilities, setAvailabilities] = useState([]);

  // UI States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Add Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addFormData, setAddFormData] = useState(EMPTY_ADD_FORM);
  const [addFormErrors, setAddFormErrors] = useState({});
  const [submittingAdd, setSubmittingAdd] = useState(false);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAvailabilityId, setEditingAvailabilityId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    doctorId: '',
    doctorName: '',
    date: '',
    status: 'AVAILABLE',
    startTime: '09:00',
    endTime: '17:00',
  });
  const [editFormErrors, setEditFormErrors] = useState({});
  const [loadingEditDetails, setLoadingEditDetails] = useState(false);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Delete Dialog State
  const [deletingId, setDeletingId] = useState(null);
  const [deletingDoctorName, setDeletingDoctorName] = useState('');
  const [submittingDelete, setSubmittingDelete] = useState(false);

  /** 1. Fetch Metadata (Departments & All Doctors) and Availabilities for selectedDate */
  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // Parallel API requests
      const [deptRes, docRes, availRes] = await Promise.all([
        departmentApi.getAll().catch(() => ({ data: [] })),
        doctorApi.getAllDoctors().catch(() => ({ data: [] })),
        doctorAvailabilityApi.getByDate(selectedDate).catch(() => ({ data: [] })),
      ]);

      const deptList = Array.isArray(deptRes.data) ? deptRes.data : (deptRes.data?.data || []);
      const docList = Array.isArray(docRes.data) ? docRes.data : (docRes.data?.data || docRes.data?.content || []);
      const availList = Array.isArray(availRes.data) ? availRes.data : (availRes.data?.data || []);

      setDepartments(deptList);
      setDoctors(docList);
      setAvailabilities(availList);

      if (isRefresh) {
        toast.success('Doctor availability reloaded');
      }
    } catch (err) {
      console.error('Failed to load doctor availability data:', err);
      toast.error('Failed to load availability schedules');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /** 2. Doctor Map for Quick Lookup & Fallback Mapping */
  const doctorMap = useMemo(() => {
    const map = new Map();
    doctors.forEach((doc) => {
      if (doc && doc.id) {
        map.set(String(doc.id), doc);
      }
    });
    return map;
  }, [doctors]);

  /** 3. Filter Doctor Dropdown locally based on selected Department */
  const filteredDoctorsForDropdown = useMemo(() => {
    if (!selectedDeptId) return doctors;
    return doctors.filter(
      (doc) =>
        String(doc.departmentId) === String(selectedDeptId) ||
        String(doc.department?.id) === String(selectedDeptId)
    );
  }, [doctors, selectedDeptId]);

  /** 4. Enriched Availability List with Doctor Metadata */
  const enrichedAvailabilities = useMemo(() => {
    return availabilities.map((item) => {
      const docIdStr = String(item.doctorId || item.doctor?.id || '');
      const docMeta = doctorMap.get(docIdStr);

      const doctorName =
        item.doctorName ||
        item.doctor?.name ||
        (docMeta ? `Dr. ${docMeta.firstName || ''} ${docMeta.lastName || ''}`.trim() : `Doctor #${item.doctorId || '—'}`);

      const departmentName =
        item.departmentName ||
        item.department ||
        item.doctor?.departmentName ||
        docMeta?.departmentName ||
        docMeta?.department?.departmentName ||
        '—';

      const specializationName =
        item.specializationName ||
        item.specialization ||
        item.doctor?.specializationName ||
        docMeta?.specializationName ||
        docMeta?.specialization?.specializationName ||
        '—';

      return {
        ...item,
        doctorName,
        departmentName,
        specializationName,
        deptId: item.departmentId || docMeta?.departmentId || docMeta?.department?.id,
      };
    });
  }, [availabilities, doctorMap]);

  /** 5. Filter Table locally by Department and Doctor selection */
  const filteredAvailabilities = useMemo(() => {
    return enrichedAvailabilities.filter((item) => {
      if (selectedDeptId && String(item.deptId) !== String(selectedDeptId)) {
        return false;
      }
      if (selectedDoctorId && String(item.doctorId) !== String(selectedDoctorId)) {
        return false;
      }
      return true;
    });
  }, [enrichedAvailabilities, selectedDeptId, selectedDoctorId]);

  /** 6. Calculate Status Cards locally from loaded table rows (No Dashboard API call) */
  const statusCounts = useMemo(() => {
    const counts = {
      total: enrichedAvailabilities.length,
      available: 0,
      emergency: 0,
      leave: 0,
      unavailable: 0,
    };

    enrichedAvailabilities.forEach((item) => {
      const status = (item.status || '').toUpperCase();
      if (status === 'AVAILABLE') counts.available += 1;
      else if (status === 'EMERGENCY') counts.emergency += 1;
      else if (status === 'LEAVE') counts.leave += 1;
      else if (status === 'UNAVAILABLE') counts.unavailable += 1;
    });

    return counts;
  }, [enrichedAvailabilities]);

  /** Status Change Handler (Clears time values if status is not AVAILABLE) */
  const handleStatusChange = (newStatus, isEdit = false) => {
    if (isEdit) {
      setEditFormData((prev) => ({
        ...prev,
        status: newStatus,
        startTime: newStatus === 'AVAILABLE' ? (prev.startTime || '09:00') : '',
        endTime: newStatus === 'AVAILABLE' ? (prev.endTime || '17:00') : '',
      }));
      if (newStatus !== 'AVAILABLE') {
        setEditFormErrors((prev) => ({ ...prev, startTime: null, endTime: null }));
      }
    } else {
      setAddFormData((prev) => ({
        ...prev,
        status: newStatus,
        startTime: newStatus === 'AVAILABLE' ? (prev.startTime || '09:00') : '',
        endTime: newStatus === 'AVAILABLE' ? (prev.endTime || '17:00') : '',
      }));
      if (newStatus !== 'AVAILABLE') {
        setAddFormErrors((prev) => ({ ...prev, startTime: null, endTime: null }));
      }
    }
  };

  /** Form Validation Helper (Time validation ONLY when AVAILABLE) */
  const validateForm = (data) => {
    const errors = {};
    if (!data.date) errors.date = 'Schedule Date is required';
    if (!data.doctorId) errors.doctorId = 'Please select a Doctor';
    if (!data.status) errors.status = 'Status is required';

    if (data.status === 'AVAILABLE') {
      if (!data.startTime) errors.startTime = 'Start Time is required for Available status';
      if (!data.endTime) errors.endTime = 'End Time is required for Available status';

      if (data.startTime && data.endTime && data.startTime >= data.endTime) {
        errors.endTime = 'Start Time must be before End Time';
      }
    }
    return errors;
  };

  /** Payload Builder (Sends startTime=null and endTime=null for non-AVAILABLE status) */
  const buildPayload = (data) => {
    const isAvail = data.status === 'AVAILABLE';

    const formatTime = (t) => {
      if (!t) return null;
      if (t.length === 5) return `${t}:00`;
      return t;
    };

    return {
      doctorId: Number(data.doctorId),
      date: data.date,
      availableDate: data.date,
      status: data.status,
      startTime: isAvail ? formatTime(data.startTime) : null,
      endTime: isAvail ? formatTime(data.endTime) : null,
    };
  };

  /** Handle Add Schedule Form Submission */
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm(addFormData);
    if (Object.keys(errors).length > 0) {
      setAddFormErrors(errors);
      return;
    }

    setSubmittingAdd(true);
    setAddFormErrors({});

    try {
      const payload = buildPayload(addFormData);
      await doctorAvailabilityApi.create(payload);
      toast.success('Doctor schedule created successfully');
      setShowAddModal(false);
      fetchData(true);
    } catch (err) {
      console.error('Failed to create doctor availability:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to create schedule';
      toast.error(msg);
    } finally {
      setSubmittingAdd(false);
    }
  };

  /** Handle Fetch Details & Open Edit Modal */
  const handleOpenEdit = async (item) => {
    setEditingAvailabilityId(item.id);
    setLoadingEditDetails(true);
    setEditFormErrors({});
    setShowEditModal(true);

    try {
      let detailData = item;
      try {
        const res = await doctorAvailabilityApi.getById(item.id);
        if (res.data) detailData = res.data;
      } catch (e) {
        // Fallback to table item
      }

      const docId = detailData.doctorId || detailData.doctor?.id || item.doctorId || item.doctor?.id;
      const docMeta = doctorMap.get(String(docId || ''));
      const docName =
        detailData.doctorName ||
        item.doctorName ||
        (docMeta ? `Dr. ${docMeta.firstName || ''} ${docMeta.lastName || ''}`.trim() : 'Doctor');

      const status = detailData.status || item.status || 'AVAILABLE';
      const isAvail = status === 'AVAILABLE';

      setEditFormData({
        doctorId: docId || docMeta?.id || '',
        doctorName: docName,
        date: detailData.availableDate || detailData.date || item.availableDate || item.date || selectedDate,
        status: status,
        startTime: isAvail && detailData.startTime ? detailData.startTime.slice(0, 5) : (isAvail ? '09:00' : ''),
        endTime: isAvail && detailData.endTime ? detailData.endTime.slice(0, 5) : (isAvail ? '17:00' : ''),
      });
    } catch (err) {
      console.error('Error opening edit modal:', err);
      toast.error('Failed to load schedule details');
    } finally {
      setLoadingEditDetails(false);
    }
  };

  /** Handle Edit Schedule Form Submission */
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm(editFormData);
    if (Object.keys(errors).length > 0) {
      setEditFormErrors(errors);
      return;
    }

    setSubmittingEdit(true);
    setEditFormErrors({});

    try {
      const payload = buildPayload(editFormData);
      await doctorAvailabilityApi.update(editingAvailabilityId, payload);
      toast.success('Doctor availability updated successfully');
      setShowEditModal(false);
      fetchData(true);
    } catch (err) {
      console.error('Failed to update doctor availability:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to update schedule';
      toast.error(msg);
    } finally {
      setSubmittingEdit(false);
    }
  };

  /** Handle Delete Schedule Confirmation */
  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    setSubmittingDelete(true);

    try {
      await doctorAvailabilityApi.remove(deletingId);
      toast.success('Schedule deleted successfully');
      setDeletingId(null);
      fetchData(true);
    } catch (err) {
      console.error('Failed to delete availability:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to delete schedule';
      toast.error(msg);
    } finally {
      setSubmittingDelete(false);
    }
  };

  /** Status Badge Helper Component */
  const renderStatusBadge = (status) => {
    const normalized = (status || 'UNAVAILABLE').toUpperCase();
    const badgeStyle = STATUS_BADGE_STYLES[normalized] || STATUS_BADGE_STYLES.UNAVAILABLE;

    let icon = <UserCheck className="h-3.5 w-3.5" />;
    if (normalized === 'EMERGENCY') icon = <AlertTriangle className="h-3.5 w-3.5" />;
    else if (normalized === 'LEAVE') icon = <CalendarOff className="h-3.5 w-3.5" />;
    else if (normalized === 'UNAVAILABLE') icon = <UserX className="h-3.5 w-3.5" />;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-xs ${badgeStyle}`}>
        {icon}
        <span>{normalized}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Calendar className="h-6 w-6" />
            </span>
            Daily Doctor Availability
          </h1>
          <p className="mt-1 text-sm text-slate-500 font-medium">
            Manage doctor working schedule and daily availability.
          </p>
        </div>

        <button
          onClick={() => {
            setAddFormData({ ...EMPTY_ADD_FORM, date: selectedDate });
            setAddFormErrors({});
            setShowAddModal(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm shadow-lg shadow-blue-600/20 hover:bg-blue-700 active:scale-[0.98] transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>Add Doctor Schedule</span>
        </button>
      </div>

      {/* Status Cards (Calculated locally from loaded table rows) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Doctors */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Scheduled</span>
            <span className="p-2 rounded-xl bg-slate-100 text-slate-600">
              <Stethoscope className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-slate-900">{statusCounts.total}</span>
            <span className="text-xs text-slate-500 font-medium ml-2">doctors</span>
          </div>
        </div>

        {/* Available */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Available</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <UserCheck className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-emerald-700">{statusCounts.available}</span>
            <span className="text-xs text-emerald-600 font-medium ml-2">on duty</span>
          </div>
        </div>

        {/* Emergency */}
        <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600">Emergency</span>
            <span className="p-2 rounded-xl bg-rose-50 text-rose-600 animate-pulse">
              <AlertTriangle className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-rose-700">{statusCounts.emergency}</span>
            <span className="text-xs text-rose-600 font-medium ml-2">alert</span>
          </div>
        </div>

        {/* Leave */}
        <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Leave</span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <CalendarOff className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-amber-700">{statusCounts.leave}</span>
            <span className="text-xs text-amber-600 font-medium ml-2">on leave</span>
          </div>
        </div>

        {/* Unavailable */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-all col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Unavailable</span>
            <span className="p-2 rounded-xl bg-slate-100 text-slate-500">
              <UserX className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-slate-700">{statusCounts.unavailable}</span>
            <span className="text-xs text-slate-500 font-medium ml-2">off duty</span>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Filter className="h-4 w-4 text-blue-600" />
            Filter Schedule & Availability
          </h2>

          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-all cursor-pointer"
            title="Reload current date data"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>{refreshing ? 'Reloading...' : 'Refresh'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Schedule Date Picker */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-blue-600" />
              Schedule Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-800 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all cursor-pointer"
            />
          </div>

          {/* Department Dropdown (Loaded via GET /api/departments) */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-blue-600" />
              Department
            </label>
            <select
              value={selectedDeptId}
              onChange={(e) => {
                setSelectedDeptId(e.target.value);
                setSelectedDoctorId(''); // Reset doctor filter on department change
              }}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-800 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all cursor-pointer"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.departmentName || dept.name}
                </option>
              ))}
            </select>
          </div>

          {/* Doctor Dropdown (Loaded via GET /api/doctors/all, filtered locally by Department) */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Stethoscope className="h-3.5 w-3.5 text-blue-600" />
              Doctor
            </label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-800 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all cursor-pointer"
            >
              <option value="">All Doctors</option>
              {filteredDoctorsForDropdown.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  Dr. {doc.firstName} {doc.lastName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Doctor Availability Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          /* Skeleton Loader */
          <div className="p-8 space-y-4">
            <div className="h-6 bg-slate-100 rounded-lg w-1/4 animate-pulse"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-slate-100/70 rounded-xl animate-pulse"></div>
              ))}
            </div>
          </div>
        ) : filteredAvailabilities.length === 0 ? (
          /* Empty State */
          <div className="p-12 text-center space-y-3">
            <div className="inline-flex p-4 rounded-full bg-slate-50 text-slate-400 border border-slate-100">
              <CalendarOff className="h-10 w-10 stroke-1" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">No Doctor Availability Found</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              There are no doctor availability schedules recorded for {selectedDate}. Click &quot;Add Doctor Schedule&quot; above to create one.
            </p>
            <button
              onClick={() => {
                setAddFormData({ ...EMPTY_ADD_FORM, date: selectedDate });
                setAddFormErrors({});
                setShowAddModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs shadow-md hover:bg-blue-700 transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Schedule for {selectedDate}</span>
            </button>
          </div>
        ) : (
          /* Availability Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Doctor Details</th>
                  <th className="py-3.5 px-6">Department</th>
                  <th className="py-3.5 px-6">Date</th>
                  <th className="py-3.5 px-6">OPD Time Range</th>
                  <th className="py-3.5 px-6 text-center">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredAvailabilities.map((item) => {
                  const displayDate = item.availableDate || item.date || selectedDate;
                  const displayStart = item.startTime ? item.startTime.slice(0, 5) : '—';
                  const displayEnd = item.endTime ? item.endTime.slice(0, 5) : '—';
                  const isAvailableStatus = (item.status || '').toUpperCase() === 'AVAILABLE';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                      {/* Doctor Name & Specialization */}
                      <td className="py-4 px-6 font-medium text-slate-900">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0">
                            <Stethoscope className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 leading-tight">{item.doctorName}</p>
                            <p className="text-xs text-slate-400 font-normal">{item.specializationName}</p>
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-4 px-6 text-slate-600 font-medium">{item.departmentName}</td>

                      {/* Date */}
                      <td className="py-4 px-6 font-semibold text-slate-800 whitespace-nowrap">{displayDate}</td>

                      {/* OPD Time Range */}
                      <td className="py-4 px-6 font-medium text-slate-700 whitespace-nowrap">
                        {isAvailableStatus ? (
                          <span className="inline-flex items-center gap-1.5 text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-mono font-semibold">
                            <Clock className="h-3.5 w-3.5 text-slate-500" />
                            {displayStart} - {displayEnd}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Not applicable</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6 text-center whitespace-nowrap">{renderStatusBadge(item.status)}</td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="inline-flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer"
                            title="Edit Availability"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setDeletingId(item.id);
                              setDeletingDoctorName(item.doctorName);
                            }}
                            className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                            title="Delete Availability"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= ADD SCHEDULE MODAL ================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Add Doctor Schedule
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              {/* Doctor Dropdown (Loaded from GET /api/doctors/all) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Doctor <span className="text-rose-500">*</span>
                </label>
                <select
                  value={addFormData.doctorId}
                  onChange={(e) => {
                    setAddFormData((prev) => ({ ...prev, doctorId: e.target.value }));
                    if (addFormErrors.doctorId) setAddFormErrors((prev) => ({ ...prev, doctorId: null }));
                  }}
                  className={`w-full rounded-xl border ${
                    addFormErrors.doctorId ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                  } px-3.5 py-2.5 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all cursor-pointer`}
                >
                  <option value="">Select Doctor</option>
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      Dr. {doc.firstName} {doc.lastName} ({doc.departmentName || doc.specializationName || 'General'})
                    </option>
                  ))}
                </select>
                {addFormErrors.doctorId && <p className="text-xs text-rose-500 font-medium mt-1">{addFormErrors.doctorId}</p>}
              </div>

              {/* Date Picker */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Schedule Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={addFormData.date}
                  onChange={(e) => {
                    setAddFormData((prev) => ({ ...prev, date: e.target.value }));
                    if (addFormErrors.date) setAddFormErrors((prev) => ({ ...prev, date: null }));
                  }}
                  className={`w-full rounded-xl border ${
                    addFormErrors.date ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                  } px-3.5 py-2.5 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all cursor-pointer`}
                />
                {addFormErrors.date && <p className="text-xs text-rose-500 font-medium mt-1">{addFormErrors.date}</p>}
              </div>

              {/* Status Radio Buttons */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Availability Status <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {STATUS_OPTIONS.map((opt) => {
                    const isChecked = addFormData.status === opt.value;
                    return (
                      <label
                        key={opt.value}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                          isChecked
                            ? 'border-blue-600 bg-blue-50/60 font-bold text-blue-900 shadow-xs'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
                        }`}
                      >
                        <input
                          type="radio"
                          name="addStatus"
                          value={opt.value}
                          checked={isChecked}
                          onChange={(e) => handleStatusChange(e.target.value, false)}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs">{opt.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Start & End Time (Required only when AVAILABLE) */}
              {addFormData.status === 'AVAILABLE' && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Start Time *</label>
                    <input
                      type="time"
                      value={addFormData.startTime}
                      onChange={(e) => {
                        setAddFormData((prev) => ({ ...prev, startTime: e.target.value }));
                        if (addFormErrors.startTime) setAddFormErrors((prev) => ({ ...prev, startTime: null }));
                      }}
                      className={`w-full rounded-xl border ${
                        addFormErrors.startTime ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                      } px-3 py-2 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all cursor-pointer`}
                    />
                    {addFormErrors.startTime && <p className="text-xs text-rose-500 font-medium mt-1">{addFormErrors.startTime}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">End Time *</label>
                    <input
                      type="time"
                      value={addFormData.endTime}
                      onChange={(e) => {
                        setAddFormData((prev) => ({ ...prev, endTime: e.target.value }));
                        if (addFormErrors.endTime) setAddFormErrors((prev) => ({ ...prev, endTime: null }));
                      }}
                      className={`w-full rounded-xl border ${
                        addFormErrors.endTime ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                      } px-3 py-2 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all cursor-pointer`}
                    />
                    {addFormErrors.endTime && <p className="text-xs text-rose-500 font-medium mt-1">{addFormErrors.endTime}</p>}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={submittingAdd}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAdd}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-600/20 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {submittingAdd ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Schedule</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT SCHEDULE MODAL ================= */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-blue-600" />
                Edit Doctor Availability
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            {loadingEditDetails ? (
              <div className="p-8 text-center space-y-3">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto" />
                <p className="text-sm font-medium text-slate-600">Loading schedule details...</p>
              </div>
            ) : (
              <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                {/* Read-Only Doctor Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Doctor</label>
                  <input
                    type="text"
                    value={editFormData.doctorName}
                    readOnly
                    className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm font-bold text-slate-700 cursor-not-allowed outline-none"
                  />
                </div>

                {/* Schedule Date */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Schedule Date *</label>
                  <input
                    type="date"
                    value={editFormData.date}
                    onChange={(e) => setEditFormData((prev) => ({ ...prev, date: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all cursor-pointer"
                  />
                </div>

                {/* Status Radio Buttons */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Availability Status *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {STATUS_OPTIONS.map((opt) => {
                      const isChecked = editFormData.status === opt.value;
                      return (
                        <label
                          key={opt.value}
                          className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${
                            isChecked
                              ? 'border-blue-600 bg-blue-50/60 font-bold text-blue-900 shadow-xs'
                              : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
                          }`}
                        >
                          <input
                            type="radio"
                            name="editStatus"
                            value={opt.value}
                            checked={isChecked}
                            onChange={(e) => handleStatusChange(e.target.value, true)}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-xs">{opt.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Start & End Time (Required only when AVAILABLE) */}
                {editFormData.status === 'AVAILABLE' && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Start Time *</label>
                      <input
                        type="time"
                        value={editFormData.startTime}
                        onChange={(e) => {
                          setEditFormData((prev) => ({ ...prev, startTime: e.target.value }));
                          if (editFormErrors.startTime) setEditFormErrors((prev) => ({ ...prev, startTime: null }));
                        }}
                        className={`w-full rounded-xl border ${
                          editFormErrors.startTime ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                        } px-3 py-2 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all cursor-pointer`}
                      />
                      {editFormErrors.startTime && <p className="text-xs text-rose-500 font-medium mt-1">{editFormErrors.startTime}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">End Time *</label>
                      <input
                        type="time"
                        value={editFormData.endTime}
                        onChange={(e) => {
                          setEditFormData((prev) => ({ ...prev, endTime: e.target.value }));
                          if (editFormErrors.endTime) setEditFormErrors((prev) => ({ ...prev, endTime: null }));
                        }}
                        className={`w-full rounded-xl border ${
                          editFormErrors.endTime ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                        } px-3 py-2 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all cursor-pointer`}
                      />
                      {editFormErrors.endTime && <p className="text-xs text-rose-500 font-medium mt-1">{editFormErrors.endTime}</p>}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    disabled={submittingEdit}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingEdit}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-600/20 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {submittingEdit ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <span>Update Schedule</span>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION DIALOG ================= */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-100">
              <AlertCircle className="h-6 w-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-slate-900">Delete Availability Schedule?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to delete schedule for <strong className="text-slate-800">{deletingDoctorName}</strong> on {selectedDate}? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                disabled={submittingDelete}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={submittingDelete}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-md shadow-rose-600/20 disabled:opacity-50 transition-all cursor-pointer"
              >
                {submittingDelete ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Schedule</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
