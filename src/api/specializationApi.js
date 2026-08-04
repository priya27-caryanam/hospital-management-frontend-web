/**
 * Specialization API
 * Endpoints for specialization-controller per OpenAPI spec including Excel import
 */
import axiosInstance from './axios';

const specializationApi = {
  /** GET /api/specializations — View all Specializations */
  getAll: () => {
    return axiosInstance.get('/specializations');
  },

  /** GET /api/specializations/{id} — View Specialization by ID */
  getById: (id) => {
    return axiosInstance.get(`/specializations/${id}`);
  },

  /** POST /api/specializations — Create Specialization */
  create: (data) => {
    return axiosInstance.post('/specializations', data);
  },

  /** PUT /api/specializations/{id} — Update Specialization */
  update: (id, data) => {
    return axiosInstance.put(`/specializations/${id}`, data);
  },

  /** DELETE /api/specializations/{id} — Delete Specialization */
  remove: (id) => {
    return axiosInstance.delete(`/specializations/${id}`);
  },

  /** GET /api/specializations/department/{departmentId} — Get Specializations by Department */
  getByDepartment: (departmentId) => {
    return axiosInstance.get(`/specializations/department/${departmentId}`);
  },

  /** POST /api/specializations/import — Bulk Import Specializations via Excel file */
  importExcel: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axiosInstance.post('/specializations/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export default specializationApi;
