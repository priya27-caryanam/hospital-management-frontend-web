/**
 * Receptionist API
 * Endpoints for managing receptionists and receptionist profiles
 * OpenAPI Spec: receptionist-controller
 */
import axiosInstance from './axios';

const receptionistApi = {
  /** POST /api/receptionists — Create/Register a new receptionist */
  create: (data) => {
    return axiosInstance.post('/receptionists', data);
  },

  /** GET /api/receptionists — View all receptionists */
  getAll: () => {
    return axiosInstance.get('/receptionists');
  },

  /** GET /api/receptionists/{id} — View Receptionist profile details */
  getById: (id) => {
    return axiosInstance.get(`/receptionists/${id}`);
  },

  /** PUT /api/receptionists/{id} — Update Receptionist details */
  update: (id, data) => {
    return axiosInstance.put(`/receptionists/${id}`, data);
  },

  /** DELETE /api/receptionists/{id} — Remove Receptionist */
  remove: (id) => {
    return axiosInstance.delete(`/receptionists/${id}`);
  },

  /** POST /api/receptionists/register/patients — Register offline patient (RECEPTIONIST) */
  registerPatient: (patientData) => {
    return axiosInstance.post('/receptionists/register/patients', patientData);
  },

  /** POST /api/receptionists/consultation-payment/{appointmentId} — Process consultation payment */
  consultationPayment: (appointmentId, paymentMode) => {
    return axiosInstance.post(`/receptionists/consultation-payment/${appointmentId}`, { paymentMode });
  },

  /** GET /api/receptionists/consultation-receipt/{appointmentId} — Get consultation receipt */
  consultationReceipt: (appointmentId) => {
    return axiosInstance.get(`/receptionists/consultation-receipt/${appointmentId}`);
  },
};

export default receptionistApi;




