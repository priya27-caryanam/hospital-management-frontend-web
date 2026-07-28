/**
 * Register Doctor & Doctor Directory Page (Admin Panel)
 * Professional registration form and doctor directory matching OpenAPI spec:
 *   - POST /api/auth/register/doctor — Register new doctor
 *   - GET /api/doctors/department/{departmentId} — List doctors by department
 *   - GET /api/doctors/{id} — View doctor profile details
 *
 * OpenAPI Request Schema (DoctorRegistrationRequest):
 *   { firstName, lastName, email, mobile, password, gender, departmentId, qualification, experience, specializationId, consultationFee, licenseNumber }
 *
 * OpenAPI Response Schema (ApiResponseDoctorResponse -> DoctorResponse):
 *   { message, status, data: { id, firstName, lastName, email, mobile, departmentId, departmentName, qualification, gender, experience, specializationId, specializationName, consultationFee, available, profileImage, role, status, licenseNumber } }
 */
import { useState, useEffect, useMemo } from 'react';
import { Stethoscope, CheckCircle, X, Eye, EyeOff, Building2, Award, GraduationCap, Phone, Mail, Wallet, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import authApi from '../../api/authApi';
import departmentApi from '../../api/departmentApi';
import specializationApi from '../../api/specializationApi';
import doctorApi from '../../api/doctorApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import DataTable from '../../components/common/DataTable';
import SearchBar from '../../components/common/SearchBar';

const INITIAL_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  mobile: '',
  password: '',
  gender: 'MALE',
  departmentId: '',
  qualification: '',
  experience: '',
  specializationId: '',
  consultationFee: '',
  licenseNumber: '',
};

