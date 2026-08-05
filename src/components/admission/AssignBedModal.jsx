/**
 * AssignBedModal Component
 * Dialog modal to assign Ward, Room, Bed, Doctor, Insurance Company, and Policy Number
 */
import { useState, useEffect } from 'react';
import { X, Building2, Stethoscope, BedDouble, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import admissionApi from '../../api/admissionApi';
import wardApi from '../../api/wardApi';
import roomApi from '../../api/roomApi';
import bedApi from '../../api/bedApi';
import doctorApi from '../../api/doctorApi';

export default function AssignBedModal({ isOpen, onClose, admission, onSuccess }) {
  const [wards, setWards] = useState([]);
  const [doctors, setDoctors] = useState([]);

  const [selectedWardId, setSelectedWardId] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [selectedBedId, setSelectedBedId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [insuranceCompany, setInsuranceCompany] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');

  const [availableRooms, setAvailableRooms] = useState([]);
  const [availableBeds, setAvailableBeds] = useState([]);

  const [loading, setLoading] = useState(false);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingBeds, setLoadingBeds] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && admission) {
      setSelectedWardId(admission.wardId ? String(admission.wardId) : '');
      setSelectedRoomId(admission.roomId ? String(admission.roomId) : '');
      setSelectedBedId(admission.bedId ? String(admission.bedId) : '');
      setSelectedDoctorId(admission.doctorId ? String(admission.doctorId) : '');
      setInsuranceCompany(admission.insuranceCompany || '');
      setPolicyNumber(admission.policyNumber || '');
      loadInitialData();
    }
  }, [isOpen, admission]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [wardRes, docRes] = await Promise.all([
        wardApi.getActiveWards().catch(() => wardApi.getAll()),
        doctorApi.getAllDoctors().catch(() => ({ data: [] })),
      ]);
      setWards(wardRes.data || []);
      setDoctors(docRes.data || []);
    } catch (err) {
      console.error('Failed to load wards or doctors:', err);
      toast.error('Failed to load wards or doctors data');
    } finally {
      setLoading(false);
    }
  };

  // Update Rooms dropdown when Ward changes via GET /api/wards/{wardId}/rooms
  useEffect(() => {
    if (!selectedWardId) {
      setAvailableRooms([]);
      setSelectedRoomId('');
      setAvailableBeds([]);
      setSelectedBedId('');
      return;
    }

    const fetchRooms = async () => {
      setLoadingRooms(true);
      try {
        const res = await roomApi.getByWard(selectedWardId);
        setAvailableRooms(res.data || []);
      } catch (err) {
        console.error(err);
        setAvailableRooms([]);
      } finally {
        setLoadingRooms(false);
      }
    };
    fetchRooms();
  }, [selectedWardId]);

  // Update Beds dropdown when Room changes via GET /api/rooms/{roomId}/beds/available
  useEffect(() => {
    if (!selectedRoomId) {
      setAvailableBeds([]);
      setSelectedBedId('');
      return;
    }

    const fetchBeds = async () => {
      setLoadingBeds(true);
      try {
        const res = await bedApi.getAvailableByRoom(selectedRoomId);
        let bedsList = res.data || [];
        // If current assigned bed belongs to this room, include it in list
        if (admission?.bedId && String(admission?.roomId) === String(selectedRoomId)) {
          const hasCurrent = bedsList.some((b) => String(b.id) === String(admission.bedId));
          if (!hasCurrent && admission.bedNumber) {
            bedsList.push({ id: admission.bedId, bedNumber: admission.bedNumber, status: 'OCCUPIED' });
          }
        }
        setAvailableBeds(bedsList);
      } catch (err) {
        console.error(err);
        setAvailableBeds([]);
      } finally {
        setLoadingBeds(false);
      }
    };
    fetchBeds();
  }, [selectedRoomId, admission]);

  if (!isOpen || !admission) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedWardId) return toast.error('Please select a Ward');
    if (!selectedRoomId) return toast.error('Please select a Room');
    if (!selectedBedId) return toast.error('Please select an AVAILABLE Bed');
    if (!selectedDoctorId) return toast.error('Please assign an Attending Doctor');

    setSubmitting(true);
    try {
      const payload = {
        wardId: Number(selectedWardId),
        roomId: Number(selectedRoomId),
        bedId: Number(selectedBedId),
        doctorId: Number(selectedDoctorId),
        insuranceCompany: insuranceCompany.trim(),
        policyNumber: policyNumber.trim(),
      };

      await admissionApi.assignBed(admission.id, payload);
      toast.success('Ward, Room, Bed, Doctor, and Insurance details assigned successfully!');
      window.dispatchEvent(new Event('hms_dashboard_refresh'));
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign bed');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600 font-bold">
              <BedDouble className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Assign Bed & Doctor</h3>
              <p className="text-xs text-slate-500">Allocate IPD Bed for Admission #{admission.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Patient Summary */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400 font-medium">Patient</span>
            <p className="font-bold text-slate-800 text-sm">{admission.patientName || `Patient #${admission.patientId}`}</p>
          </div>
          <div>
            <span className="text-slate-400 font-medium">Current Status</span>
            <p className="font-bold text-blue-600 uppercase">{admission.admissionStatus}</p>
          </div>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Select Doctor */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Attending Doctor *
            </label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              required
              disabled={loading}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="">-- Select Doctor --</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  Dr. {d.firstName} {d.lastName} ({d.specializationName || d.specialization?.specializationName || 'General'})
                </option>
              ))}
            </select>
          </div>

          {/* Select Ward */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Select Ward *
            </label>
            <select
              value={selectedWardId}
              onChange={(e) => setSelectedWardId(e.target.value)}
              required
              disabled={loading}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="">-- Select Ward --</option>
              {wards.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.wardName} ({w.wardType} - Floor {w.floor})
                </option>
              ))}
            </select>
          </div>

          {/* Select Room */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Select Room *
            </label>
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              required
              disabled={!selectedWardId || loadingRooms || availableRooms.length === 0}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="">
                {loadingRooms
                  ? 'Loading Rooms...'
                  : availableRooms.length === 0
                  ? 'No Rooms Available in this Ward'
                  : '-- Select Room --'}
              </option>
              {availableRooms.map((r) => (
                <option key={r.id} value={r.id}>
                  Room {r.roomNumber} ({r.roomType} - Available: {r.availableBeds ?? r.capacity})
                </option>
              ))}
            </select>
          </div>

          {/* Select Bed */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Select Available Bed *
            </label>
            <select
              value={selectedBedId}
              onChange={(e) => setSelectedBedId(e.target.value)}
              required
              disabled={!selectedRoomId || loadingBeds || availableBeds.length === 0}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="">
                {loadingBeds
                  ? 'Loading Beds...'
                  : !selectedRoomId
                  ? '-- Select Room First --'
                  : availableBeds.length === 0
                  ? 'No Available Beds in this Room'
                  : '-- Select Bed --'}
              </option>
              {availableBeds.map((b) => (
                <option key={b.id} value={b.id}>
                  Bed {b.bedNumber} ({b.status})
                </option>
              ))}
            </select>
          </div>

          {/* Insurance Optional Section */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <h4 className="font-bold text-slate-600 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Insurance Details (Optional)
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Insurance Provider</label>
                <input
                  type="text"
                  value={insuranceCompany}
                  onChange={(e) => setInsuranceCompany(e.target.value)}
                  placeholder="e.g. Star Health, HDFC Ergo"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Policy Number</label>
                <input
                  type="text"
                  value={policyNumber}
                  onChange={(e) => setPolicyNumber(e.target.value)}
                  placeholder="e.g. POL-9876543"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              {submitting ? 'Assigning Bed...' : 'Confirm Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
