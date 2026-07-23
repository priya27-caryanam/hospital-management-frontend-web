/**
 * App Component — Root Application Router
 * Defines all routes with role-based protection for ADMIN, DOCTOR, NURSE, RECEPTIONIST, PHARMACIST, LAB_TECHNICIAN, PATIENT
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';

// Public pages
import SplashScreen from './pages/SplashScreen';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageDepartments from './pages/admin/ManageDepartments';
import RegisterDoctor from './pages/admin/RegisterDoctor';
import RegisterNurse from './pages/admin/RegisterNurse';
import RegisterReceptionist from './pages/admin/RegisterReceptionist';
import RegisterPharmacist from './pages/admin/RegisterPharmacist';
import RegisterLabTechnician from './pages/admin/RegisterLabTechnician';
import AdminPatientSearch from './pages/admin/PatientSearch';
import AdminAppointments from './pages/admin/Appointments';
import AdminBilling from './pages/admin/Billing';
import AdminSymptoms from './pages/admin/Symptoms';
import Reports from './pages/admin/Reports';

// Doctor pages
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import DoctorProfile from './pages/doctor/DoctorProfile';
import DoctorAppointments from './pages/doctor/MyAppointments';
import AddPrescription from './pages/doctor/AddPrescription';

// Nurse pages
import NurseDashboard from './pages/nurse/NurseDashboard';
import NurseProfile from './pages/nurse/NurseProfile';
import AssignedPatients from './pages/nurse/AssignedPatients';

// Receptionist pages
import ReceptionistDashboard from './pages/receptionist/ReceptionistDashboard';
import ReceptionistPatientSearch from './pages/receptionist/PatientSearch';
import ReceptionistBookAppointment from './pages/receptionist/BookAppointment';
import ReceptionistBilling from './pages/receptionist/Billing';
import SymptomsSuggestion from './pages/receptionist/SymptomsSuggestion';

// Pharmacist pages
import PharmacistDashboard from './pages/pharmacist/PharmacistDashboard';
import PendingPrescriptions from './pages/pharmacist/PendingPrescriptions';
import ManageMedicines from './pages/pharmacist/ManageMedicines';

// Lab Technician pages
import LabDashboard from './pages/lab/LabDashboard';
import LabOrders from './pages/lab/LabOrders';
import LabReports from './pages/lab/LabReports';

// Patient pages
import PatientDashboard from './pages/patient/PatientDashboard';
import PatientProfile from './pages/patient/PatientProfile';
import SearchDoctor from './pages/patient/SearchDoctor';
import PatientBookAppointment from './pages/patient/BookAppointment';
import PatientAppointments from './pages/patient/MyAppointments';
import Prescriptions from './pages/patient/Prescriptions';
import MyBills from './pages/patient/MyBills';
import PatientSymptomChecker from './pages/patient/PatientSymptomChecker';

export default function App() {
  return (
    <Routes>
      {/* ============= PUBLIC ROUTES ============= */}
      <Route path="/" element={<SplashScreen />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* ============= ADMIN ROUTES ============= */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="departments" element={<ManageDepartments />} />
        <Route path="register-doctor" element={<RegisterDoctor />} />
        <Route path="register-nurse" element={<RegisterNurse />} />
        <Route path="register-receptionist" element={<RegisterReceptionist />} />
        <Route path="register-pharmacist" element={<RegisterPharmacist />} />
        <Route path="register-lab-technician" element={<RegisterLabTechnician />} />
        <Route path="patients" element={<AdminPatientSearch />} />
        <Route path="appointments" element={<AdminAppointments />} />
        <Route path="billing" element={<AdminBilling />} />
        <Route path="symptoms" element={<AdminSymptoms />} />
        <Route path="reports" element={<Reports />} />
      </Route>

      {/* ============= DOCTOR ROUTES ============= */}
      <Route
        path="/doctor"
        element={
          <ProtectedRoute allowedRoles={['DOCTOR']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DoctorDashboard />} />
        <Route path="profile" element={<DoctorProfile />} />
        <Route path="appointments" element={<DoctorAppointments />} />
        <Route path="prescriptions" element={<AddPrescription />} />
      </Route>

      {/* ============= NURSE ROUTES ============= */}
      <Route
        path="/nurse"
        element={
          <ProtectedRoute allowedRoles={['NURSE']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<NurseDashboard />} />
        <Route path="profile" element={<NurseProfile />} />
        <Route path="patients" element={<AssignedPatients />} />
      </Route>

      {/* ============= RECEPTIONIST ROUTES ============= */}
      <Route
        path="/receptionist"
        element={
          <ProtectedRoute allowedRoles={['RECEPTIONIST']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<ReceptionistDashboard />} />
        <Route path="patients" element={<ReceptionistPatientSearch />} />
        <Route path="appointments" element={<ReceptionistBookAppointment />} />
        <Route path="billing" element={<ReceptionistBilling />} />
        <Route path="symptoms" element={<SymptomsSuggestion />} />
      </Route>

      {/* ============= PHARMACIST ROUTES ============= */}
      <Route
        path="/pharmacist"
        element={
          <ProtectedRoute allowedRoles={['PHARMACIST']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<PharmacistDashboard />} />
        <Route path="prescriptions" element={<PendingPrescriptions />} />
        <Route path="medicines" element={<ManageMedicines />} />
      </Route>

      {/* ============= LAB TECHNICIAN ROUTES ============= */}
      <Route
        path="/lab"
        element={
          <ProtectedRoute allowedRoles={['LAB_TECHNICIAN']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<LabDashboard />} />
        <Route path="orders" element={<LabOrders />} />
        <Route path="reports" element={<LabReports />} />
      </Route>

      {/* ============= PATIENT ROUTES ============= */}
      <Route
        path="/patient"
        element={
          <ProtectedRoute allowedRoles={['PATIENT']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<PatientDashboard />} />
        <Route path="profile" element={<PatientProfile />} />
        <Route path="doctors" element={<SearchDoctor />} />
        <Route path="book-appointment" element={<PatientBookAppointment />} />
        <Route path="appointments" element={<PatientAppointments />} />
        <Route path="prescriptions" element={<Prescriptions />} />
        <Route path="bills" element={<MyBills />} />
        <Route path="symptoms" element={<PatientSymptomChecker />} />
      </Route>

      {/* ============= CATCH-ALL ============= */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
