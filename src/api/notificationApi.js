/**
 * Notification API
 * Endpoints for notification-controller per OpenAPI spec
 */
import axiosInstance from './axios';

const notificationApi = {
  /** POST /api/notifications — Create a new Notification */
  create: (data) => {
    return axiosInstance.post('/notifications', data);
  },

  /** GET /api/notifications/patient/{patientId} — Get notifications for a patient */
  getByPatient: (patientId) => {
    return axiosInstance.get(`/notifications/patient/${patientId}`);
  },

  /** PUT /api/notifications/{notificationId}/read — Mark a single notification as read */
  markAsRead: (notificationId) => {
    return axiosInstance.put(`/notifications/${notificationId}/read`);
  },

  /** PUT /api/notifications/patient/{patientId}/read-all — Mark all notifications for a patient as read */
  markAllAsRead: (patientId) => {
    return axiosInstance.put(`/notifications/patient/${patientId}/read-all`);
  },
};

export default notificationApi;
