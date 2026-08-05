import axiosInstance from './axios';

const bedApi = {
  getAll: () => axiosInstance.get('/beds'),
  getByRoom: (roomId) => axiosInstance.get(`/rooms/${roomId}/beds`),
  getAvailableByRoom: (roomId) => axiosInstance.get(`/rooms/${roomId}/beds/available`),
  getById: (id) => axiosInstance.get(`/beds/${id}`),
  create: (data) => axiosInstance.post('/beds', data),
  update: (id, data) => axiosInstance.put(`/beds/${id}`, data),
  delete: (id) => axiosInstance.delete(`/beds/${id}`),
};

export default bedApi;
