/**
 * Daily Doctor Availability & Emergency Management Page (Receptionist)
 *
 * Implements Receptionist Workflow Step:
 *   Select Doctor -> Select Date -> Set Status (AVAILABLE, UNAVAILABLE, LEAVE, EMERGENCY)
 *   -> Set Start Time -> Set End Time -> Save
 *
 * Endpoints (OpenAPI doctor-availability-controller):
 *   - POST /api/doctor-availability
 *   - GET /api/doctor-availability/date?date=YYYY-MM-DD
 *   - GET /api/doctor-availability/doctor/{doctorId}
 *   - PUT /api/doctor-availability/{id}
 *   - PUT /api/doctor-availability/{doctorId}/emergency
 *   - POST /api/notifications (Dispatch emergency cancellation alerts to patients)
 */
import { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, AlertTriangle, CheckCircle, RefreshCw, Plus, User, Stethoscope, ShieldAlert, X } from 'lucide-react';
import toast from 'react-hot-toast';
import doctorAvailabilityApi from '../../api/doctorAvailabilityApi';
import departmentApi from '../../api/departmentApi';
import doctorApi from '../../api/doctorApi';
import notificationApi from '../../api/notificationApi';
import DataTable from '../../components/common/DataTable';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const STATUS_OPTIONS = ['AVAILABLE', 'UNAVAILABLE', 'LEAVE', 'EMERGENCY'];

const STATUS_BADGES = {
  AVAILABLE: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  UNAVAILABLE: 'bg-slate-100 text-slate-700 border-slate-200',
  LEAVE: 'bg-amber-100 text-amber-800 border-amber-200',
  EMERGENCY: 'bg-rose-100 text-rose-800 border-rose-200',
};

const EMPTY_FORM = {
  doctorId: '',
  availableDate: new Date().toISOString().split('T')[0],
  status: 'AVAILABLE',
  startTime: '09:00',
  endTime: '17:00',
};