export default function RegisterDoctor() {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [departments, setDepartments] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [registeredDoctorResult, setRegisteredDoctorResult] = useState(null);

  // Doctors directory state
  const [doctorsList, setDoctorsList] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // View details modal state
  const [viewingDoctor, setViewingDoctor] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  /** Fetch all doctors across departments using GET /api/doctors/department/{deptId} */
  const fetchAllDoctors = async (deptList) => {
    if (!deptList || deptList.length === 0) return;
    setLoadingDoctors(true);
    try {
      const promises = deptList.map((d) =>
        doctorApi.getByDepartment(d.id).catch(() => ({ data: [] }))
      );
      const results = await Promise.all(promises);
      const map = new Map();
      results.forEach((res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        list.forEach((doc) => {
          if (doc && doc.id) {
            map.set(doc.id, doc);
          }
        });
      });
      setDoctorsList(Array.from(map.values()));
    } catch (err) {
      console.error('Failed to load doctors directory:', err);
    } finally {
      setLoadingDoctors(false);
    }
  };

  /** Fetch departments and all specializations for dropdowns and directory */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deptRes, specRes] = await Promise.all([
          departmentApi.getAll(),
          specializationApi.getAll(),
        ]);
        const deptData = deptRes.data || [];
        setDepartments(deptData);
        setSpecializations(specRes.data || []);

        // Load doctor listings for all departments
        await fetchAllDoctors(deptData);
      } catch (err) {
        toast.error('Failed to load department or specialization metadata');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  /** Filter specializations based on selected department */
  const availableSpecializations = formData.departmentId
    ? specializations.filter((s) => String(s.departmentId) === String(formData.departmentId))
    : specializations;

  /** Filter doctors for directory table */
  const filteredDoctors = useMemo(() => {
    if (!searchQuery.trim()) return doctorsList;
    const q = searchQuery.toLowerCase().trim();
    return doctorsList.filter((doc) => {
      const name = `Dr. ${doc.firstName || ''} ${doc.lastName || ''} ${doc.name || ''}`.toLowerCase();
      const email = (doc.email || '').toLowerCase();
      const mobile = (doc.mobile || '').toLowerCase();
      const dept = (doc.departmentName || doc.department || '').toLowerCase();
      const spec = (doc.specializationName || doc.specialization || '').toLowerCase();
      const license = (doc.licenseNumber || '').toLowerCase();
      const idStr = String(doc.id || '');
      return name.includes(q) || email.includes(q) || mobile.includes(q) || dept.includes(q) || spec.includes(q) || license.includes(q) || idStr.includes(q);
    });
  }, [doctorsList, searchQuery]);

  /** Fetch doctor details for View Details Modal (GET /api/doctors/{id}) */
  const handleViewDetails = async (id) => {
    setLoadingDetails(true);
    setViewingDoctor(null);
    try {
      const res = await doctorApi.getById(id);
      setViewingDoctor(res.data);
    } catch (err) {
      toast.error('Failed to fetch doctor profile details');
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  /** Handle input changes */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'departmentId') {
        updated.specializationId = '';
      }
      return updated;
    });
  };

  /** Client-side validation enforcing exact OpenAPI constraints */
  const validateForm = () => {
    const nameRegex = /^[A-Za-z ]+$/;
    if (!nameRegex.test(formData.firstName.trim()) || formData.firstName.trim().length < 2 || formData.firstName.trim().length > 50) {
      toast.error('First Name must contain only letters and spaces (2-50 characters)');
      return false;
    }
    if (!nameRegex.test(formData.lastName.trim()) || formData.lastName.trim().length < 2 || formData.lastName.trim().length > 50) {
      toast.error('Last Name must contain only letters and spaces (2-50 characters)');
      return false;
    }
    if (!formData.email.trim() || formData.email.length > 100) {
      toast.error('Email is required and must not exceed 100 characters');
      return false;
    }
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(formData.mobile.trim())) {
      toast.error('Mobile number must be a valid 10-digit number starting with 6-9');
      return false;
    }
    const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,20}$/;
    if (!passRegex.test(formData.password)) {
      toast.error('Password must be 8-20 characters with uppercase, lowercase, digit, and special character (@$!%*?&#)');
      return false;
    }
    if (!formData.departmentId) {
      toast.error('Please select a Department');
      return false;
    }
    if (!formData.specializationId) {
      toast.error('Please select a Specialization');
      return false;
    }
    if (!formData.qualification.trim() || formData.qualification.trim().length < 2 || formData.qualification.trim().length > 100) {
      toast.error('Qualification must be between 2 and 100 characters');
      return false;
    }
    const exp = Number(formData.experience);
    if (isNaN(exp) || exp < 0 || exp > 60) {
      toast.error('Experience must be between 0 and 60 years');
      return false;
    }
    const fee = Number(formData.consultationFee);
    if (isNaN(fee) || fee < 0) {
      toast.error('Consultation Fee must be a non-negative number');
      return false;
    }
    const licenseRegex = /^[A-Za-z0-9-]+$/;
    if (!licenseRegex.test(formData.licenseNumber.trim()) || formData.licenseNumber.trim().length < 5 || formData.licenseNumber.trim().length > 30) {
      toast.error('License Number must be 5-30 alphanumeric characters (hyphens allowed)');
      return false;
    }
    return true;
  };

  /** Submit POST /api/auth/register/doctor */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        mobile: formData.mobile.trim(),
        password: formData.password,
        gender: formData.gender,
        departmentId: Number(formData.departmentId),
        qualification: formData.qualification.trim(),
        experience: Number(formData.experience),
        specializationId: Number(formData.specializationId),
        consultationFee: Number(formData.consultationFee),
        licenseNumber: formData.licenseNumber.trim(),
      };

      const res = await authApi.registerDoctor(payload);
      setRegisteredDoctorResult(res.data);
      toast.success(res.data?.message || 'Doctor registered successfully');
      setFormData(INITIAL_FORM);

      // Refresh doctor directory
      if (departments.length > 0) {
        fetchAllDoctors(departments);
      }
    } catch (err) {
      const errData = err.response?.data;
      const msg = errData?.message || errData?.error || 'Registration failed';
      toast.error(msg);
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner fullPage />;

  const inputClass =
    'w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all bg-white';

  /** DataTable column definitions displaying all Doctor response fields */
  const columns = [
    { header: 'ID', accessor: 'id', render: (row) => <span className="font-mono font-bold text-slate-800">#{row.id}</span> },
    {
      header: 'Doctor Name',
      render: (row) => (
        <span className="font-bold text-slate-900">
          Dr. {row.firstName ? `${row.firstName} ${row.lastName}` : row.name || 'Doctor'}
        </span>
      ),
    },
    { header: 'Email', accessor: 'email' },
    { header: 'Mobile', accessor: 'mobile' },
    {
      header: 'Department',
      render: (row) => (
        <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700">
          {row.departmentName || row.department || '—'}
        </span>
      ),
    },
    {
      header: 'Specialization',
      render: (row) => (
        <span className="text-xs font-semibold text-slate-700">
          {row.specializationName || row.specialization || '—'}
        </span>
      ),
    },
    {
      header: 'Fee',
      render: (row) => (
        <span className="font-bold text-emerald-700">
          ₹{row.consultationFee ?? '—'}
        </span>
      ),
    },
    { header: 'License #', accessor: 'licenseNumber', render: (row) => <span className="text-xs font-mono text-slate-600">{row.licenseNumber || '—'}</span> },
    {
      header: 'Actions',
      render: (row) => (
        <button
          onClick={() => handleViewDetails(row.id)}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors"
          title="View Doctor Details"
        >
          <Eye className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Stethoscope className="h-7 w-7 text-blue-600" />
          Doctor Management & Registration
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Register new medical practitioners and view registered doctors directory
        </p>
      </div>

      {/* Form Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 space-y-6">
        <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Register New Doctor</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              Personal Information
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className={inputClass}
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className={inputClass}
                  placeholder="Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className={inputClass}
                  placeholder="doctor@hospital.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mobile *</label>
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  maxLength={10}
                  onInput={(e) => { e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10); }}
                  required
                  className={inputClass}
                  placeholder="9876543210"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className={`${inputClass} !pr-10`}
                    placeholder="Password@123"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  8-20 characters with uppercase, lowercase, number and special character (@$!%*?&#)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Gender *</label>
                <select name="gender" value={formData.gender} onChange={handleChange} required className={inputClass}>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Professional Information */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              Professional Information
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Department *</label>
                <select name="departmentId" value={formData.departmentId} onChange={handleChange} required className={inputClass}>
                  <option value="">-- Select Department --</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.departmentName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Specialization *</label>
                <select name="specializationId" value={formData.specializationId} onChange={handleChange} required className={inputClass}>
                  <option value="">-- Select Specialization --</option>
                  {availableSpecializations.map((spec) => (
                    <option key={spec.id} value={spec.id}>
                      {spec.specializationName} ({spec.departmentName || 'Dept'})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Qualification *</label>
                <input type="text" name="qualification" value={formData.qualification} onChange={handleChange} required className={inputClass} placeholder="MBBS, MD" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Experience (Years) *</label>
                <input type="number" name="experience" value={formData.experience} onChange={handleChange} min={0} max={60} required className={inputClass} placeholder="5" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Consultation Fee (₹) *</label>
                <input type="number" name="consultationFee" value={formData.consultationFee} onChange={handleChange} min={0} step="1" required className={inputClass} placeholder="500" />
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

        {/* Success Result Card */}
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
                  <span className="text-slate-400 font-medium">Specialization</span>
                  <p className="font-bold text-slate-800">{registeredDoctorResult.data.specializationName || '—'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Qualification</span>
                  <p className="font-bold text-slate-800">{registeredDoctorResult.data.qualification}</p>
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
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Registered Doctors Directory Table (Fix for BUG-DASH-006) ─── */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-blue-600" />
              Registered Doctors Directory
            </h2>
            <p className="text-xs text-slate-500">
              View and manage all registered medical practitioners in the hospital system
            </p>
          </div>
          <SearchBar
            placeholder="Search doctors by name, email, mobile, department, or license..."
            onSearch={(val) => {
              setSearchQuery(val);
              setCurrentPage(1);
            }}
            className="max-w-md"
          />
        </div>

        <DataTable
          columns={columns}
          data={filteredDoctors}
          loading={loadingDoctors}
          emptyMessage="No registered doctors found."
          pageSize={10}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* ─── View Details Modal (GET /api/doctors/{id}) ─── */}
      {(viewingDoctor || loadingDetails) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-5 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-blue-600" />
                Doctor Profile Details
              </h3>
              <button
                onClick={() => setViewingDoctor(null)}
                className="rounded-full p-1 hover:bg-slate-100 text-slate-500 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {loadingDetails ? (
              <LoadingSpinner />
            ) : viewingDoctor ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 divide-y divide-slate-100 text-sm">
                  {[
                    ['Doctor ID', `#${viewingDoctor.id}`],
                    ['Doctor Name', `Dr. ${viewingDoctor.firstName ? `${viewingDoctor.firstName} ${viewingDoctor.lastName}` : viewingDoctor.name || 'Doctor'}`],
                    ['Email Address', viewingDoctor.email],
                    ['Mobile Number', viewingDoctor.mobile],
                    ['Gender', viewingDoctor.gender],
                    ['Department', viewingDoctor.departmentName || viewingDoctor.department || '—'],
                    ['Specialization', viewingDoctor.specializationName || viewingDoctor.specialization || '—'],
                    ['Qualification', viewingDoctor.qualification || '—'],
                    ['Experience', `${viewingDoctor.experience ?? 0} Years`],
                    ['Consultation Fee', viewingDoctor.consultationFee != null ? `₹${viewingDoctor.consultationFee}` : '—'],
                    ['License Number', viewingDoctor.licenseNumber || '—'],
                    ['Available', viewingDoctor.available ? 'Yes' : 'No'],
                    ['Role / Status', `${viewingDoctor.role || 'DOCTOR'} (${viewingDoctor.status || 'ACTIVE'})`],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between py-2.5 first:pt-0 last:pb-0">
                      <span className="text-slate-500 font-medium text-xs">{label}</span>
                      <span className="font-bold text-slate-800 text-sm">{val || '—'}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setViewingDoctor(null)}
                  className="w-full rounded-xl bg-slate-800 text-white font-semibold py-2.5 text-sm hover:bg-slate-900 transition-colors"
                >
                  Close
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
