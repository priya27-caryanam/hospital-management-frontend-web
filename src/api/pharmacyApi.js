/**
 * Pharmacy API
 * Endpoints for pharmacy queue and dispensing medications
 * OpenAPI Spec: pharmacy-controller
 */
import axiosInstance from './axios';

const pharmacyApi = {
  /** GET /api/pharmacy/pending-prescriptions — View queue of pending prescriptions */
  getPendingPrescriptions: () => {
    return axiosInstance.get('/pharmacy/pending-prescriptions');
  },

  /** POST /api/pharmacy/dispense/{prescriptionId} — Dispense medication for prescription */
  dispense: (prescriptionId, data) => {
    const params = typeof data === 'object' && data?.pharmacistId ? { pharmacistId: data.pharmacistId } : (data ? { pharmacistId: data } : {});
    return axiosInstance.post(`/pharmacy/dispense/${prescriptionId}`, null, { params });
  },

  /** POST /api/pharmacy/payment/{prescriptionId} — Process pharmacy payment */
  payment: (prescriptionId, paymentMode) => {
    return axiosInstance.post(`/pharmacy/payment/${prescriptionId}`, { paymentMode });
  },

  /** GET /api/pharmacy/receipt/{prescriptionId} — Fetch pharmacy payment receipt */
  receipt: (prescriptionId) => {
    return axiosInstance.get(`/pharmacy/receipt/${prescriptionId}`);
  },
};

export default pharmacyApi;
