import axiosInstance from './axios';

const roomApi = {
  getAll: () => axiosInstance.get('/rooms'),
  getByWard: (wardId) => axiosInstance.get(`/wards/${wardId}/rooms`),
  getById: (id) => axiosInstance.get(`/rooms/${id}`),
  create: (data) => axiosInstance.post('/rooms', data),
  update: (id, data) => axiosInstance.put(`/rooms/${id}`, data),
  delete: (id) => axiosInstance.delete(`/rooms/${id}`),
};

export default roomApi;
