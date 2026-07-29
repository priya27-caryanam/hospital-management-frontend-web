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
  const [allDoctors, setAllDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDeptId, setSelectedDeptId] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form Modal state
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Emergency Modal state
  const [emergencyDoctorId, setEmergencyDoctorId] = useState(null);
  const [emergencyReason, setEmergencyReason] = useState('');
  const [submittingEmergency, setSubmittingEmergency] = useState(false);

  /** Load departments and doctors for all departments */
  const fetchMetadataAndAvailabilities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Load departments
      const deptRes = await departmentApi.getAll();
      const deptList = deptRes.data || [];
      setDepartments(deptList);

      // 2. Fetch doctors for all departments
      const docPromises = deptList.map((d) => doctorApi.getByDepartment(d.id).catch(() => ({ data: [] })));
      const docResults = await Promise.all(docPromises);
      const docMap = new Map();
      docResults.forEach((res) => {
        (res.data || []).forEach((d) => {
          if (d && d.id) docMap.set(d.id, d);
        });
      });
      const uniqueDoctors = Array.from(docMap.values());
      setAllDoctors(uniqueDoctors);

      // 3. Fetch availabilities for selected date
      const availRes = await doctorAvailabilityApi.getByDate(selectedDate).catch(() => ({ data: [] }));
      setAvailabilities(availRes.data || []);
    } catch (err) {
      console.error(err);
      setError('Failed to load doctor availability data.');
      toast.error('Failed to load doctor availabilities');
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchMetadataAndAvailabilities();
  }, [fetchMetadataAndAvailabilities]);

  const handleOpenAdd = (doc = null) => {
    setFormData({
      ...EMPTY_FORM,
      availableDate: selectedDate,
      doctorId: doc ? doc.id : (allDoctors.length > 0 ? allDoctors[0].id : ''),
      startTime: '10:00',
      endTime: '19:00',
    });
    setEditingId(null);
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setFormData({
      doctorId: item.doctorId || '',
      availableDate: item.availableDate || selectedDate,
      status: item.status || 'AVAILABLE',
      startTime: item.startTimeRaw || item.startTime || '10:00',
      endTime: item.endTimeRaw || item.endTime || '19:00',
    });
    setEditingId(item.availabilityId || null);
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
      fetchMetadataAndAvailabilities();
      window.dispatchEvent(new Event('hms_dashboard_refresh'));
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
      setEmergencyDoctorId(null);
      setEmergencyReason('');
      fetchMetadataAndAvailabilities();
      window.dispatchEvent(new Event('hms_dashboard_refresh'));
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to set doctor emergency status');
    } finally {
      setSubmittingEmergency(false);
    }
  };

  /** Build Merged Doctor Availabilities Array so EVERY active doctor is displayed */
  const mergedRows = allDoctors
    .filter((doc) => {
      if (selectedDeptId === 'ALL' || !selectedDeptId) return true;
      return String(doc.departmentId) === String(selectedDeptId);
    })
    .map((doc) => {
      const record = availabilities.find((a) => Number(a.doctorId) === Number(doc.id));
      const docName = `Dr. ${doc.firstName ? `${doc.firstName} ${doc.lastName}` : doc.name || 'Doctor'}`;
      const deptName = doc.departmentName || doc.department || 'General';
      const specName = doc.specializationName || doc.specialization || 'Medical Specialist';

      if (record) {
        return {
          id: record.id,
          availabilityId: record.id,
          doctorId: doc.id,
          doctorName: docName,
          departmentName: deptName,
          specializationName: specName,
          availableDate: record.availableDate || selectedDate,
          status: record.status || 'AVAILABLE',
          startTime: record.startTime || '10:00 AM',
          endTime: record.endTime || '07:00 PM',
          startTimeRaw: record.startTime,
          endTimeRaw: record.endTime,
          hasCustomSchedule: true,
        };
      }

      // Default values when no doctor availability is configured in backend
      return {
        id: `default-${doc.id}`,
        availabilityId: null,
        doctorId: doc.id,
        doctorName: docName,
        departmentName: deptName,
        specializationName: specName,
        availableDate: selectedDate,
        status: doc.available === false ? 'UNAVAILABLE' : 'AVAILABLE',
        startTime: '10:00 AM',
        endTime: '07:00 PM',
        startTimeRaw: '10:00',
        endTimeRaw: '19:00',
        hasCustomSchedule: false,
      };
    });

  const columns = [
    {
      header: 'Doctor ID',
      accessor: 'doctorId',
      render: (row) => <span className="font-semibold text-slate-700">#{row.doctorId}</span>,
    },
    {
      header: 'Doctor Name',
      accessor: 'doctorName',
      render: (row) => (
        <div>
          <span className="font-bold text-slate-900 flex items-center gap-1.5">
            <Stethoscope className="h-4 w-4 text-blue-600" />
            {row.doctorName}
          </span>
        </div>
      ),
    },
    {
      header: 'Department',
      accessor: 'departmentName',
      render: (row) => (
        <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700">
          {row.departmentName}
        </span>
      ),
    },
    {
      header: 'Specialization',
      accessor: 'specializationName',
      render: (row) => (
        <span className="text-xs font-semibold text-slate-700">{row.specializationName}</span>
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
      header: 'Start Time',
      accessor: 'startTime',
      render: (row) => (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
          <Clock className="h-3 w-3 text-blue-600" />
          {row.startTime}
        </span>
      ),
    },
    {
      header: 'End Time',
      accessor: 'endTime',
      render: (row) => (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
          <Clock className="h-3 w-3 text-blue-600" />
          {row.endTime}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: 'doctorId',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => (row.hasCustomSchedule ? handleOpenEdit(row) : handleOpenAdd(allDoctors.find((d) => d.id === row.doctorId)))}
            className="rounded-lg px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          >
            {row.hasCustomSchedule ? 'Edit Schedule' : 'Set Timing'}
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


  if (loading && allDoctors.length === 0) return <LoadingSpinner fullPage />;

  if (error && allDoctors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-4 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <AlertTriangle className="h-12 w-12 text-rose-500" />
        <div>
          <h2 className="text-lg font-bold text-slate-800">Doctor Availability Unavailable</h2>
          <p className="text-sm text-slate-500 mt-1">{error}</p>
        </div>
        <button
          onClick={fetchMetadataAndAvailabilities}
          className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors"
        >
          Retry Loading
        </button>
      </div>
    );
  }

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
            Set daily doctor working hours (Default: 10:00 AM – 07:00 PM), leaves, and declare emergency status
          </p>
        </div>
        <button
          onClick={() => handleOpenAdd(null)}
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
              <option value="ALL">All Departments ({allDoctors.length} Doctors)</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.departmentName}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end pt-5">
            <button
              onClick={fetchMetadataAndAvailabilities}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Date
            </button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={mergedRows}
          loading={loading}
          emptyMessage={`No active doctors found for selected department.`}
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
                  {allDoctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      Dr. {doc.firstName} {doc.lastName} ({doc.specializationName || doc.specialization || 'Doctor'})
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
