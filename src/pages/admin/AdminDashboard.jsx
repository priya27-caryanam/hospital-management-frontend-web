/**
 * Admin Dashboard Page
 *
 * Implements GET /api/dashboard/admin metrics along with dynamic interactive data explorer.
 * Clicking ANY metric card displays the complete list (Doctors, Patients, Nurses, Receptionists, Lab Techs, Pharmacists, Departments, Medicines)
 * directly on the Admin Dashboard page!
 */
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  UserPlus,
  Users,
  CalendarCheck,
  Stethoscope,
  Activity,
  Receipt,
  HeartPulse,
  BarChart3,
  TestTube,
  Pill,
  ShieldCheck,
  ArrowRight,
  Eye,
  CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import departmentApi from '../../api/departmentApi';
import dashboardApi from '../../api/dashboardApi';
import patientApi from '../../api/patientApi';
import doctorApi from '../../api/doctorApi';
import nurseApi from '../../api/nurseApi';
import receptionistApi from '../../api/receptionistApi';
import labTechnicianApi from '../../api/labTechnicianApi';
import pharmacistApi from '../../api/pharmacistApi';
import medicineApi from '../../api/medicineApi';
import StatsCard from '../../components/common/StatsCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import DataTable from '../../components/common/DataTable';
import SearchBar from '../../components/common/SearchBar';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [departmentCount, setDepartmentCount] = useState(0);
  const [stats, setStats] = useState(null);

  // Active Category Data Explorer State
  const [selectedCategory, setSelectedCategory] = useState('doctors'); // default selected category
  const [categoryData, setCategoryData] = useState([]);
  const [loadingCategoryData, setLoadingCategoryData] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  /** Fetch aggregate stats on mount */
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [deptRes, statsRes] = await Promise.all([
          departmentApi.getAll(),
          dashboardApi.getAdminStats(),
        ]);
        setDepartmentCount(deptRes.data?.length || 0);
        setStats(statsRes.data);
      } catch (err) {
        toast.error('Failed to load dashboard data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  /** Fetch list for selected category */
  const loadCategoryData = async (cat) => {
    setSelectedCategory(cat);
    setSearchQuery('');
    setCurrentPage(1);
    setLoadingCategoryData(true);
    try {
      if (cat === 'departments') {
        const res = await departmentApi.getAll();
        setCategoryData(res.data || []);
      } else if (cat === 'patients') {
        const res = await patientApi.search('');
        setCategoryData(res.data || []);
      } else if (cat === 'doctors') {
        const deptRes = await departmentApi.getAll();
        const depts = deptRes.data || [];
        const promises = depts.map((d) => doctorApi.getByDepartment(d.id).catch(() => ({ data: [] })));
        const results = await Promise.all(promises);
        const map = new Map();
        results.forEach((res) => {
          (Array.isArray(res.data) ? res.data : []).forEach((doc) => {
            if (doc && doc.id) map.set(doc.id, doc);
          });
        });
        setCategoryData(Array.from(map.values()));
      } else if (cat === 'nurses') {
        const res = await nurseApi.getAll();
        setCategoryData(res.data || []);
      } else if (cat === 'receptionists') {
        const res = await receptionistApi.getAll();
        setCategoryData(res.data || []);
      } else if (cat === 'labTechs') {
        const res = await labTechnicianApi.getAll();
        setCategoryData(res.data || []);
      } else if (cat === 'pharmacists') {
        const res = await pharmacistApi.getAll();
        setCategoryData(res.data || []);
      } else if (cat === 'medicines') {
        const res = await medicineApi.getAll();
        setCategoryData(res.data || []);
      } else {
        setCategoryData([]);
      }
    } catch (err) {
      console.error(`Failed to load data for ${cat}:`, err);
      toast.error(`Could not load ${cat} list`);
    } finally {
      setLoadingCategoryData(false);
    }
  };

  /** Initial load of default 'doctors' list */
  useEffect(() => {
    loadCategoryData('doctors');
  }, []);

  /** Filter data based on search query */
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return categoryData;
    const q = searchQuery.toLowerCase().trim();
    return categoryData.filter((item) => {
      const name = `${item.firstName || ''} ${item.lastName || ''} ${item.name || ''} ${item.departmentName || ''}`.toLowerCase();
      const email = (item.email || '').toLowerCase();
      const mobile = (item.mobile || '').toLowerCase();
      const spec = (item.specializationName || item.specialization || '').toLowerCase();
      const idStr = String(item.id || '');
      return name.includes(q) || email.includes(q) || mobile.includes(q) || spec.includes(q) || idStr.includes(q);
    });
  }, [categoryData, searchQuery]);

  /** Category metadata definition */
  const CATEGORY_META = {
    departments: { title: 'Departments Directory', path: '/admin/departments', icon: Building2, color: 'text-blue-600 bg-blue-50' },
    patients: { title: 'Registered Patients List', path: '/admin/patients', icon: Users, color: 'text-cyan-600 bg-cyan-50' },
    doctors: { title: 'Registered Doctors Directory', path: '/admin/register-doctor', icon: Stethoscope, color: 'text-emerald-600 bg-emerald-50' },
    nurses: { title: 'Registered Nurses Directory', path: '/admin/register-nurse', icon: HeartPulse, color: 'text-purple-600 bg-purple-50' },
    receptionists: { title: 'Registered Receptionists Directory', path: '/admin/register-receptionist', icon: UserPlus, color: 'text-amber-600 bg-amber-50' },
    labTechs: { title: 'Registered Lab Technicians Directory', path: '/admin/register-lab-technician', icon: TestTube, color: 'text-rose-600 bg-rose-50' },
    pharmacists: { title: 'Registered Pharmacists Directory', path: '/admin/register-pharmacist', icon: Pill, color: 'text-indigo-600 bg-indigo-50' },
    medicines: { title: 'Medicines Inventory Catalog', path: '/admin/medicines', icon: Pill, color: 'text-emerald-600 bg-emerald-50' },
  };

  /** Dynamic Columns generator for DataTable */
  const getColumns = () => {
    switch (selectedCategory) {
      case 'departments':
        return [
          { header: 'ID', accessor: 'id', render: (r) => <span className="font-mono font-bold">#{r.id}</span> },
          { header: 'Department Name', accessor: 'departmentName', render: (r) => <span className="font-bold text-slate-900">{r.departmentName}</span> },
          { header: 'Description', accessor: 'description', render: (r) => <span className="text-xs text-slate-600">{r.description || '—'}</span> },
        ];
      case 'patients':
        return [
          { header: 'ID', accessor: 'id', render: (r) => <span className="font-mono font-bold">#{r.id}</span> },
          { header: 'Patient Name', render: (r) => <span className="font-bold text-slate-900">{r.firstName ? `${r.firstName} ${r.lastName}` : r.name || 'Patient'}</span> },
          { header: 'Email', accessor: 'email' },
          { header: 'Mobile', accessor: 'mobile' },
          { header: 'Gender', accessor: 'gender' },
        ];
      case 'doctors':
        return [
          { header: 'ID', accessor: 'id', render: (r) => <span className="font-mono font-bold">#{r.id}</span> },
          { header: 'Doctor Name', render: (r) => <span className="font-bold text-slate-900">Dr. {r.firstName ? `${r.firstName} ${r.lastName}` : r.name || 'Doctor'}</span> },
          { header: 'Email', accessor: 'email' },
          { header: 'Mobile', accessor: 'mobile' },
          { header: 'Department', render: (r) => <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700">{r.departmentName || r.department || '—'}</span> },
          { header: 'Specialization', render: (r) => <span className="text-xs font-semibold text-slate-700">{r.specializationName || r.specialization || '—'}</span> },
          { header: 'Fee', render: (r) => <span className="font-bold text-emerald-700">₹{r.consultationFee ?? '—'}</span> },
        ];
      case 'nurses':
        return [
          { header: 'ID', accessor: 'id', render: (r) => <span className="font-mono font-bold">#{r.id}</span> },
          { header: 'Nurse Name', render: (r) => <span className="font-bold text-slate-900">{r.firstName ? `${r.firstName} ${r.lastName}` : r.name || 'Nurse'}</span> },
          { header: 'Email', accessor: 'email' },
          { header: 'Mobile', accessor: 'mobile' },
          { header: 'Department', render: (r) => <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-bold text-purple-700">{r.departmentName || '—'}</span> },
          { header: 'Shift', render: (r) => <span className="text-xs font-semibold text-slate-700">{r.shift || '—'}</span> },
        ];
      case 'receptionists':
        return [
          { header: 'ID', accessor: 'id', render: (r) => <span className="font-mono font-bold">#{r.id}</span> },
          { header: 'Receptionist Name', render: (r) => <span className="font-bold text-slate-900">{r.firstName ? `${r.firstName} ${r.lastName}` : r.name || 'Receptionist'}</span> },
          { header: 'Email', accessor: 'email' },
          { header: 'Mobile', accessor: 'mobile' },
          { header: 'Shift', render: (r) => <span className="text-xs font-semibold text-slate-700">{r.shift || '—'}</span> },
        ];
      case 'labTechs':
        return [
          { header: 'ID', accessor: 'id', render: (r) => <span className="font-mono font-bold">#{r.id}</span> },
          { header: 'Lab Tech Name', render: (r) => <span className="font-bold text-slate-900">{r.firstName ? `${r.firstName} ${r.lastName}` : r.name || 'Lab Tech'}</span> },
          { header: 'Email', accessor: 'email' },
          { header: 'Mobile', accessor: 'mobile' },
          { header: 'Shift', render: (r) => <span className="text-xs font-semibold text-slate-700">{r.shift || '—'}</span> },
        ];
      case 'pharmacists':
        return [
          { header: 'ID', accessor: 'id', render: (r) => <span className="font-mono font-bold">#{r.id}</span> },
          { header: 'Pharmacist Name', render: (r) => <span className="font-bold text-slate-900">{r.firstName ? `${r.firstName} ${r.lastName}` : r.name || 'Pharmacist'}</span> },
          { header: 'Email', accessor: 'email' },
          { header: 'Mobile', accessor: 'mobile' },
          { header: 'Shift', render: (r) => <span className="text-xs font-semibold text-slate-700">{r.shift || '—'}</span> },
        ];
      case 'medicines':
        return [
          { header: 'ID', accessor: 'id', render: (r) => <span className="font-mono font-bold">#{r.id}</span> },
          { header: 'Medicine Name', accessor: 'name', render: (r) => <span className="font-bold text-slate-900">{r.name}</span> },
          { header: 'Category', accessor: 'category' },
          { header: 'Manufacturer', accessor: 'manufacturer' },
          { header: 'Price', render: (r) => <span className="font-bold text-emerald-700">₹{r.unitPrice ?? '—'}</span> },
          { header: 'Stock Quantity', render: (r) => <span className="font-bold text-slate-800">{r.stockQuantity ?? 0}</span> },
        ];
      default:
        return [];
    }
  };

  /** Quick action buttons for common admin tasks */
  const quickActions = [
    { label: 'Manage Departments', icon: Building2, path: '/admin/departments' },
    { label: 'Register Doctor', icon: Stethoscope, path: '/admin/register-doctor' },
    { label: 'Register Nurse', icon: HeartPulse, path: '/admin/register-nurse' },
    { label: 'Register Receptionist', icon: UserPlus, path: '/admin/register-receptionist' },
    { label: 'Register Pharmacist', icon: Pill, path: '/admin/register-pharmacist' },
    { label: 'Register Lab Tech', icon: TestTube, path: '/admin/register-lab-technician' },
    { label: 'Search Patients', icon: Users, path: '/admin/patients' },
    { label: 'Appointments', icon: CalendarCheck, path: '/admin/appointments' },
    { label: 'Billing & Revenue', icon: Receipt, path: '/admin/billing' },
  ];

  if (loading) return <LoadingSpinner fullPage />;

  const currentMeta = CATEGORY_META[selectedCategory] || CATEGORY_META.doctors;
  const CategoryIcon = currentMeta.icon;

  return (
    <div className="space-y-8">
      {/* ─── Welcome Header ─── */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold">
          Welcome back, {user?.name || 'Admin'} 👋
        </h1>
        <p className="mt-2 text-blue-100">
          Click any card below to instantly display its complete data directory list on the dashboard
        </p>
      </div>

      {/* ─── All Interactive Admin Dashboard Stats Cards ─── */}
      <div>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
          Select Metric Card To View List
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <div className={selectedCategory === 'departments' ? 'ring-2 ring-blue-500 rounded-2xl shadow-md' : ''}>
            <StatsCard
              icon={Building2}
              label="Total Departments"
              value={departmentCount}
              color="blue"
              onClick={() => loadCategoryData('departments')}
            />
          </div>
          <div className={selectedCategory === 'patients' ? 'ring-2 ring-cyan-500 rounded-2xl shadow-md' : ''}>
            <StatsCard
              icon={Users}
              label="Total Patients"
              value={stats?.totalPatients ?? 0}
              color="cyan"
              onClick={() => loadCategoryData('patients')}
            />
          </div>
          <div className={selectedCategory === 'doctors' ? 'ring-2 ring-emerald-500 rounded-2xl shadow-md' : ''}>
            <StatsCard
              icon={Stethoscope}
              label="Total Doctors"
              value={stats?.totalDoctors ?? 0}
              color="green"
              onClick={() => loadCategoryData('doctors')}
            />
          </div>
          <div className={selectedCategory === 'nurses' ? 'ring-2 ring-purple-500 rounded-2xl shadow-md' : ''}>
            <StatsCard
              icon={HeartPulse}
              label="Total Nurses"
              value={stats?.totalNurses ?? 0}
              color="purple"
              onClick={() => loadCategoryData('nurses')}
            />
          </div>
          <div className={selectedCategory === 'receptionists' ? 'ring-2 ring-amber-500 rounded-2xl shadow-md' : ''}>
            <StatsCard
              icon={UserPlus}
              label="Total Receptionists"
              value={stats?.totalReceptionists ?? 0}
              color="amber"
              onClick={() => loadCategoryData('receptionists')}
            />
          </div>
          <div className={selectedCategory === 'labTechs' ? 'ring-2 ring-rose-500 rounded-2xl shadow-md' : ''}>
            <StatsCard
              icon={TestTube}
              label="Total Lab Techs"
              value={stats?.totalLabTechnicians ?? 0}
              color="rose"
              onClick={() => loadCategoryData('labTechs')}
            />
          </div>
          <div className={selectedCategory === 'pharmacists' ? 'ring-2 ring-indigo-500 rounded-2xl shadow-md' : ''}>
            <StatsCard
              icon={Pill}
              label="Total Pharmacists"
              value={stats?.totalPharmacists ?? 0}
              color="indigo"
              onClick={() => loadCategoryData('pharmacists')}
            />
          </div>
          <div className={selectedCategory === 'appointments' ? 'ring-2 ring-blue-500 rounded-2xl shadow-md' : ''}>
            <StatsCard
              icon={CalendarCheck}
              label="Total Appointments"
              value={stats?.totalAppointments ?? 0}
              color="blue"
              onClick={() => navigate('/admin/appointments')}
            />
          </div>
          <div className={selectedCategory === 'medicines' ? 'ring-2 ring-emerald-500 rounded-2xl shadow-md' : ''}>
            <StatsCard
              icon={Pill}
              label="Total Medicines Catalog"
              value={stats?.totalMedicines ?? 0}
              color="green"
              onClick={() => loadCategoryData('medicines')}
            />
          </div>
          <div>
            <StatsCard
              icon={Receipt}
              label="Total Revenue"
              value={stats?.totalRevenue !== undefined && stats?.totalRevenue !== null ? `₹${stats.totalRevenue}` : '₹0'}
              color="amber"
              onClick={() => navigate('/admin/billing')}
            />
          </div>
        </div>
      </div>

      {/* ─── Dynamic Live Data Directory List Section (Appears when clicking cards!) ─── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5 animate-fade-in">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${currentMeta.color}`}>
              <CategoryIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                {currentMeta.title}
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                  {filteredData.length} Loaded
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Displaying real-time records for selected metric card
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <SearchBar
              placeholder="Search in this list..."
              onSearch={(val) => {
                setSearchQuery(val);
                setCurrentPage(1);
              }}
              className="w-full sm:w-64"
            />
            <button
              onClick={() => navigate(currentMeta.path)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition-colors shrink-0"
            >
              Open Page
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <DataTable
          columns={getColumns()}
          data={filteredData}
          loading={loadingCategoryData}
          emptyMessage={`No ${selectedCategory} records found.`}
          pageSize={8}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* ─── Quick Actions Grid ─── */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-800">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.path}
                onClick={() => navigate(action.path)}
                className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-blue-200"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-transform group-hover:scale-110">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{action.label}</p>
                  <p className="text-xs text-slate-400">Click to navigate</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
