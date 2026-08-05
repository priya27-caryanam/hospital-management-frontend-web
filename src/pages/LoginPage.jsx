/**
 * LoginPage Component — Updated for Single Username Field (Email or Mobile Number)
 *
 * Implements POST /api/auth/login with request schema:
 * { "username": "admin@hospital.com" | "9876543210", "password": "..." }
 *
 * Error handling:
 *   - 401: Invalid Email/Mobile Number or Password
 *   - 403: Access Denied
 *   - 500: Something went wrong. Please try again.
 */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Activity, User, Lock, Eye, EyeOff, ArrowLeft, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import LanguageSelector from '../components/common/LanguageSelector';

/** Role → dashboard path mapping */
const DASHBOARD_PATHS = {
  ADMIN: '/admin/dashboard',
  DOCTOR: '/doctor/dashboard',
  NURSE: '/nurse/dashboard',
  RECEPTIONIST: '/receptionist/dashboard',
  PHARMACIST: '/pharmacist/dashboard',
  LAB_TECHNICIAN: '/lab/dashboard',
  PATIENT: '/patient/dashboard',
};

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ username: '', password: '', rememberMe: false });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  /** Validate Email or 10-digit Mobile Number */
  const validate = () => {
    const errs = {};
    const val = form.username.trim();

    if (!val) {
      errs.username = t('auth.requiredEmail');
    }

    if (!form.password) {
      errs.password = t('auth.requiredPassword');
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /** Handle form submission */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const role = await login(form.username.trim(), form.password);
      toast.success(t('common.success'));
      navigate(DASHBOARD_PATHS[role] || '/home', { replace: true });
    } catch (err) {
      console.error('Login Error:', err);
      toast.error(t('auth.invalidCredentials'));
    } finally {
      setIsLoading(false);
    }
  };

  /** Update form fields */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4 py-12 relative">
      {/* Top right language switch */}
      <div className="absolute top-6 right-6">
        <LanguageSelector />
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header band */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm mb-4">
            <Activity className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">{t('auth.loginTitle')}</h1>
          <p className="text-blue-100 text-sm mt-1">{t('auth.loginSubtitle')}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5">
          {/* Email or Mobile Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t('auth.email')} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder={t('auth.email')}
                autoComplete="username"
                className={`w-full !pl-10 !pr-4 py-2.5 rounded-xl border text-sm outline-none transition
                  ${errors.username ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'}
                  focus:ring-2`}
              />
            </div>
            {errors.username && <p className="mt-1 text-xs text-red-500">{errors.username}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t('auth.password')} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder={t('auth.password')}
                autoComplete="current-password"
                className={`w-full !pl-10 !pr-11 py-2.5 rounded-xl border text-sm outline-none transition
                  ${errors.password ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'}
                  focus:ring-2`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-gray-600">
              <input
                type="checkbox"
                name="rememberMe"
                checked={form.rememberMe}
                onChange={handleChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              <span>Remember Me</span>
            </label>
            <Link to="/home" className="text-blue-600 font-semibold hover:underline">
              {t('auth.forgotPassword')}
            </Link>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold
                       text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed
                       transition cursor-pointer shadow-sm"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {t('common.loading')}
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                {t('auth.signIn')}
              </>
            )}
          </button>

          {/* Links */}
          <div className="pt-2 text-center space-y-2">
            <p className="text-sm text-gray-500">
              {t('auth.dontHaveAccount')}{' '}
              <Link to="/register" className="text-blue-600 font-semibold hover:underline">
                {t('auth.registerNow')}
              </Link>
            </p>
            <Link
              to="/home"
              className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {t('common.back')}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
