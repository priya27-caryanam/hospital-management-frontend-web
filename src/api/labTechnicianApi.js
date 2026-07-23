/**
 * Lab Technician API
 * Endpoints for managing lab technicians and lab order payments/receipts
 * OpenAPI Spec: lab-technician-controller
 */
import axiosInstance from './axios';

const labTechnicianApi = {
  /** POST /api/lab-technicians — Create a new Lab Technician */
  create: (data) => {
    return axiosInstance.post('/lab-technicians', data);
  },

  /** GET /api/lab-technicians — Get all Lab Technicians */
  getAll: () => {
    return axiosInstance.get('/lab-technicians');
  },

  /** GET /api/lab-technicians/{id} — View Lab Technician details */
  getById: (id) => {
    return axiosInstance.get(`/lab-technicians/${id}`);
  },

  /** PUT /api/lab-technicians/{id} — Update Lab Technician details */
  update: (id, data) => {
    return axiosInstance.put(`/lab-technicians/${id}`, data);
  },

  /** DELETE /api/lab-technicians/{id} — Remove Lab Technician */
  remove: (id) => {
    return axiosInstance.delete(`/lab-technicians/${id}`);
  },

  /** POST /api/lab-technicians/payment/{labOrderId} — Process payment for Lab Order */
  processPayment: (labOrderId, data) => {
    return axiosInstance.post(`/lab-technicians/payment/${labOrderId}`, data);
  },

  /** GET /api/lab-technicians/receipt/{labOrderId} — Get receipt for Lab Order */
  getReceipt: (labOrderId) => {
    return axiosInstance.get(`/lab-technicians/receipt/${labOrderId}`);
  },
};

export default labTechnicianApi;
