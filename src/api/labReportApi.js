/**
 * Lab Report API
 * Endpoints for managing lab diagnostic reports
 * OpenAPI Spec: LabReportController (/api/lab-reports)
 */
import axiosInstance from './axios';
import toast from 'react-hot-toast';

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

  /** GET /api/lab-reports/{id}/download — Download/View lab report file (DOCTOR, PATIENT, LAB_TECHNICIAN) */
  download: (id) => {
    return axiosInstance.get(`/lab-reports/${id}/download`, {
      responseType: 'blob',
    });
  },
};

/** Utility helper for downloading / viewing lab report in browser tab */
export const downloadReportFile = async (reportId, filename = 'lab_report.pdf') => {
  if (!reportId) {
    toast.error('Lab report ID is missing');
    return;
  }
  try {
    const res = await labReportApi.download(reportId);
    const contentType = res.headers['content-type'] || 'application/pdf';
    const blob = new Blob([res.data], { type: contentType });
    const url = window.URL.createObjectURL(blob);

    // Open in new browser tab for inline viewing
    const newTab = window.open(url, '_blank');
    if (!newTab) {
      // Fallback: trigger download link if popups blocked
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
    toast.success('Lab report opened successfully');
  } catch (err) {
    console.error('Failed to download lab report file:', err);
    toast.error(err.response?.data?.message || 'Failed to download or view lab report file.');
  }
};

export default labReportApi;
