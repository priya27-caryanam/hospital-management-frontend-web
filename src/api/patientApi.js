/**
 * Patient API
 * Endpoints for searching and viewing patient profiles
 */
import axiosInstance from './axios';

const patientApi = {
  /** GET /api/patients/{id} — View Patient profile details (PATIENT/RECEPTIONIST/ADMIN) */
  getById: (id) => {
    return axiosInstance.get(`/patients/${id}`);
  },

  /** GET /api/patients/search — Search Patients by name, email, or mobile (RECEPTIONIST/ADMIN) */
  search: (query = '') => {
    return axiosInstance.get('/patients/search', { params: { query } });
  },
};

export default patientApi;
