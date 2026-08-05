import { X, User, Stethoscope, Building2, BedDouble, Calendar, Clock, FileText, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function AdmissionDetailsModal({ isOpen, onClose, admission }) {
  if (!isOpen || !admission) return null;

  const STATUS_CLASSES = {
    REQUESTED: 'bg-amber-100 text-amber-800 border-amber-200',
    BED_ASSIGNED: 'bg-purple-100 text-purple-800 border-purple-200',
    ADMITTED: 'bg-blue-100 text-blue-800 border-blue-200',
    DISCHARGED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  };

  const isAdmittedOrDischarged = admission.admissionStatus === 'ADMITTED' || admission.admissionStatus === 'DISCHARGED';
  const isDischarged = admission.admissionStatus === 'DISCHARGED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 font-bold">
              <BedDouble className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">
                IPD Admission File #{admission.id}
              </h3>
              <p className="text-xs text-slate-500">
                Registered at: {admission.createdAt ? new Date(admission.createdAt).toLocaleString('en-IN') : '—'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status & Timeline Header */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current IPD Status</span>
            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${STATUS_CLASSES[admission.admissionStatus]}`}>
              {admission.admissionStatus}
            </span>
          </div>

          {/* Simple Timeline Progress Bar */}
          <div className="grid grid-cols-4 gap-2 pt-2 text-[11px] font-semibold text-center">
            <div className={`p-1.5 rounded-lg border ${admission.admissionStatus ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-400'}`}>
              1. Requested
            </div>
            <div className={`p-1.5 rounded-lg border ${admission.bedId || admission.admissionStatus === 'BED_ASSIGNED' || isAdmittedOrDischarged ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-slate-100 text-slate-400'}`}>
              2. Bed Assigned
            </div>
            <div className={`p-1.5 rounded-lg border ${isAdmittedOrDischarged ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-400'}`}>
              3. Admitted
            </div>
            <div className={`p-1.5 rounded-lg border ${isDischarged ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-400'}`}>
              4. Discharged
            </div>
          </div>
        </div>

        {/* Grid Info Sections */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Patient Details */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 shadow-xs">
            <h4 className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <User className="h-4 w-4 text-blue-600" /> Patient Details
            </h4>
            <p><span className="text-slate-400">Name:</span> <strong className="text-slate-900">{admission.patientName || '—'}</strong></p>
            <p><span className="text-slate-400">Patient ID:</span> <strong className="text-blue-600">#{admission.patientId}</strong></p>
            <p><span className="text-slate-400">Mobile:</span> {admission.patientMobile || '—'}</p>
            <p><span className="text-slate-400">Email:</span> {admission.patientEmail || '—'}</p>
          </div>

          {/* Attending Doctor */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 shadow-xs">
            <h4 className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Stethoscope className="h-4 w-4 text-green-600" /> Attending Doctor
            </h4>
            {admission.doctorId ? (
              <>
                <p><span className="text-slate-400">Doctor:</span> <strong className="text-slate-900">Dr. {admission.doctorName}</strong></p>
                <p><span className="text-slate-400">Specialization:</span> <span className="font-semibold text-slate-700">{admission.doctorSpecialization || 'General'}</span></p>
                <p><span className="text-slate-400">Doctor ID:</span> #{admission.doctorId}</p>
              </>
            ) : (
              <p className="text-slate-400 italic py-2">No attending doctor assigned yet.</p>
            )}
          </div>

          {/* Bed Allocation */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 shadow-xs">
            <h4 className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Building2 className="h-4 w-4 text-purple-600" /> Ward & Bed Location
            </h4>
            {admission.bedId ? (
              <>
                <p><span className="text-slate-400">Ward:</span> <strong className="text-slate-900">{admission.wardName}</strong> ({admission.wardType})</p>
                <p><span className="text-slate-400">Room:</span> <strong className="text-slate-900">Room {admission.roomNumber}</strong> ({admission.roomType})</p>
                <p><span className="text-slate-400">Bed:</span> <span className="font-bold text-purple-600">Bed {admission.bedNumber}</span> ({admission.bedStatus})</p>
              </>
            ) : (
              <p className="text-slate-400 italic py-2">No bed allocated yet.</p>
            )}
          </div>

          {/* Insurance Info */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 shadow-xs">
            <h4 className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" /> Insurance Verification
            </h4>
            {admission.insuranceCompany ? (
              <>
                <p><span className="text-slate-400">Insurance Provider:</span> <strong className="text-slate-900">{admission.insuranceCompany}</strong></p>
                <p><span className="text-slate-400">Policy Number:</span> <span className="font-mono font-bold text-emerald-700">{admission.policyNumber || '—'}</span></p>
              </>
            ) : (
              <p className="text-slate-400 italic py-2">Self Pay / No Insurance Specified.</p>
            )}
          </div>
        </div>

        {/* Timeline Dates */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 text-xs shadow-xs">
          <h4 className="font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <Calendar className="h-4 w-4 text-blue-600" /> Key IPD Timeline Dates
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div>
              <p className="text-slate-400">Admission Date:</p>
              <p className="font-bold text-slate-800">
                {admission.admissionDate ? new Date(admission.admissionDate).toLocaleString('en-IN') : 'Not Admitted Yet'}
              </p>
            </div>
            <div>
              <p className="text-slate-400">Expected Discharge:</p>
              <p className="font-bold text-slate-800">
                {admission.expectedDischargeDate ? new Date(admission.expectedDischargeDate).toLocaleDateString('en-IN') : '—'}
              </p>
            </div>
            <div>
              <p className="text-slate-400">Actual Discharge:</p>
              <p className="font-bold text-slate-800">
                {admission.actualDischargeDate ? new Date(admission.actualDischargeDate).toLocaleString('en-IN') : 'Active In-Patient'}
              </p>
            </div>
          </div>
        </div>

        {/* Reason & Notes */}
        <div className="space-y-3 text-xs">
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
            <h5 className="font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-slate-500" /> Admission Reason
            </h5>
            <p className="text-slate-800">{admission.reason || 'No specific reason entered.'}</p>
          </div>
          {admission.notes && (
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
              <h5 className="font-bold text-slate-700 uppercase tracking-wider mb-1">Additional Notes</h5>
              <p className="text-slate-600 italic">{admission.notes}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-slate-100 pt-4">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold px-6 py-2 text-xs shadow-sm transition-colors"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
