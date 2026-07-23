/**
 * Register Doctor Page
 * Professional registration form for new doctors matching POST /api/auth/register/doctor
 *
 * Swagger Request Schema:
 *   { firstName, lastName, email, mobile, password, gender, departmentId, qualification, experience, specialization, consultationFee, licenseNumber }
 *
 * Swagger Response Schema:
 *   { message, status, data: { id, firstName, lastName, email, mobile, departmentName, qualification, gender, experience, specialization, consultationFee, available, profileImage, role, status, licenseNumber } }
 */
import { useState, useEffect } from 'react';
import { Stethoscope, CheckCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import authApi from '../../api/authApi';
import departmentApi from '../../api/departmentApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const INITIAL_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  mobile: '',
  password: '',
  gender: '',
  departmentId: '',
  qualification: '',
  experience: '',
  specialization: '',
  consultationFee: '',
  licenseNumber: '',
};

export default function RegisterDoctor() {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [registeredDoctorResult, setRegisteredDoctorResult] = useState(null);

  /** Fetch departments for the dropdown */
  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await departmentApi.getAll();
        setDepartments(res.data || []);
      } catch (err) {
        toast.error('Failed to load departments');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDepts();
  }, []);

  /** Handle input changes */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /** Submit POST /api/auth/register/doctor */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (!formData.departmentId) {
      toast.error('Please select a department');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        departmentId: Number(formData.departmentId),
        experience: formData.experience ? Number(formData.experience) : 0,
        consultationFee: formData.consultationFee ? Number(formData.consultationFee) : 0,
      };

      const res = await authApi.registerDoctor(payload);
      // Response: { message, status, data: { ... } }
      setRegisteredDoctorResult(res.data);
      toast.success(res.data?.message || 'Doctor registered successfully');
      setFormData(INITIAL_FORM);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const inputClass =
    'w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all';

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* ─── Page Header ─── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Stethoscope className="h-7 w-7 text-blue-600" />
          Register Doctor
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Add a new doctor to the hospital system
        </p>
      </div>

      {/* ─── Form Card ─── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information Section */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
              Personal Information
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">First Name *</label>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required className={inputClass} placeholder="John" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Last Name *</label>
                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required className={inputClass} placeholder="Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required className={inputClass} placeholder="doctor@hospital.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mobile *</label>
                <input type="tel" name="mobile" value={formData.mobile} onChange={handleChange} required className={inputClass} placeholder="9876543210" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password *</label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} required className={inputClass} placeholder="••••••••" autoComplete="new-password" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Gender *</label>
                <select name="gender" value={formData.gender} onChange={handleChange} required className={inputClass}>
                  <option value="">Select Gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Professional Information Section */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider mb-4">
              Professional Information
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Department *</label>
                <select name="departmentId" value={formData.departmentId} onChange={handleChange} required className={inputClass}>
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.departmentName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Qualification *</label>
                <input type="text" name="qualification" value={formData.qualification} onChange={handleChange} required className={inputClass} placeholder="MBBS, MD" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Specialization *</label>
                <input type="text" name="specialization" value={formData.specialization} onChange={handleChange} required className={inputClass} placeholder="Cardiologist" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Experience (years)</label>
                <input type="number" name="experience" value={formData.experience} onChange={handleChange} min={0} className={inputClass} placeholder="5" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Consultation Fee (₹)</label>
                <input type="number" name="consultationFee" value={formData.consultationFee} onChange={handleChange} min={0} className={inputClass} placeholder="500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">License Number *</label>
                <input type="text" name="licenseNumber" value={formData.licenseNumber} onChange={handleChange} required className={inputClass} placeholder="MCI-12345" />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-blue-600 px-8 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Registering...' : 'Register Doctor'}
            </button>
          </div>
        </form>

        {/* ── Registered Doctor Success Result Modal / Card ── */}
        {registeredDoctorResult && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{registeredDoctorResult.message || 'Doctor Registered'}</h3>
                  <p className="text-xs text-slate-500">Status Code: {registeredDoctorResult.status}</p>
                </div>
              </div>
              <button
                onClick={() => setRegisteredDoctorResult(null)}
                className="rounded-full p-1 hover:bg-emerald-100 text-slate-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {registeredDoctorResult.data && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs bg-white p-4 rounded-xl border border-emerald-100">
                <div>
                  <span className="text-slate-400 font-medium">Doctor ID</span>
                  <p className="font-bold text-slate-800">#{registeredDoctorResult.data.id}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Name</span>
                  <p className="font-bold text-slate-800">Dr. {registeredDoctorResult.data.firstName} {registeredDoctorResult.data.lastName}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Email</span>
                  <p className="font-bold text-slate-800">{registeredDoctorResult.data.email}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Mobile</span>
                  <p className="font-bold text-slate-800">{registeredDoctorResult.data.mobile}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Department</span>
                  <p className="font-bold text-slate-800">{registeredDoctorResult.data.departmentName || '—'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Qualification</span>
                  <p className="font-bold text-slate-800">{registeredDoctorResult.data.qualification}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Specialization</span>
                  <p className="font-bold text-slate-800">{registeredDoctorResult.data.specialization}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Experience</span>
                  <p className="font-bold text-slate-800">{registeredDoctorResult.data.experience} Years</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Fee</span>
                  <p className="font-bold text-emerald-700">₹{registeredDoctorResult.data.consultationFee}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">License #</span>
                  <p className="font-bold text-slate-800">{registeredDoctorResult.data.licenseNumber}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Available</span>
                  <p className="font-bold text-slate-800">{registeredDoctorResult.data.available ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Role / Status</span>
                  <p className="font-bold text-slate-800">{registeredDoctorResult.data.role} ({registeredDoctorResult.data.status})</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
