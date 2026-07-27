/**
 * Doctor Availability API
 * Endpoints for doctor-availability-controller per OpenAPI spec
 */
import axiosInstance from './axios';

const doctorAvailabilityApi = {
  /** POST /api/doctor-availability — Create Doctor Availability */
  create: (data) => {
    return axiosInstance.post('/doctor-availability', data);
  },

  /** GET /api/doctor-availability/{id} — View Doctor Availability by ID */
  getById: (id) => {
    return axiosInstance.get(`/doctor-availability/${id}`);
  },

  /** PUT /api/doctor-availability/{id} — Update Doctor Availability */
  update: (id, data) => {
    return axiosInstance.put(`/doctor-availability/${id}`, data);
  },

  /** DELETE /api/doctor-availability/{id} — Delete Doctor Availability */
  remove: (id) => {
    return axiosInstance.delete(`/doctor-availability/${id}`);
  },

  /** PUT /api/doctor-availability/{doctorId}/emergency — Mark Doctor Emergency Status */
  markEmergency: (doctorId) => {
    return axiosInstance.put(`/doctor-availability/${doctorId}/emergency`);
  },

  /** GET /api/doctor-availability/doctor/{doctorId} — Get Doctor Availability by Doctor ID */
  getByDoctor: (doctorId) => {
    return axiosInstance.get(`/doctor-availability/doctor/${doctorId}`);
  },

  /** GET /api/doctor-availability/date — Get Doctor Availability by Date */
  getByDate: (date) => {
    return axiosInstance.get('/doctor-availability/date', { params: { date } });
  },
};

export default doctorAvailabilityApi;
