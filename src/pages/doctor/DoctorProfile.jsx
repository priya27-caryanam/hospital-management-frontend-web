/**
 * DoctorProfile — Read-only profile view for the logged-in doctor
 * Displays personal & professional details fetched via doctorApi.
 */
import { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  Building2,
  Stethoscope,
  GraduationCap,
  BriefcaseMedical,
  DollarSign,
  BadgeCheck,
  Shield,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import doctorApi from '../../api/doctorApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function DoctorProfile() {
  const { user } = useAuth();

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  /** Fetch doctor details on mount */
  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const res = await doctorApi.getById(user.userId);
        setDoctor(res.data);
      } catch (err) {
        console.error('Failed to load doctor profile:', err);
        toast.error('Could not load profile information.');
      } finally {
        setLoading(false);
      }
    };
    fetchDoctor();
  }, [user.userId]);

  if (loading) return <LoadingSpinner fullPage />;

  if (!doctor) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500">
        <User className="mb-3 h-12 w-12 opacity-40" />
        <p className="font-medium">Profile data unavailable.</p>
      </div>
    );
  }

  /* ── Profile field definitions ───────────────────────── */
  const personalFields = [
    { icon: User, label: 'Full Name', value: `${doctor.firstName ?? ''} ${doctor.lastName ?? ''}`.trim() },
    { icon: Mail, label: 'Email', value: doctor.email },
    { icon: Phone, label: 'Phone', value: doctor.mobile || doctor.phone },
    { icon: Shield, label: 'Gender', value: doctor.gender },
  ];

  const professionalFields = [
    { icon: Stethoscope, label: 'Specialization', value: doctor.specializationName || doctor.specialization },
    { icon: Building2, label: 'Department', value: doctor.departmentName || doctor.department },
    { icon: GraduationCap, label: 'Qualification', value: doctor.qualification },
    { icon: BriefcaseMedical, label: 'Experience', value: doctor.experience ? `${doctor.experience} years` : null },
    { icon: DollarSign, label: 'Consultation Fee', value: doctor.consultationFee ? `₹${doctor.consultationFee}` : null },
    { icon: BadgeCheck, label: 'License Number', value: doctor.licenseNumber },
  ];

  /** Reusable field row */
  const FieldRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs font-medium text-slate-400">{label}</p>
        <p className="text-sm font-semibold text-slate-800">{value || '—'}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* ── Page Header ───────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="mt-1 text-sm text-slate-500">Your professional information on file</p>
      </div>

      {/* ── Profile Header Card ───────────────────────────── */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white shadow-lg">
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/20 text-3xl font-bold backdrop-blur-sm">
            {doctor.firstName?.[0]}{doctor.lastName?.[0]}
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-bold">
              Dr. {doctor.firstName} {doctor.lastName}
            </h2>
            <p className="mt-1 text-blue-100">{doctor.specializationName || doctor.specialization || 'Specialist'}</p>
            <p className="text-sm text-blue-200">{doctor.email}</p>
          </div>
        </div>
      </div>

      {/* ── Details Grid ──────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Personal Information */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-slate-800">Personal Information</h3>
          <div className="divide-y divide-slate-100">
            {personalFields.map((f) => (
              <FieldRow key={f.label} {...f} />
            ))}
          </div>
        </div>

        {/* Professional Information */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-slate-800">Professional Information</h3>
          <div className="divide-y divide-slate-100">
            {professionalFields.map((f) => (
              <FieldRow key={f.label} {...f} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
