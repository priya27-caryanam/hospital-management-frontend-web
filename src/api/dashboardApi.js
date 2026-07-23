/**
 * Dashboard API
 * Endpoints for pulling consolidated stats for different roles.
 * OpenAPI Spec: dashboard-controller
 */
import axiosInstance from './axios';

const dashboardApi = {
  /** GET /api/dashboard/admin — Retrieve consolidated admin stats */
  getAdminStats: () => {
    return axiosInstance.get('/dashboard/admin');
  },

  /** GET /api/dashboard/doctor/{doctorId} — Retrieve doctor stats */
  getDoctorStats: (doctorId) => {
    return axiosInstance.get(`/dashboard/doctor/${doctorId}`);
  },

  /** GET /api/dashboard/pharmacy — Retrieve pharmacy stats */
  getPharmacyStats: () => {
    return axiosInstance.get('/dashboard/pharmacy');
  },

  /** GET /api/dashboard/lab — Retrieve lab stats */
  getLabStats: () => {
    return axiosInstance.get('/dashboard/lab');
  },

  /** GET /api/dashboard/patient/{patientId} — Retrieve patient stats */
  getPatientStats: (patientId) => {
    return axiosInstance.get(`/dashboard/patient/${patientId}`);
  },

  /** GET /api/dashboard/receptionist — Retrieve receptionist stats */
  getReceptionistStats: () => {
    return axiosInstance.get('/dashboard/receptionist');
  },
};

export default dashboardApi;
