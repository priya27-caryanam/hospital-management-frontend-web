/**
 * Authentication API
 * Endpoints for login and registration per OpenAPI spec
 */
import axiosInstance from './axios';

const authApi = {
  /** POST /api/auth/login — Login to the system */
  login: (email, password) => {
    return axiosInstance.post('/auth/login', { email, password });
  },

  /** POST /api/auth/register/doctor — Register a new doctor (ADMIN only) */
  registerDoctor: (data) => {
    return axiosInstance.post('/auth/register/doctor', data);
  },

  /** POST /api/auth/register/patient — Register a new patient (Public) */
  registerPatient: (data) => {
    return axiosInstance.post('/auth/register/patient', data);
  },

  /** POST /api/nurses — Nurse creation (OpenAPI endpoint) */
  registerNurse: (data) => {
    return axiosInstance.post('/nurses', data);
  },

  /** POST /api/receptionists — Receptionist creation (OpenAPI endpoint) */
  registerReceptionist: (data) => {
    return axiosInstance.post('/receptionists', data);
  },
};

export default authApi;
