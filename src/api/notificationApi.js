/**
 * Hospital Notification API
 * Endpoints matching HospitalNotificationController (/api/hospital-notifications)
 * PreAuthorize Roles: ADMIN, DOCTOR, PATIENT, RECEPTIONIST, LAB_TECHNICIAN, PHARMACIST
 */
import axiosInstance from './axios';

const notificationApi = {
  /** GET /api/hospital-notifications — Logged-in User Notifications */
  getMyNotifications: () => {
    return axiosInstance.get('/hospital-notifications');
  },

  /** GET /api/hospital-notifications/unread-count — Unread Notification Count */
  getUnreadCount: () => {
    return axiosInstance.get('/hospital-notifications/unread-count');
  },

  /** PUT /api/hospital-notifications/{id}/read — Mark single notification as read */
  markAsRead: (id) => {
    return axiosInstance.put(`/hospital-notifications/${id}/read`);
  },

  /** PUT /api/hospital-notifications/read-all — Mark all notifications as read */
  markAllAsRead: () => {
    return axiosInstance.put('/hospital-notifications/read-all');
  },

  /** DELETE /api/hospital-notifications/{id} — Delete single notification */
  deleteNotification: (id) => {
    return axiosInstance.delete(`/hospital-notifications/${id}`);
  },

  /** Backward compatibility aliases */
  getByPatient: () => axiosInstance.get('/hospital-notifications'),
};

export default notificationApi;
