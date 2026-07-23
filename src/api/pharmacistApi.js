/**
 * Pharmacist API
 * Endpoints for managing pharmacists
 * OpenAPI Spec: pharmacist-controller
 */
import axiosInstance from './axios';

const pharmacistApi = {
  /** POST /api/pharmacists — Create a new Pharmacist */
  create: (data) => {
    return axiosInstance.post('/pharmacists', data);
  },

  /** GET /api/pharmacists — Get all Pharmacists */
  getAll: () => {
    return axiosInstance.get('/pharmacists');
  },

  /** GET /api/pharmacists/{id} — View Pharmacist details */
  getById: (id) => {
    return axiosInstance.get(`/pharmacists/${id}`);
  },

  /** PUT /api/pharmacists/{id} — Update Pharmacist details */
  update: (id, data) => {
    return axiosInstance.put(`/pharmacists/${id}`, data);
  },

  /** DELETE /api/pharmacists/{id} — Remove Pharmacist */
  remove: (id) => {
    return axiosInstance.delete(`/pharmacists/${id}`);
  },
};

export default pharmacistApi;
