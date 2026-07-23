/**
 * Appointment API
 * Endpoints for booking, tracking, and workflow transitions of appointments
 * OpenAPI Spec: appointment-controller
 */
import axiosInstance from './axios';

const appointmentApi = {
  /** POST /api/appointments — Book an Appointment */
  create: (data) => {
    return axiosInstance.post('/appointments', data);
  },

  /** GET /api/appointments/{id} — Get Appointment details by ID */
  getById: (id) => {
    return axiosInstance.get(`/appointments/${id}`);
  },

  /** GET /api/appointments/patient/{patientId} — Get all Appointments of a Patient */
  getByPatient: (patientId) => {
    return axiosInstance.get(`/appointments/patient/${patientId}`);
  },

  /** GET /api/appointments/doctor/{doctorId} — Get all Appointments of a Doctor */
  getByDoctor: (doctorId) => {
    return axiosInstance.get(`/appointments/doctor/${doctorId}`);
  },

  /** GET /api/appointments/doctor/{doctorId}/pending — Get Pending Appointments */
  getPendingAppointments: (doctorId) => {
    return axiosInstance.get(`/appointments/doctor/${doctorId}/pending`);
  },

  /** GET /api/appointments/doctor/{doctorId}/approved — Get Approved Appointments */
  getApprovedAppointments: (doctorId) => {
    return axiosInstance.get(`/appointments/doctor/${doctorId}/approved`);
  },

  /** GET /api/appointments/doctor/{doctorId}/completed — Get Completed Appointments */
  getCompletedAppointments: (doctorId) => {
    return axiosInstance.get(`/appointments/doctor/${doctorId}/completed`);
  },

  /** PUT /api/appointments/{id}/approve — Approve Appointment */
  approve: (id) => {
    return axiosInstance.put(`/appointments/${id}/approve`);
  },

  /** PUT /api/appointments/{id}/reject — Reject Appointment */
  reject: (id) => {
    return axiosInstance.put(`/appointments/${id}/reject`);
  },

  /** PUT /api/appointments/{id}/consultation-completed — Mark Consultation Completed */
  consultationCompleted: (id) => {
    return axiosInstance.put(`/appointments/${id}/consultation-completed`);
  },

  /** PUT /api/appointments/{id}/complete — Complete Appointment */
  complete: (id) => {
    return axiosInstance.put(`/appointments/${id}/complete`);
  },

  /** GET /api/appointments/available-slots — Get available slots for doctor on date */
  getAvailableSlots: (doctorId, date) => {
    return axiosInstance.get('/appointments/available-slots', { params: { doctorId, date } });
  },

  /** PUT /api/appointments/{id}/status — Update appointment status */
  updateStatus: (id, status) => {
    return axiosInstance.put(`/appointments/${id}/status`, null, { params: { status } });
  },
};

export default appointmentApi;
