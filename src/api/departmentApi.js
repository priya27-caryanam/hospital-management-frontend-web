/**
 * Department API
 * CRUD operations and Excel import for hospital departments
 */
import axiosInstance from './axios';

const departmentApi = {
  /** GET /api/departments — View all Departments */
  getAll: () => {
    return axiosInstance.get('/departments');
  },

  /** GET /api/departments/{id} — View Department by ID */
  getById: (id) => {
    return axiosInstance.get(`/departments/${id}`);
  },

  /** POST /api/departments — Add a new Department (ADMIN only) */
  create: (data) => {
    return axiosInstance.post('/departments', data);
  },

  /** PUT /api/departments/{id} — Update an existing Department (ADMIN only) */
  update: (id, data) => {
    return axiosInstance.put(`/departments/${id}`, data);
  },

  /** DELETE /api/departments/{id} — Delete an existing Department (ADMIN only) */
  remove: (id) => {
    return axiosInstance.delete(`/departments/${id}`);
  },

  /** POST /api/departments/import — Bulk Import Departments via Excel file */
  importExcel: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosInstance.post('/departments/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export default departmentApi;
