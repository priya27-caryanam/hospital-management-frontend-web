/**
 * Medicine API
 * Endpoints for inventory management of medicines
 * OpenAPI Spec: medicine-controller
 */
import axiosInstance from './axios';

const medicineApi = {
  /** POST /api/medicines — Add a new medicine record */
  create: (data) => {
    return axiosInstance.post('/medicines', data);
  },

  /** GET /api/medicines — View all medicines */
  getAll: () => {
    return axiosInstance.get('/medicines');
  },

  /** GET /api/medicines/{id} — View Medicine details by ID */
  getById: (id) => {
    return axiosInstance.get(`/medicines/${id}`);
  },

  /** PUT /api/medicines/{id} — Update Medicine details */
  update: (id, data) => {
    return axiosInstance.put(`/medicines/${id}`, data);
  },

  /** DELETE /api/medicines/{id} — Delete Medicine record */
  remove: (id) => {
    return axiosInstance.delete(`/medicines/${id}`);
  },

  /** PUT /api/medicines/{id}/stock — Update stock quantity for Medicine */
  updateStock: (id, stockData) => {
    return axiosInstance.put(`/medicines/${id}/stock`, stockData);
  },
};

export default medicineApi;
