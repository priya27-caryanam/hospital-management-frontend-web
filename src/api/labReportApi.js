/**
 * Lab Report API
 * Endpoints for managing lab diagnostic reports
 * OpenAPI Spec: LabReportController (/api/lab-reports)
 */
import axiosInstance from './axios';

const labReportApi = {
  /**
   * POST /api/lab-reports/upload (multipart/form-data)
   * Query / Request Params: labOrderId, report, file
   */
  upload: (labOrderId, report, file) => {
    let formData = new FormData();
    formData.append('labOrderId', labOrderId);
    formData.append('report', report);
    if (file) {
      formData.append('file', file);
    }
    return axiosInstance.post('/lab-reports/upload', formData, {
      params: { labOrderId, report },
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /** GET /api/lab-reports/order/{labOrderId} — Get lab report by lab order ID */
  getByLabOrder: (labOrderId) => {
    return axiosInstance.get(`/lab-reports/order/${labOrderId}`);
  },

  /** GET /api/lab-reports/doctor/{doctorId} — Get lab reports for a doctor */
  getByDoctor: (doctorId) => {
    return axiosInstance.get(`/lab-reports/doctor/${doctorId}`);
  },

  /** GET /api/lab-reports/patient/{patientId} — Get lab reports for a patient */
  getByPatient: (patientId) => {
    return axiosInstance.get(`/lab-reports/patient/${patientId}`);
  },

  /** GET /api/lab-reports/lab-technician/{labTechnicianId} — Get reports uploaded by lab technician */
  getByLabTechnician: (labTechnicianId) => {
    return axiosInstance.get(`/lab-reports/lab-technician/${labTechnicianId}`);
  },

  /** PUT /api/lab-reports/{id}/review — Doctor review report */
  review: (id, reviewData) => {
    return axiosInstance.put(`/lab-reports/${id}/review`, reviewData);
  },
};

export default labReportApi;
