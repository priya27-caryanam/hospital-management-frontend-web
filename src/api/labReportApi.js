/**
 * Lab Report API
 * Endpoints for managing lab diagnostic reports
 * OpenAPI Spec: lab-report-controller
 */
import axiosInstance from './axios';

const labReportApi = {
  /** POST /api/lab-reports/upload — Upload a lab report */
  upload: (labOrderId, report, file) => {
    let formData;
    if (labOrderId instanceof FormData) {
      formData = labOrderId;
    } else {
      formData = new FormData();
      formData.append('labOrderId', labOrderId);
      formData.append('report', report);
      formData.append('file', file);
    }
    return axiosInstance.post('/lab-reports/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /** PUT /api/lab-reports/{id}/review — Review/Approve a lab report */
  review: (id, reviewData) => {
    return axiosInstance.put(`/lab-reports/${id}/review`, reviewData);
  },

  /** GET /api/lab-reports/order/{labOrderId} — Get lab reports for a lab order */
  getByLabOrder: (labOrderId) => {
    return axiosInstance.get(`/lab-reports/order/${labOrderId}`);
  },
};

export default labReportApi;
