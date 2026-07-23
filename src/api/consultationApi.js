/**
 * Consultation API
 * Endpoints for doctor consultations and appointment notes
 * OpenAPI Spec: consultation-controller
 */
import axiosInstance from './axios';

const consultationApi = {
  /** POST /api/consultations — Record a new consultation */
  create: (data) => {
    return axiosInstance.post('/consultations', data);
  },

  /** GET /api/consultations/appointment/{appointmentId} — View consultation by appointment */
  getByAppointment: (appointmentId) => {
    return axiosInstance.get(`/consultations/appointment/${appointmentId}`);
  },
};

export default consultationApi;
