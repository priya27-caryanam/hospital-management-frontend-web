/**
 * Prescription API
 * Endpoints for generating, viewing, and updating prescriptions
 * OpenAPI Spec: prescription-controller
 */
import axiosInstance from './axios';

const prescriptionApi = {
  /** GET /api/prescriptions — Get all prescriptions */
  getAll: () => {
    return axiosInstance.get('/prescriptions');
  },

  /** POST /api/prescriptions — Add a Prescription */
  create: (data) => {
    return axiosInstance.post('/prescriptions', data);
  },

  /** GET /api/prescriptions/{id} — View Prescription by ID */
  getById: (id) => {
    return axiosInstance.get(`/prescriptions/${id}`);
  },

  /** GET /api/prescriptions/appointment/{appointmentId} — View Prescription by Appointment ID */
  getByAppointment: (appointmentId) => {
    return axiosInstance.get(`/prescriptions/appointment/${appointmentId}`);
  },

  /** PUT /api/prescriptions/{id}/status — Update Prescription Status */
  updateStatus: (id, status) => {
    return axiosInstance.put(`/prescriptions/${id}/status`, null, {
      params: { status },
    });
  },
};

export default prescriptionApi;
