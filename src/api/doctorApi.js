/**
 * Doctor API
 * Endpoints for viewing doctor profiles and department listings
 */
import axiosInstance from './axios';

const doctorApi = {
  /** GET /api/doctors/{id} — View Doctor profile details (DOCTOR/ADMIN/RECEPTIONIST) */
  getById: (id) => {
    return axiosInstance.get(`/doctors/${id}`);
  },

  /** GET /api/doctors/department/{departmentId} — Get Doctors by Department (Any authenticated user) */
  getByDepartment: (departmentId) => {
    return axiosInstance.get(`/doctors/department/${departmentId}`);
  },
};

export default doctorApi;
