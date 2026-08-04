/**
 * MyAvailability.jsx — Doctor Panel Schedule & Availability Management
 *
 * Route: /doctor/my-availability
 * Title: My Availability
 * Subtitle: Manage your schedule and availability.
 *
 * Business Rules:
 *   1. Status = AVAILABLE:
 *      - Show Start Time and End Time fields (Mandatory).
 *      - Validate before submitting.
 *      - Send startTime and endTime in API payload ("09:00:00").
 *   2. Status = UNAVAILABLE, LEAVE, or EMERGENCY:
 *      - Hide Start Time and End Time fields.
 *      - Clear previously selected time values.
 *      - Send startTime = null and endTime = null in API request.
 *   3. Edit Mode:
 *      - If status is AVAILABLE, populate time fields.
 *      - If status is UNAVAILABLE, LEAVE, or EMERGENCY, hide time fields automatically.
 *   4. Validation:
 *      - Time validation ONLY runs when status === 'AVAILABLE'.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CalendarDays,
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
  Stethoscope,
} from 'lucide-react';
import toast from 'react-hot-toast';
import doctorAvailabilityApi from '../../api/doctorAvailabilityApi';
import doctorApi from '../../api/doctorApi';
import { useAuth } from '../../context/AuthContext';

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
  date: new Date().toISOString().split('T')[0],
  status: 'AVAILABLE',
  startTime: '09:00',
  endTime: '17:00',
};

export default function MyAvailability() {
  const { user } = useAuth();
  const doctorUserId = user?.userId || user?.id;

  // Main Page States
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [doctor, setDoctor] = useState(null);
  const [availabilities, setAvailabilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Add Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addFormData, setAddFormData] = useState(EMPTY_ADD_FORM);
  const [addFormErrors, setAddFormErrors] = useState({});
  const [submittingAdd, setSubmittingAdd] = useState(false);

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState(EMPTY_ADD_FORM);
  const [editFormErrors, setEditFormErrors] = useState({});
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Delete Dialog State
  const [deletingId, setDeletingId] = useState(null);
  const [submittingDelete, setSubmittingDelete] = useState(false);

  /** Load Doctor Profile and Schedules */
  const fetchData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const profileRes = doctorUserId ? await doctorApi.getById(doctorUserId).catch(() => null) : null;
        if (profileRes?.data) {
          setDoctor(profileRes.data);
        }

        const activeId = profileRes?.data?.id || doctorUserId;

        const [dateRes, docRes] = await Promise.all([
          doctorAvailabilityApi.getByDate(selectedDate).catch(() => ({ data: [] })),
          activeId ? doctorAvailabilityApi.getByDoctor(activeId).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
        ]);

        const listFromDate = Array.isArray(dateRes?.data) ? dateRes.data : (dateRes?.data?.data || []);
        const listFromDoc = Array.isArray(docRes?.data) ? docRes.data : (docRes?.data?.data || []);

        const combinedMap = new Map();
        [...listFromDate, ...listFromDoc].forEach((item) => {
          if (item && item.id) {
            combinedMap.set(String(item.id), item);
          }
        });

        const combinedList = Array.from(combinedMap.values());
        setAvailabilities(combinedList.length > 0 ? combinedList : listFromDate);

        if (isRefresh) {
          toast.success('Availability schedule reloaded');
        }
      } catch (err) {
        console.error('Failed to load availability:', err);
        toast.error('Unable to load availability schedule');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedDate, doctorUserId]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activeDocId = doctor?.id || doctorUserId;

  /** Filter Availabilities strictly for logged-in Doctor */
  const myAvailabilities = useMemo(() => {
    if (!activeDocId) return availabilities;
    return availabilities.filter((item) => {
      const itemDocId = String(item.doctorId || item.doctor?.id || '');
      return itemDocId === String(activeDocId) || itemDocId === String(doctorUserId);
    });
  }, [availabilities, activeDocId, doctorUserId]);

  /** Status Counts */
  const statusCounts = useMemo(() => {
    const counts = { total: myAvailabilities.length, available: 0, emergency: 0, leave: 0, unavailable: 0 };
    myAvailabilities.forEach((item) => {
      const status = (item.status || '').toUpperCase();
      if (status === 'AVAILABLE') counts.available += 1;
      else if (status === 'EMERGENCY') counts.emergency += 1;
      else if (status === 'LEAVE') counts.leave += 1;
      else if (status === 'UNAVAILABLE') counts.unavailable += 1;
    });
    return counts;
  }, [myAvailabilities]);

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

  /** Form Validation (Time validation ONLY when AVAILABLE) */
  const validateForm = (data) => {
    const errors = {};
    if (!data.date) errors.date = 'Schedule Date is required';
    if (!data.status) errors.status = 'Status is required';

    if (data.status === 'AVAILABLE') {
      if (!data.startTime) errors.startTime = 'Start Time is required';
      if (!data.endTime) errors.endTime = 'End Time is required';
      if (data.startTime && data.endTime && data.startTime >= data.endTime) {
        errors.endTime = 'Start Time must be before End Time';
      }
    }
    return errors;
  };

  /** Payload Builder (Sends startTime=null and endTime=null for non-AVAILABLE status) */
  const buildPayload = (docId, data) => {
    const isAvail = data.status === 'AVAILABLE';

    const formatTime = (t) => {
      if (!t) return null;
      if (t.length === 5) return `${t}:00`;
      return t;
    };

    return {
      doctorId: Number(docId),
      availableDate: data.date,
      date: data.date,
      status: data.status,
      startTime: isAvail ? formatTime(data.startTime) : null,
      endTime: isAvail ? formatTime(data.endTime) : null,
    };
  };

  /** Handle Add Submission */
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
      const payload = buildPayload(activeDocId, addFormData);
      await doctorAvailabilityApi.create(payload);
      toast.success('Availability schedule created successfully');
      setShowAddModal(false);
      fetchData(true);
    } catch (err) {
      console.error('Failed to create availability:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to save schedule';
      toast.error(msg);
    } finally {
      setSubmittingAdd(false);
    }
  };

  /** Open Edit Modal */
  const handleOpenEdit = (item) => {
    setEditingId(item.id);
    const status = item.status || 'AVAILABLE';
    const isAvail = status === 'AVAILABLE';

    setEditFormData({
      date: item.availableDate || item.date || selectedDate,
      status: status,
      startTime: isAvail && item.startTime ? item.startTime.slice(0, 5) : (isAvail ? '09:00' : ''),
      endTime: isAvail && item.endTime ? item.endTime.slice(0, 5) : (isAvail ? '17:00' : ''),
    });
    setEditFormErrors({});
    setShowEditModal(true);
  };

  /** Handle Edit Submission */
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
      const payload = buildPayload(activeDocId, editFormData);
      await doctorAvailabilityApi.update(editingId, payload);
      toast.success('Availability schedule updated successfully');
      setShowEditModal(false);
      fetchData(true);
    } catch (err) {
      console.error('Failed to update availability:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to update schedule';
      toast.error(msg);
    } finally {
      setSubmittingEdit(false);
    }
  };

  /** Handle Delete Confirmation */
  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    setSubmittingDelete(true);

    try {
      await doctorAvailabilityApi.remove(deletingId);
      toast.success('Availability schedule deleted successfully');
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

  /** Render Badge */
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

  const doctorFullName = doctor?.firstName
    ? `Dr. ${doctor.firstName} ${doctor.lastName || ''}`.trim()
    : user?.name
    ? `Dr. ${user.name}`
    : 'Doctor';

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <CalendarDays className="h-6 w-6" />
            </span>
            My Availability
          </h1>
          <p className="mt-1 text-sm text-slate-500 font-medium">
            Manage your schedule and availability.
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
          <span>Add Availability</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Schedules</span>
          <div className="mt-3">
            <span className="text-3xl font-black text-slate-900">{statusCounts.total}</span>
            <span className="text-xs text-slate-500 font-medium ml-2">entries</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Available</span>
          <div className="mt-3">
            <span className="text-3xl font-black text-emerald-700">{statusCounts.available}</span>
            <span className="text-xs text-emerald-600 font-medium ml-2">on duty</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-600">Emergency</span>
          <div className="mt-3">
            <span className="text-3xl font-black text-rose-700">{statusCounts.emergency}</span>
            <span className="text-xs text-rose-600 font-medium ml-2">alert</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Leave</span>
          <div className="mt-3">
            <span className="text-3xl font-black text-amber-700">{statusCounts.leave}</span>
            <span className="text-xs text-amber-600 font-medium ml-2">on leave</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between col-span-2 sm:col-span-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Unavailable</span>
          <div className="mt-3">
            <span className="text-3xl font-black text-slate-700">{statusCounts.unavailable}</span>
            <span className="text-xs text-slate-500 font-medium ml-2">off duty</span>
          </div>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1 w-full sm:w-64">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-blue-600" />
            Select Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-800 bg-slate-50/50 focus:bg-white focus:border-blue-500 outline-none transition-all cursor-pointer"
          />
        </div>

        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-blue-50/70 border border-blue-100 text-blue-900 text-xs font-bold">
          <Stethoscope className="h-4 w-4 text-blue-600" />
          <div>
            <p className="text-slate-500 font-medium text-[10px]">LOGGED-IN PHYSICIAN</p>
            <p className="text-blue-900 font-bold">{doctorFullName} {doctor?.specializationName ? `(${doctor.specializationName})` : ''}</p>
          </div>
        </div>

        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
          <span>{refreshing ? 'Reloading...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Schedule Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            <div className="h-6 bg-slate-100 rounded-lg w-1/4 animate-pulse" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-slate-100/70 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        ) : myAvailabilities.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="inline-flex p-4 rounded-full bg-slate-50 text-slate-400 border border-slate-100">
              <CalendarOff className="h-10 w-10 stroke-1" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">No Availability Schedule Found</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              You have no schedule recorded for {selectedDate}. Click &quot;Add Availability&quot; to set your working status.
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
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Doctor Details</th>
                  <th className="py-3.5 px-6">Date</th>
                  <th className="py-3.5 px-6">OPD Hours</th>
                  <th className="py-3.5 px-6 text-center">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {myAvailabilities.map((item) => {
                  const displayDate = item.availableDate || item.date || selectedDate;
                  const displayStart = item.startTime ? item.startTime.slice(0, 5) : '—';
                  const displayEnd = item.endTime ? item.endTime.slice(0, 5) : '—';
                  const isAvailable = (item.status || '').toUpperCase() === 'AVAILABLE';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6 font-medium text-slate-900">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0">
                            <Stethoscope className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 leading-tight">{doctorFullName}</p>
                            <p className="text-xs text-slate-400 font-normal">{doctor?.departmentName || 'General Medicine'}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6 font-semibold text-slate-800 whitespace-nowrap">{displayDate}</td>

                      <td className="py-4 px-6 font-medium text-slate-700 whitespace-nowrap">
                        {isAvailable ? (
                          <span className="inline-flex items-center gap-1.5 text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-mono font-semibold">
                            <Clock className="h-3.5 w-3.5 text-slate-500" />
                            {displayStart} - {displayEnd}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Not applicable</span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-center whitespace-nowrap">{renderStatusBadge(item.status)}</td>

                      <td className="py-4 px-6 text-right">
                        <div className="inline-flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer"
                            title="Edit Schedule"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeletingId(item.id)}
                            className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                            title="Delete Schedule"
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

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-blue-600" />
                Add Availability
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Doctor</label>
                <div className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-blue-600" />
                  <span>{doctorFullName}</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Date *</label>
                <input
                  type="date"
                  value={addFormData.date}
                  onChange={(e) => {
                    setAddFormData((prev) => ({ ...prev, date: e.target.value }));
                    if (addFormErrors.date) setAddFormErrors((prev) => ({ ...prev, date: null }));
                  }}
                  className={`w-full rounded-xl border ${
                    addFormErrors.date ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                  } px-3.5 py-2.5 text-sm font-medium focus:border-blue-500 outline-none transition-all cursor-pointer`}
                />
                {addFormErrors.date && <p className="text-xs text-rose-500 font-medium mt-1">{addFormErrors.date}</p>}
              </div>

              {/* Status Radio Buttons */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Availability Status *</label>
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

              {/* Conditional Time Fields: ONLY shown when AVAILABLE */}
              {addFormData.status === 'AVAILABLE' && (
                <div className="grid grid-cols-2 gap-3 pt-1 animate-fade-in">
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
                      } px-3 py-2 text-sm font-medium focus:border-blue-500 outline-none transition-all cursor-pointer`}
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
                      } px-3 py-2 text-sm font-medium focus:border-blue-500 outline-none transition-all cursor-pointer`}
                    />
                    {addFormErrors.endTime && <p className="text-xs text-rose-500 font-medium mt-1">{addFormErrors.endTime}</p>}
                  </div>
                </div>
              )}

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
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md disabled:opacity-50 transition-all cursor-pointer"
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

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-blue-600" />
                Edit Availability
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Date *</label>
                <input
                  type="date"
                  value={editFormData.date}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, date: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:border-blue-500 outline-none transition-all cursor-pointer"
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

              {/* Conditional Time Fields: ONLY shown when AVAILABLE */}
              {editFormData.status === 'AVAILABLE' && (
                <div className="grid grid-cols-2 gap-3 pt-1 animate-fade-in">
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
                      } px-3 py-2 text-sm font-medium focus:border-blue-500 outline-none transition-all cursor-pointer`}
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
                      } px-3 py-2 text-sm font-medium focus:border-blue-500 outline-none transition-all cursor-pointer`}
                    />
                    {editFormErrors.endTime && <p className="text-xs text-rose-500 font-medium mt-1">{editFormErrors.endTime}</p>}
                  </div>
                </div>
              )}

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
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md disabled:opacity-50 transition-all cursor-pointer"
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
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-100">
              <AlertCircle className="h-6 w-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-slate-900">Delete Availability Schedule?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to delete your availability schedule on {selectedDate}?
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
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-md disabled:opacity-50 transition-all cursor-pointer"
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
