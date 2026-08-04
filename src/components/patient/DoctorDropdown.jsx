import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, UserX } from 'lucide-react';

export const getStatusBadgeConfig = (status) => {
  let s = (status || '').toUpperCase();
  if (s === 'ACTIVE') s = 'AVAILABLE';
  if (s === 'INACTIVE') s = 'OFF_DUTY';

  switch (s) {
    case 'AVAILABLE':
      return {
        label: 'Available',
        dotColor: 'bg-emerald-500',
        badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        isSelectable: true,
        emoji: '🟢',
      };
    case 'BUSY':
      return {
        label: 'Busy',
        dotColor: 'bg-amber-500',
        badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
        isSelectable: true,
        emoji: '🟡',
      };
    case 'ON_DUTY':
      return {
        label: 'On Duty',
        dotColor: 'bg-blue-500',
        badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
        isSelectable: true,
        emoji: '🔵',
      };
    case 'UNAVAILABLE':
      return {
        label: 'Unavailable',
        dotColor: 'bg-rose-500',
        badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
        isSelectable: false,
        emoji: '🔴',
      };
    case 'EMERGENCY_LEAVE':
      return {
        label: 'Emergency Leave',
        dotColor: 'bg-orange-500',
        badgeBg: 'bg-orange-50 text-orange-700 border-orange-200',
        isSelectable: false,
        emoji: '🟠',
      };
    case 'OFF_DUTY':
      return {
        label: 'Off Duty',
        dotColor: 'bg-slate-500',
        badgeBg: 'bg-slate-50 text-slate-600 border-slate-200',
        isSelectable: false,
        emoji: '⚫',
      };
    default:
      return {
        label: 'Available',
        dotColor: 'bg-emerald-500',
        badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        isSelectable: true,
        emoji: '🟢',
      };
  }
};

export default function DoctorDropdown({
  doctors = [],
  selectedDocId = '',
  onSelectDoctor,
  disabled = false,
  loadingDocs = false,
  placeholder = 'Select Doctor',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedDoctor = doctors.find((doc) => String(doc.id) === String(selectedDocId));

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (doctor) => {
    const statusConfig = getStatusBadgeConfig(doctor.availabilityStatus);
    if (!statusConfig.isSelectable) return;

    onSelectDoctor(doctor);
    setIsOpen(false);
  };

  const selectedBadge = selectedDoctor ? getStatusBadgeConfig(selectedDoctor.availabilityStatus) : null;

  return (
    <div className="relative w-full text-left" ref={containerRef}>
      {/* Dropdown Button Trigger */}
      <button
        type="button"
        disabled={disabled || loadingDocs}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2 rounded-xl border border-slate-200 p-2.5 text-sm bg-white outline-none transition-all ${
          disabled || loadingDocs
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200'
            : isOpen
            ? 'border-blue-500 ring-2 ring-blue-100'
            : 'hover:border-slate-300 cursor-pointer'
        }`}
      >
        {loadingDocs ? (
          <div className="flex items-center gap-2 w-full animate-pulse">
            <div className="h-4 w-32 bg-slate-200 rounded"></div>
            <div className="h-4 w-16 bg-slate-200 rounded-full ml-auto"></div>
          </div>
        ) : selectedDoctor ? (
          <div className="flex items-center justify-between w-full min-w-0 pr-1">
            <span className="font-semibold text-slate-800 truncate">
              {selectedDoctor.name || `Dr. ${selectedDoctor.firstName} ${selectedDoctor.lastName}`}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${selectedBadge.badgeBg}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${selectedBadge.dotColor}`} />
              {selectedBadge.label}
            </span>
          </div>
        ) : (
          <span className="text-slate-400 truncate">{placeholder}</span>
        )}

        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-blue-600' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu Popup */}
      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1.5 w-full rounded-xl border border-slate-200 bg-white shadow-xl max-h-64 overflow-y-auto p-1 animate-in fade-in zoom-in-95 duration-100">
          {loadingDocs ? (
            /* Skeleton Loaders inside Dropdown */
            <div className="space-y-1.5 p-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 animate-pulse">
                  <div className="h-4 w-36 bg-slate-200 rounded"></div>
                  <div className="h-4 w-20 bg-slate-200 rounded-full"></div>
                </div>
              ))}
            </div>
          ) : doctors.length === 0 ? (
            <div className="p-3 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <UserX className="h-4 w-4" />
              <span>No doctors available</span>
            </div>
          ) : (
            doctors.map((doctor) => {
              const isSelected = String(doctor.id) === String(selectedDocId);
              const statusConfig = getStatusBadgeConfig(doctor.availabilityStatus);
              const isSelectable = statusConfig.isSelectable;

              return (
                <div
                  key={doctor.id}
                  onClick={() => isSelectable && handleSelect(doctor)}
                  className={`flex items-center justify-between p-2.5 rounded-lg text-sm transition-colors ${
                    !isSelectable
                      ? 'opacity-50 cursor-not-allowed bg-slate-50/60 select-none'
                      : isSelected
                      ? 'bg-blue-50 text-blue-900 font-semibold cursor-pointer'
                      : 'hover:bg-slate-50 text-slate-700 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="truncate">
                      {doctor.name || `Dr. ${doctor.firstName} ${doctor.lastName}`}
                    </span>
                    {isSelected && <Check className="h-4 w-4 text-blue-600 shrink-0" />}
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border shrink-0 ${statusConfig.badgeBg}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dotColor}`} />
                    {statusConfig.label}
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
