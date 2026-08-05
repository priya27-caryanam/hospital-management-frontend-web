import axiosInstance from './axios';

const wardApi = {
  getAll: () => axiosInstance.get('/wards'),
  getActive: () => axiosInstance.get('/wards/active'),
  getActiveWards: () => axiosInstance.get('/wards/active'),
  getById: (id) => axiosInstance.get(`/wards/${id}`),
  create: (data) => axiosInstance.post('/wards', data),
  update: (id, data) => axiosInstance.put(`/wards/${id}`, data),
  delete: (id) => axiosInstance.delete(`/wards/${id}`),
};

export default wardApi;
