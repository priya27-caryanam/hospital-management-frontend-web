/**
 * RegisterPage — Patient self-registration
 * Collects all fields required by PatientRegisterRequest DTO,
 * validates on submit, and calls authApi.registerPatient().
 */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Activity,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  MapPin,
  Heart,
  Ruler,
  Weight,
  ArrowLeft,
  UserPlus,
  Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';
import authApi from '../api/authApi';

/** Dropdown options */
const GENDERS = ['MALE', 'FEMALE', 'OTHER'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

/** Initial form state matching PatientRegisterRequest */
const INITIAL_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  mobile: '',
  password: '',
  gender: '',
  dateOfBirth: '',
  bloodGroup: '',
  height: '',
  weight: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  emergencyContact: '',
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  /** Update a single field and clear its error */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  /** Validate all required fields */
  const validate = () => {
    const errs = {};

    if (!form.firstName.trim()) errs.firstName = 'First name is required';
    if (!form.lastName.trim()) errs.lastName = 'Last name is required';

    if (!form.email.trim()) {
      errs.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Enter a valid email address';
    }

    if (!form.mobile.trim()) {
      errs.mobile = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(form.mobile)) {
      errs.mobile = 'Enter a valid 10-digit mobile number';
    }

    if (!form.password) {
      errs.password = 'Password is required';
    } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(form.password)) {
      errs.password = 'Min 8 chars with uppercase, lowercase, number & special character';
    }

    if (!form.gender) errs.gender = 'Gender is required';
    if (!form.dateOfBirth) errs.dateOfBirth = 'Date of birth is required';
    if (!form.bloodGroup) errs.bloodGroup = 'Blood group is required';

    if (!form.address.trim()) {
      errs.address = 'Address is required';
    } else if (form.address.trim().length < 5 || form.address.trim().length > 255) {
      errs.address = 'Address must be between 5 and 255 characters';
    }

    if (!form.city.trim()) errs.city = 'City is required';
    if (!form.state.trim()) errs.state = 'State is required';
    
    if (!form.pincode.trim()) {
      errs.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(form.pincode.trim())) {
      errs.pincode = 'Enter a valid 6-digit pincode';
    }

    if (!form.emergencyContact.trim()) {
      errs.emergencyContact = 'Emergency contact is required';
    } else if (!/^\d{10}$/.test(form.emergencyContact.trim())) {
      errs.emergencyContact = 'Enter a valid 10-digit number';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /** Submit registration */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      // Build payload — convert numeric strings to numbers
      const payload = {
        ...form,
        height: form.height ? parseFloat(form.height) : null,
        weight: form.weight ? parseFloat(form.weight) : null,
      };

      const res = await authApi.registerPatient(payload);
      // Backend returns ApiResponse<PatientResponse> { message, status, data }
      const successMsg = res.data?.message || 'Registration successful! Please login.';
      toast.success(successMsg);
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Register error:', err.response?.data);
      const data = err.response?.data;
      // ApiResponse error may include validation errors map
      if (data?.errors && typeof data.errors === 'object') {
        setErrors((prev) => ({ ...prev, ...data.errors }));
      }
      let message = data?.message || data?.error;
      if (!message && data?.errors && typeof data.errors === 'object') {
        message = Object.values(data.errors).join(', ');
      }
      if (!message && typeof data === 'string') message = data;
      toast.error(message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /* ── Reusable input helpers ── */
  const inputClass = (field) =>
    `w-full !pl-10 !pr-4 py-2.5 rounded-xl border text-sm outline-none transition
     ${errors[field] ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'}
     focus:ring-2`;

  const selectClass = (field) =>
    `w-full !pl-10 !pr-4 py-2.5 rounded-xl border text-sm outline-none transition appearance-none bg-white
     ${errors[field] ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'}
     focus:ring-2`;

  const ErrorMsg = ({ field }) =>
    errors[field] ? <p className="mt-1 text-xs text-red-500">{errors[field]}</p> : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4 py-10">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* ── Header ── */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm mb-4">
            <Activity className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create Your Account</h1>
          <p className="text-blue-100 text-sm mt-1">Register as a patient to get started</p>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleSubmit} className="px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">First Name *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input name="firstName" value={form.firstName} onChange={handleChange}
                       placeholder="John" className={inputClass('firstName')} />
              </div>
              <ErrorMsg field="firstName" />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Last Name *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input name="lastName" value={form.lastName} onChange={handleChange}
                       placeholder="Doe" className={inputClass('lastName')} />
              </div>
              <ErrorMsg field="lastName" />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="email" name="email" value={form.email} onChange={handleChange}
                       placeholder="you@example.com" className={inputClass('email')} />
              </div>
              <ErrorMsg field="email" />
            </div>

            {/* Mobile */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mobile *</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input name="mobile" value={form.mobile} onChange={handleChange}
                       placeholder="9876543210" className={inputClass('mobile')} />
              </div>
              <ErrorMsg field="mobile" />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password *</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type={showPassword ? 'text' : 'password'} name="password" value={form.password}
                       onChange={handleChange} placeholder="Min. 6 characters"
                       className={`w-full !pl-10 !pr-11 py-2.5 rounded-xl border text-sm outline-none transition
                         ${errors.password ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'}
                         focus:ring-2`} />
                <button type="button" tabIndex={-1}
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <ErrorMsg field="password" />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select name="gender" value={form.gender} onChange={handleChange} className={selectClass('gender')}>
                  <option value="">Select Gender</option>
                  {GENDERS.map((g) => (
                    <option key={g} value={g}>
                      {g.charAt(0) + g.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>
              <ErrorMsg field="gender" />
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date of Birth *</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange}
                       className={inputClass('dateOfBirth')} />
              </div>
              <ErrorMsg field="dateOfBirth" />
            </div>

            {/* Blood Group */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Blood Group *</label>
              <div className="relative">
                <Heart className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select name="bloodGroup" value={form.bloodGroup} onChange={handleChange}
                        className={selectClass('bloodGroup')}>
                  <option value="">Select Blood Group</option>
                  {BLOOD_GROUPS.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              </div>
              <ErrorMsg field="bloodGroup" />
            </div>

            {/* Height */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Height (cm)</label>
              <div className="relative">
                <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="number" name="height" value={form.height} onChange={handleChange}
                       placeholder="170" className={inputClass('height')} />
              </div>
            </div>

            {/* Weight */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Weight (kg)</label>
              <div className="relative">
                <Weight className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="number" name="weight" value={form.weight} onChange={handleChange}
                       placeholder="70" className={inputClass('weight')} />
              </div>
            </div>

            {/* Address — full width */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Address *</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-gray-400 pointer-events-none z-10" />
                <textarea name="address" value={form.address} onChange={handleChange} rows={2}
                          placeholder="Street address"
                          className={`w-full !pl-10 !pr-4 py-2.5 rounded-xl border text-sm outline-none
                                     focus:ring-2 transition resize-none
                                     ${errors.address ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'}`} />
              </div>
              <ErrorMsg field="address" />
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">City *</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input name="city" value={form.city} onChange={handleChange}
                       placeholder="Mumbai" className={inputClass('city')} />
              </div>
              <ErrorMsg field="city" />
            </div>

            {/* State */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">State *</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input name="state" value={form.state} onChange={handleChange}
                       placeholder="Maharashtra" className={inputClass('state')} />
              </div>
              <ErrorMsg field="state" />
            </div>

            {/* Pincode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Pincode *</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input name="pincode" value={form.pincode} onChange={handleChange}
                       placeholder="400001" className={inputClass('pincode')} />
              </div>
              <ErrorMsg field="pincode" />
            </div>

            {/* Emergency Contact */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Emergency Contact *</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input name="emergencyContact" value={form.emergencyContact} onChange={handleChange}
                       placeholder="9876543210" className={inputClass('emergencyContact')} />
              </div>
              <ErrorMsg field="emergencyContact" />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="mt-8 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold
                       text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed
                       transition cursor-pointer shadow-sm"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Creating Account…
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                Create Account
              </>
            )}
          </button>

          {/* Links */}
          <div className="mt-5 text-center space-y-2">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 font-semibold hover:underline">
                Login
              </Link>
            </p>
            <Link
              to="/home"
              className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Home
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
