/**
 * Nurse API
 * Endpoints for managing nurses and nurse profiles
 * OpenAPI Spec: nurse-controller
 */
import axiosInstance from './axios';

const nurseApi = {
  /** POST /api/nurses — Register/Create a new nurse */
  create: (data) => {
    return axiosInstance.post('/nurses', data);
  },

  /** GET /api/nurses — Get all nurses */
  getAll: () => {
    return axiosInstance.get('/nurses');
  },

  /** GET /api/nurses/{id} — View Nurse profile details */
  getById: (id) => {
    return axiosInstance.get(`/nurses/${id}`);
  },

  /** PUT /api/nurses/{id} — Update Nurse details */
  update: (id, data) => {
    return axiosInstance.put(`/nurses/${id}`, data);
  },

  /** DELETE /api/nurses/{id} — Remove Nurse */
  remove: (id) => {
    return axiosInstance.delete(`/nurses/${id}`);
  },

  /** GET /api/nurses/{nurseId}/assigned-patients — View assigned patients */
  getAssignedPatients: (nurseId) => {
    return axiosInstance.get(`/nurses/${nurseId}/assigned-patients`);
  },
};

export default nurseApi;
