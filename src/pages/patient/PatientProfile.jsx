/**
 * Patient Profile Page
 *
 * Displays patient credentials using data from GET /api/patients/{id}.
 *
 * Backend returns UserResponse DTO:
 * { id, firstName, lastName, email, mobile, role, status, additionalDetails }
 *
 * NOTE: Extended patient fields (bloodGroup, height, weight, dateOfBirth,
 * address, city, state, pincode, emergencyContact) are stored in the
 * PatientRegisterRequest at registration but the GET endpoint returns
 * the standard UserResponse. Only the fields below are available.
 */
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { User, Phone, Mail, ShieldCheck, BadgeInfo } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import patientApi from '../../api/patientApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function PatientProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await patientApi.getById(user.userId);
        // response.data is UserResponse { id, firstName, lastName, email, mobile, role, status, additionalDetails }
        setProfile(res.data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load patient profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  if (loading) return <LoadingSpinner fullPage />;

  if (!profile) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-slate-500 font-semibold">
        Profile data could not be retrieved.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="text-sm text-slate-500">Your registered account information</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Avatar card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col items-center text-center space-y-4 md:col-span-1">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 text-3xl font-bold text-white shadow-lg shadow-blue-500/20">
            {profile.firstName?.charAt(0) || 'P'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {profile.firstName} {profile.lastName}
            </h2>
            <p className="text-xs text-slate-400">Patient ID: #{profile.id}</p>
          </div>
          {/* Status badge */}
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase ${
              profile.status === 'ACTIVE'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {profile.status || 'ACTIVE'}
          </span>
        </div>

        {/* Details card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-2 space-y-6">
          {/* Contact information */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4">
              Contact Information
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
                  <Mail className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-medium uppercase">Email Address</p>
                  <p className="text-sm font-semibold text-slate-800">{profile.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
                  <Phone className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-medium uppercase">Mobile Number</p>
                  <p className="text-sm font-semibold text-slate-800">{profile.mobile}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Account information */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4">
              Account Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50">
                  <User className="h-4 w-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-medium uppercase">Full Name</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {profile.firstName} {profile.lastName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50">
                  <ShieldCheck className="h-4 w-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-medium uppercase">Role</p>
                  <p className="text-sm font-semibold text-slate-800">{profile.role || 'PATIENT'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional details (qualification, shift, etc. — varies by user type) */}
          {profile.additionalDetails && (
            <div>
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 mb-4">
                Additional Details
              </h3>
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 mt-0.5">
                  <BadgeInfo className="h-4 w-4 text-slate-500" />
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{profile.additionalDetails}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
