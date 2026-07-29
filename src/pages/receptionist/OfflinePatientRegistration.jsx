/**
 * Dedicated Page: Offline Patient Registration
 * Used by Receptionist to register walk-in patients offline.
 * API Endpoint: POST /api/receptionists/register/patients
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { UserPlus, Info, CheckCircle2, ArrowRight, ShieldAlert } from 'lucide-react';
import receptionistApi from '../../api/receptionistApi';

export default function OfflinePatientRegistration() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [registeredPatient, setRegisteredPatient] = useState(null);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    mobile: '',
    email: '',
    dateOfBirth: '',
    gender: 'MALE',
    address: '',
    bloodGroup: 'O+',
    height: '',
    weight: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    emergencyContact: '',
    password: 'Patient@123',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.mobile || !form.dateOfBirth || !form.address) {
      toast.error('Please fill in all required fields (*)');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        email: form.email.trim() || `patient_${Date.now()}@hospital.com`,
        emergencyContact: form.emergencyContact.trim() || form.mobile,
      };

      const res = await receptionistApi.registerPatient(payload);
      const savedPatient = res.data?.data || res.data;

      if (savedPatient && (savedPatient.id || savedPatient.patientId)) {
        const pId = savedPatient.id || savedPatient.patientId;
        const currentOfflineIds = JSON.parse(localStorage.getItem('hms_offline_patient_ids') || '[]');
        if (!currentOfflineIds.includes(pId)) {
          currentOfflineIds.push(pId);
          localStorage.setItem('hms_offline_patient_ids', JSON.stringify(currentOfflineIds));
        }

        const todayRegisteredList = JSON.parse(localStorage.getItem('hms_today_registered_patients') || '[]');
        const todayStr = new Date().toISOString().split('T')[0];
        if (!todayRegisteredList.some((item) => item.id === pId)) {
          todayRegisteredList.push({ id: pId, date: todayStr, timestamp: Date.now() });
          localStorage.setItem('hms_today_registered_patients', JSON.stringify(todayRegisteredList));
        }
      }


      toast.success('Walk-in patient registered successfully!');
      setRegisteredPatient(savedPatient);
      window.dispatchEvent(new Event('hms_dashboard_refresh'));
    } catch (err) {

      console.error('Registration failed:', err);
      toast.error(err.response?.data?.message || 'Failed to register patient. Mobile or Email may already exist.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setRegisteredPatient(null);
    setForm({
      firstName: '',
      lastName: '',
      mobile: '',
      email: '',
      dateOfBirth: '',
      gender: 'MALE',
      address: '',
      bloodGroup: 'O+',
      height: '',
      weight: '',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      emergencyContact: '',
      password: 'Patient@123',
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/30">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Offline Patient Registration</h1>
            <p className="text-sm text-slate-500">Register new walk-in patients at the receptionist desk</p>
          </div>
        </div>
      </div>

      {/* Main Registration Form Card */}
      {!registeredPatient ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Personal Details */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-1">
                Personal Information
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    placeholder="Enter first name"
                    value={form.firstName}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Enter last name"
                    value={form.lastName}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Mobile Number *</label>
                  <input
                    type="tel"
                    name="mobile"
                    placeholder="10-digit mobile number"
                    value={form.mobile}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Email (Optional)</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="patient@example.com (Auto-generated if empty)"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Date of Birth *</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={form.dateOfBirth}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Gender *</label>
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-emerald-500 bg-white"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Vitals & Physical Details */}
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-1">
                Medical & Contact Details
              </h3>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Blood Group</label>
                  <select
                    name="bloodGroup"
                    value={form.bloodGroup}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-emerald-500 bg-white"
                  >
                    {['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-', 'AB-'].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Height (cm)</label>
                  <input
                    type="number"
                    name="height"
                    placeholder="e.g. 170"
                    value={form.height}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Weight (kg)</label>
                  <input
                    type="number"
                    name="weight"
                    placeholder="e.g. 68"
                    value={form.weight}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Full Address *</label>
                <textarea
                  name="address"
                  rows={2}
                  placeholder="Street, locality, area..."
                  value={form.address}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">City</label>
                  <input
                    type="text"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">State</label>
                  <input
                    type="text"
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Pincode</label>
                  <input
                    type="text"
                    name="pincode"
                    value={form.pincode}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-2.5 transition-colors text-xs disabled:opacity-50 shadow-md shadow-emerald-600/20 flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                {loading ? 'Registering Walk-in Patient...' : 'Register Patient'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Success Screen */
        <div className="rounded-2xl border border-emerald-200 bg-white p-8 shadow-sm text-center space-y-6 max-w-xl mx-auto">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 mx-auto">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-900">Walk-in Patient Saved</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              This patient will be saved as an offline (walk-in) patient. You can now book an appointment.
            </p>
          </div>

          {/* Registered Patient Details */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left text-xs space-y-2 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500">Patient ID:</span>
              <span className="font-bold text-slate-800">#{registeredPatient.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Full Name:</span>
              <span className="font-bold text-slate-800">{registeredPatient.firstName} {registeredPatient.lastName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Mobile:</span>
              <span className="font-bold text-slate-800">{registeredPatient.mobile}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Email:</span>
              <span className="font-bold text-slate-800">{registeredPatient.email}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={handleReset}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Register Another Walk-in Patient
            </button>

            <button
              onClick={() => navigate('/receptionist/book-walkin')}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-md shadow-blue-600/20"
            >
              Book Walk-in Appointment
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
