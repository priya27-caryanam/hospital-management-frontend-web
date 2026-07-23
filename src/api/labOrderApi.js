/**
 * Lab Order API
 * Endpoints for creating and managing lab orders
 */
import axiosInstance from './axios';

const labOrderApi = {
  /** POST /api/lab-orders — Create a new Lab Order */
  create: (data) => {
    return axiosInstance.post('/lab-orders', data);
  },

  /** GET /api/lab-orders/{id} — Get Lab Order details by ID */
  getById: (id) => {
    return axiosInstance.get(`/lab-orders/${id}`);
  },

  /** GET /api/lab-orders/appointment/{appointmentId} — Get Lab Orders by Appointment ID */
  getByAppointment: (appointmentId) => {
    return axiosInstance.get(`/lab-orders/appointment/${appointmentId}`);
  },

  /** GET /api/lab-orders/doctor/{doctorId} — Get Lab Orders by Doctor ID */
  getByDoctor: (doctorId) => {
    return axiosInstance.get(`/lab-orders/doctor/${doctorId}`);
  },

  /** GET /api/lab-orders/patient/{patientId} — Get Lab Orders by Patient ID */
  getByPatient: (patientId) => {
    return axiosInstance.get(`/lab-orders/patient/${patientId}`);
  },

  /** GET /api/lab-orders/status?status=X — Get Lab Orders by status (query param) */
  getByStatus: (status) => {
    return axiosInstance.get('/lab-orders/status', { params: { status } });
  },

  /** PUT /api/lab-orders/{id}/status — Update Lab Order status */
  updateStatus: (id, status) => {
    return axiosInstance.put(`/lab-orders/${id}/status`, null, { params: { status } });
  },
};

export default labOrderApi;
