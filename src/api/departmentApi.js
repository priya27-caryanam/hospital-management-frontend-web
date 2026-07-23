/**
 * Department API
 * CRUD operations for hospital departments
 */
import axiosInstance from './axios';

const departmentApi = {
  /** POST /api/departments — Add a new Department (ADMIN only) */
  create: (data) => {
    return axiosInstance.post('/departments', data);
  },

  /** GET /api/departments — View all Departments (Any authenticated user) */
  getAll: () => {
    return axiosInstance.get('/departments');
  },

  /** GET /api/departments/{id} — View Department by ID (Any authenticated user) */
  getById: (id) => {
    return axiosInstance.get(`/departments/${id}`);
  },

  /** PUT /api/departments/{id} — Update an existing Department (ADMIN only) */
  update: (id, data) => {
    return axiosInstance.put(`/departments/${id}`, data);
  },

  /** DELETE /api/departments/{id} — Delete an existing Department (ADMIN only) */
  remove: (id) => {
    return axiosInstance.delete(`/departments/${id}`);
  },
};

export default departmentApi;
