/**
 * Patient Admission (IPD) API Service
 * Handles API calls for admission requests, bed assignment, admit, discharge, and details
 */
import axiosInstance from './axios';

const admissionApi = {
  /** Create a new patient admission request (Status: REQUESTED) */
  createRequest: (data) => axiosInstance.post('/admissions/request', data),

  /** Get all patient admissions */
  getAll: () => axiosInstance.get('/admissions'),

  /** Get admission details by ID */
  getById: (id) => axiosInstance.get(`/admissions/${id}`),

  /** Assign Ward, Room, Bed, and Doctor to an admission (Status: BED_ASSIGNED) */
  assignBed: (id, data) => axiosInstance.put(`/admissions/${id}/assign-bed`, data),

  /** Admit patient (Status: ADMITTED) */
  admit: (id) => axiosInstance.put(`/admissions/${id}/admit`),

  /** Discharge patient and free assigned bed (Status: DISCHARGED) */
  discharge: (id) => axiosInstance.put(`/admissions/${id}/discharge`),
};

export default admissionApi;
