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
import {
  Stethoscope,
  CheckCircle,
  X,
  Eye,
  EyeOff,
  Building2,
  Award,
  GraduationCap,
  Phone,
  Mail,
  Wallet,
  Shield,
  UserPlus,
} from 'lucide-react';
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
  gender: '',
  departmentId: '',
  qualification: '',
  experience: '',
  specializationId: '',
  consultationFee: '',
  licenseNumber: '',
};

export default function RegisterDoctor() {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [departments, setDepartments] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
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
      return (
        name.includes(q) ||
        email.includes(q) ||
        mobile.includes(q) ||
        dept.includes(q) ||
        spec.includes(q) ||
        license.includes(q) ||
        idStr.includes(q)
      );
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
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  /** Client-side validation enforcing field-level errors */
  const validateForm = () => {
    const errs = {};
    const nameRegex = /^[A-Za-z ]+$/;

    if (!formData.firstName.trim()) {
      errs.firstName = 'First Name is required';
    } else if (
      !nameRegex.test(formData.firstName.trim()) ||
      formData.firstName.trim().length < 2 ||
      formData.firstName.trim().length > 50
    ) {
      errs.firstName = 'First Name must contain only letters and spaces (2-50 characters)';
    }

    if (!formData.lastName.trim()) {
      errs.lastName = 'Last Name is required';
    } else if (
      !nameRegex.test(formData.lastName.trim()) ||
      formData.lastName.trim().length < 2 ||
      formData.lastName.trim().length > 50
    ) {
      errs.lastName = 'Last Name must contain only letters and spaces (2-50 characters)';
    }

    if (!formData.email.trim()) {
      errs.email = 'Email is required';
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim()) ||
      formData.email.length > 100
    ) {
      errs.email = 'Enter a valid email address (max 100 characters)';
    }

    const mobileRegex = /^[6-9]\d{9}$/;
    if (!formData.mobile.trim()) {
      errs.mobile = 'Mobile number is required';
    } else if (!mobileRegex.test(formData.mobile.trim())) {
      errs.mobile = 'Mobile number must be a valid 10-digit number starting with 6-9';
    }

    const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,20}$/;
    if (!formData.password) {
      errs.password = 'Password is required';
    } else if (!passRegex.test(formData.password)) {
      errs.password = '8-20 characters with uppercase, lowercase, number and special character (@$!%*?&#)';
    }

    if (!formData.gender) {
      errs.gender = 'Gender is required';
    }

    if (!formData.departmentId) {
      errs.departmentId = 'Department is required';
    }

    if (!formData.specializationId) {
      errs.specializationId = 'Specialization is required';
    }

    if (!formData.qualification.trim()) {
      errs.qualification = 'Qualification is required';
    } else if (formData.qualification.trim().length < 2 || formData.qualification.trim().length > 100) {
      errs.qualification = 'Qualification must be between 2 and 100 characters';
    }

    if (formData.experience === '' || formData.experience === null || formData.experience === undefined) {
      errs.experience = 'Experience is required';
    } else {
      const exp = Number(formData.experience);
      if (isNaN(exp) || exp < 0 || exp > 60) {
        errs.experience = 'Experience must be between 0 and 60 years';
      }
    }

    if (
      formData.consultationFee === '' ||
      formData.consultationFee === null ||
      formData.consultationFee === undefined
    ) {
      errs.consultationFee = 'Consultation Fee is required';
    } else {
      const fee = Number(formData.consultationFee);
      if (isNaN(fee) || fee < 0) {
        errs.consultationFee = 'Consultation Fee must be a non-negative number';
      }
    }

    const licenseRegex = /^[A-Za-z0-9-]+$/;
    if (!formData.licenseNumber.trim()) {
      errs.licenseNumber = 'License Number is required';
    } else if (
      !licenseRegex.test(formData.licenseNumber.trim()) ||
      formData.licenseNumber.trim().length < 5 ||
      formData.licenseNumber.trim().length > 30
    ) {
      errs.licenseNumber = 'License Number must be 5-30 alphanumeric characters (hyphens allowed)';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
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
      setShowAddModal(false);
      setFormData(INITIAL_FORM);
      setErrors({});

      // Refresh doctor directory
      if (departments.length > 0) {
        fetchAllDoctors(departments);
      }
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.errors && typeof errData.errors === 'object') {
        setErrors((prev) => ({ ...prev, ...errData.errors }));
      }
      const msg = errData?.message || errData?.error || 'Registration failed';
      toast.error(msg);
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner fullPage />;

  const getInputClass = (field) =>
    `w-full rounded-xl border ${
      errors[field] ? 'border-red-400 focus:ring-red-200' : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'
    } px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all bg-white`;

  const ErrorMsg = ({ field }) =>
    errors[field] ? <p className="mt-1 text-xs text-red-500 font-medium">{errors[field]}</p> : null;

  /** DataTable column definitions displaying all Doctor response fields */
  const columns = [
    {
      header: 'ID',
      accessor: 'id',
      render: (row) => <span className="font-mono font-bold text-slate-800">#{row.id}</span>,
    },
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
        <span className="font-bold text-emerald-700">₹{row.consultationFee ?? '—'}</span>
      ),
    },
    {
      header: 'License #',
      accessor: 'licenseNumber',
      render: (row) => (
        <span className="text-xs font-mono text-slate-600">{row.licenseNumber || '—'}</span>
      ),
    },
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
    <div className="space-y-6">
      {/* ─── Page Header ─── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Stethoscope className="h-7 w-7 text-blue-600" />
            Doctor Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            View registered doctors directory and register new medical practitioners
          </p>
        </div>
        <button
          onClick={() => {
            setFormData(INITIAL_FORM);
            setErrors({});
            setShowAddModal(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          <UserPlus className="h-4 w-4" />
          Add Doctor
        </button>
      </div>

      {/* ─── Registered Doctors Directory Table ─── */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

      {/* ─── REGISTER DOCTOR MODAL ─── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl space-y-6 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-blue-600" />
                Register New Doctor
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-full p-1 hover:bg-slate-100 text-slate-500 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
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
                      className={getInputClass('firstName')}
                      placeholder="John"
                    />
                    <ErrorMsg field="firstName" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className={getInputClass('lastName')}
                      placeholder="Doe"
                    />
                    <ErrorMsg field="lastName" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={getInputClass('email')}
                      placeholder="doctor@hospital.com"
                    />
                    <ErrorMsg field="email" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Mobile *</label>
                    <input
                      type="tel"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleChange}
                      maxLength={10}
                      onInput={(e) => {
                        e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                      }}
                      className={getInputClass('mobile')}
                      placeholder="9876543210"
                    />
                    <ErrorMsg field="mobile" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Password *</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`${getInputClass('password')} !pr-10`}
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
                    <ErrorMsg field="password" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Gender *</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className={getInputClass('gender')}
                    >
                      <option value="">-- Select Gender --</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                    <ErrorMsg field="gender" />
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
                    <select
                      name="departmentId"
                      value={formData.departmentId}
                      onChange={handleChange}
                      className={getInputClass('departmentId')}
                    >
                      <option value="">-- Select Department --</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.departmentName}
                        </option>
                      ))}
                    </select>
                    <ErrorMsg field="departmentId" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Specialization *</label>
                    <select
                      name="specializationId"
                      value={formData.specializationId}
                      onChange={handleChange}
                      className={getInputClass('specializationId')}
                    >
                      <option value="">-- Select Specialization --</option>
                      {availableSpecializations.map((spec) => (
                        <option key={spec.id} value={spec.id}>
                          {spec.specializationName} ({spec.departmentName || 'Dept'})
                        </option>
                      ))}
                    </select>
                    <ErrorMsg field="specializationId" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Qualification *</label>
                    <input
                      type="text"
                      name="qualification"
                      value={formData.qualification}
                      onChange={handleChange}
                      className={getInputClass('qualification')}
                      placeholder="MBBS, MD"
                    />
                    <ErrorMsg field="qualification" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Experience (Years) *</label>
                    <input
                      type="number"
                      name="experience"
                      value={formData.experience}
                      onChange={handleChange}
                      min={0}
                      max={60}
                      className={getInputClass('experience')}
                      placeholder="5"
                    />
                    <ErrorMsg field="experience" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Consultation Fee (₹) *</label>
                    <input
                      type="number"
                      name="consultationFee"
                      value={formData.consultationFee}
                      onChange={handleChange}
                      min={0}
                      step="1"
                      className={getInputClass('consultationFee')}
                      placeholder="500"
                    />
                    <ErrorMsg field="consultationFee" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">License Number *</label>
                    <input
                      type="text"
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleChange}
                      className={getInputClass('licenseNumber')}
                      placeholder="MCI-12345"
                    />
                    <ErrorMsg field="licenseNumber" />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 py-2.5 transition-colors disabled:opacity-50 shadow-sm"
                >
                  {submitting ? 'Registering...' : 'Register Doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                    [
                      'Doctor Name',
                      `Dr. ${
                        viewingDoctor.firstName
                          ? `${viewingDoctor.firstName} ${viewingDoctor.lastName}`
                          : viewingDoctor.name || 'Doctor'
                      }`,
                    ],
                    ['Email Address', viewingDoctor.email],
                    ['Mobile Number', viewingDoctor.mobile],
                    ['Gender', viewingDoctor.gender],
                    ['Department', viewingDoctor.departmentName || viewingDoctor.department || '—'],
                    ['Specialization', viewingDoctor.specializationName || viewingDoctor.specialization || '—'],
                    ['Qualification', viewingDoctor.qualification || '—'],
                    ['Experience', `${viewingDoctor.experience ?? 0} Years`],
                    [
                      'Consultation Fee',
                      viewingDoctor.consultationFee != null ? `₹${viewingDoctor.consultationFee}` : '—',
                    ],
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
