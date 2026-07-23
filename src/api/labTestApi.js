/**
 * Lab Test API
 * Endpoints for lab test catalog management
 */
import axiosInstance from './axios';

const labTestApi = {
  /** POST /api/lab-tests — Create a new Lab Test */
  create: (data) => {
    return axiosInstance.post('/lab-tests', data);
  },

  /** GET /api/lab-tests — Get all Lab Tests */
  getAll: () => {
    return axiosInstance.get('/lab-tests');
  },

  /** GET /api/lab-tests/{id} — Get Lab Test by ID */
  getById: (id) => {
    return axiosInstance.get(`/lab-tests/${id}`);
  },

  /** PUT /api/lab-tests/{id} — Update Lab Test */
  update: (id, data) => {
    return axiosInstance.put(`/lab-tests/${id}`, data);
  },

  /** DELETE /api/lab-tests/{id} — Delete Lab Test */
  remove: (id) => {
    return axiosInstance.delete(`/lab-tests/${id}`);
  },
};

export default labTestApi;
