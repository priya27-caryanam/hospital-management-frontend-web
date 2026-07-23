/**
 * Nurse Profile Page
 * Displays profile details of the logged in Nurse.
 */
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { User, Phone, Mail, Award, Clock, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import nurseApi from '../../api/nurseApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function NurseProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await nurseApi.getById(user.userId);
        setProfile(res.data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load nurse profile details');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  if (loading) {
    return <LoadingSpinner fullPage />;
  }

  if (!profile) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-slate-500 font-semibold">
        Profile data not found.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Nurse Profile</h1>
        <p className="text-sm text-slate-500">View your hospital credential and deployment shift information</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card Summary */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col items-center text-center space-y-4 md:col-span-1">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 text-3xl font-bold text-white shadow-lg shadow-blue-500/20">
            {profile.name?.charAt(0) || 'N'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">{profile.name}</h2>
            <p className="text-xs font-semibold text-blue-600 bg-blue-50 rounded-full px-2.5 py-0.5 mt-1 inline-block uppercase tracking-wider">
              {profile.shift} SHIFT
            </p>
          </div>
        </div>

        {/* Detailed profile credentials */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-2 space-y-6">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Deployment Information</h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100/50">
              <Award className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-400 font-medium">Department</p>
                <p className="text-sm font-semibold text-slate-800">{profile.departmentName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100/50">
              <Award className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-400 font-medium">Qualification</p>
                <p className="text-sm font-semibold text-slate-800">{profile.qualification || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100/50">
              <Clock className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-400 font-medium">Experience</p>
                <p className="text-sm font-semibold text-slate-800">{profile.experience ?? 0} Years</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100/50">
              <Phone className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-400 font-medium">Contact Number</p>
                <p className="text-sm font-semibold text-slate-800">{profile.mobile}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100/50 sm:col-span-2">
              <Mail className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-400 font-medium">Hospital Email Address</p>
                <p className="text-sm font-semibold text-slate-800">{profile.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