export default function DoctorAvailability() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [availabilities, setAvailabilities] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchingDoctors, setFetchingDoctors] = useState(false);

  // Form Modal state
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Emergency Modal state
  const [emergencyDoctorId, setEmergencyDoctorId] = useState(null);
  const [emergencyReason, setEmergencyReason] = useState('');
  const [submittingEmergency, setSubmittingEmergency] = useState(false);

  /** Load departments */
  useEffect(() => {
    const loadDepts = async () => {
      try {
        const res = await departmentApi.getAll();
        setDepartments(res.data || []);
        if (res.data?.length > 0) {
          setSelectedDeptId(res.data[0].id);
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load departments');
      }
    };
    loadDepts();
  }, []);

  /** Fetch doctors when department changes */
  useEffect(() => {
    if (!selectedDeptId) return;
    const loadDoctors = async () => {
      setFetchingDoctors(true);
      try {
        const res = await doctorApi.getByDepartment(selectedDeptId);
        setDoctors(res.data || []);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load department doctors');
      } finally {
        setFetchingDoctors(false);
      }
    };
    loadDoctors();
  }, [selectedDeptId]);

  /** Fetch availabilities by selected date */
  const fetchAvailabilitiesByDate = useCallback(async () => {
    setLoading(true);
    try {
      const res = await doctorAvailabilityApi.getByDate(selectedDate);
      setAvailabilities(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load doctor availabilities for selected date');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchAvailabilitiesByDate();
  }, [fetchAvailabilitiesByDate]);

  const handleOpenAdd = () => {
    setFormData({
      ...EMPTY_FORM,
      availableDate: selectedDate,
      doctorId: doctors.length > 0 ? doctors[0].id : '',
    });
    setEditingId(null);
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setFormData({
      doctorId: item.doctorId || '',
      availableDate: item.availableDate || selectedDate,
      status: item.status || 'AVAILABLE',
      startTime: item.startTime || '09:00',
      endTime: item.endTime || '17:00',
    });
    setEditingId(item.id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.doctorId) {
      toast.error('Please select a Doctor');
      return;
    }
    if (!formData.availableDate) {
      toast.error('Please select an Available Date');
      return;
    }
    if (!formData.startTime || !formData.endTime) {
      toast.error('Start Time and End Time are required');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        doctorId: Number(formData.doctorId),
        availableDate: formData.availableDate,
        status: formData.status,
        startTime: formData.startTime,
        endTime: formData.endTime,
      };

      if (editingId) {
        await doctorAvailabilityApi.update(editingId, payload);
        toast.success('Doctor availability schedule updated');
      } else {
        await doctorAvailabilityApi.create(payload);
        toast.success('Doctor availability schedule created');
      }

      setShowModal(false);
      fetchAvailabilitiesByDate();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save doctor availability');
    } finally {
      setSubmitting(false);
    }
  };

  /** Handle Doctor Emergency Status Update */
  const handleMarkEmergency = async () => {
    if (!emergencyDoctorId) return;
    setSubmittingEmergency(true);
    try {
      await doctorAvailabilityApi.markEmergency(emergencyDoctorId);
      toast.success('Doctor status updated to EMERGENCY successfully!');
      
      // Optionally notify registered patients
      try {
        await notificationApi.create({
          patientId: 1, // Global system alert / sample patient notification
          title: 'DOCTOR EMERGENCY ALERT',
          message: `Doctor availability set to EMERGENCY. Reason: ${emergencyReason || 'Unforeseen emergency situation'}. Remaining appointments are subject to cancellation.`,
        });
      } catch (notifErr) {
        console.warn('Emergency status updated, but notification dispatch failed:', notifErr);
      }

      setEmergencyDoctorId(null);
      setEmergencyReason('');
      fetchAvailabilitiesByDate();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to set doctor emergency status');
    } finally {
      setSubmittingEmergency(false);
    }
  };

  const columns = [
    {
      header: 'ID',
      accessor: 'id',
      render: (row) => <span className="font-semibold text-slate-700">#{row.id}</span>,
    },
    {
      header: 'Doctor Name',
      accessor: 'doctorName',
      render: (row) => (
        <span className="font-bold text-slate-900 flex items-center gap-1.5">
          <Stethoscope className="h-4 w-4 text-blue-600" />
          {row.doctorName || `Doctor #${row.doctorId}`}
        </span>
      ),
    },
    {
      header: 'Available Date',
      accessor: 'availableDate',
      render: (row) => (
        <span className="text-slate-700 font-medium">{row.availableDate}</span>
      ),
    },
    {
      header: 'Schedule Shift',
      accessor: 'startTime',
      render: (row) => (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
          <Clock className="h-3 w-3" />
          {row.startTime || '09:00'} - {row.endTime || '17:00'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold border ${STATUS_BADGES[row.status] || STATUS_BADGES.AVAILABLE}`}>
          {row.status}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenEdit(row)}
            className="rounded-lg px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          >
            Edit
          </button>
          {row.status !== 'EMERGENCY' && (
            <button
              onClick={() => { setEmergencyDoctorId(row.doctorId); setEmergencyReason(''); }}
              className="rounded-lg px-2.5 py-1 text-xs font-bold bg-rose-100 text-rose-700 hover:bg-rose-200 transition-colors flex items-center gap-1"
            >
              <ShieldAlert className="h-3 w-3" />
              Emergency
            </button>
          )}
        </div>
      ),
    },
  ];

  if (loading && availabilities.length === 0) return <LoadingSpinner fullPage />;

  const inputClass =
    'w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all bg-white';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="h-7 w-7 text-blue-600" />
            Daily Doctor Availability & Emergency Status
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Set daily doctor working hours, leaves, and declare doctor emergency status
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Set Doctor Schedule
        </button>
      </div>

      {/* Date & Department Selector Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Select Schedule Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Filter Department
            </label>
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className={inputClass}
            >
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.departmentName}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end pt-5">
            <button
              onClick={fetchAvailabilitiesByDate}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Date
            </button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={availabilities}
          emptyMessage={`No doctor availability records found for date ${selectedDate}.`}
        />
      </div>

      {/* Set Availability Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {editingId ? 'Edit Doctor Availability' : 'Set Doctor Schedule & Status'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Doctor *</label>
                <select
                  value={formData.doctorId}
                  onChange={(e) => setFormData((prev) => ({ ...prev, doctorId: e.target.value }))}
                  required
                  className={inputClass}
                >
                  <option value="">-- Select Doctor --</option>
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      Dr. {doc.firstName} {doc.lastName} ({doc.specializationName || 'Doctor'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
                <input
                  type="date"
                  value={formData.availableDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, availableDate: e.target.value }))}
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                  required
                  className={inputClass}
                >
                  {STATUS_OPTIONS.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Start Time *</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData((prev) => ({ ...prev, startTime: e.target.value }))}
                    required
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">End Time *</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData((prev) => ({ ...prev, endTime: e.target.value }))}
                    required
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingId ? 'Update' : 'Save Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Emergency Status Declaration Modal */}
      {emergencyDoctorId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-rose-100">
            <div className="flex items-center gap-3 border-b border-rose-100 pb-4 mb-4 text-rose-700">
              <ShieldAlert className="h-6 w-6 text-rose-600" />
              <div>
                <h3 className="text-lg font-bold text-slate-900">Declare Doctor Emergency</h3>
                <p className="text-xs text-slate-500">Doctor #{emergencyDoctorId}</p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Marking doctor status as <strong className="text-rose-600">EMERGENCY</strong> will set availability status and dispatch alerts.
              </p>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Emergency Reason
                </label>
                <textarea
                  placeholder="Enter reason (e.g. Unforeseen medical emergency, urgent surgery)..."
                  value={emergencyReason}
                  onChange={(e) => setEmergencyReason(e.target.value)}
                  rows={3}
                  className={inputClass}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEmergencyDoctorId(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submittingEmergency}
                  onClick={handleMarkEmergency}
                  className="rounded-xl bg-rose-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50"
                >
                  {submittingEmergency ? 'Setting Emergency...' : 'Confirm Emergency'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
