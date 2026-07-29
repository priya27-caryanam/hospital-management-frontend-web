/**
 * Billing API
 *
 * IMPORTANT: There is NO /api/billing controller in the backend.
 * Billing/payments are handled through:
 *   - Consultation payments: ReceptionistController (/api/receptionists/...)
 *   - Pharmacy payments:     PharmacyController    (/api/pharmacy/...)
 *
 * PaymentRequest DTO (backend): { paymentMode: "CASH" | "CARD" | "UPI" | "NET_BANKING" }
 * PaymentResponse DTO (backend): { paymentId, amount, paymentMode, paymentStatus, paymentType, transactionId, receiptNumber, paymentDate }
 * ReceiptResponse DTO (backend): { receiptNumber, transactionId, amount, paymentMode, paymentType, paymentStatus, paymentDate }
 */
import axiosInstance from './axios';

const billingApi = {
  /**
   * POST /api/receptionists/consultation-payment/{appointmentId}
   * Process consultation payment for a given appointment (RECEPTIONIST)
   * @param {number} appointmentId
   * @param {string} paymentMode - "CASH" | "CARD" | "UPI" | "NET_BANKING"
   * @returns {PaymentResponse}
   */
  consultationPayment: (appointmentId, paymentMode) => {
    return axiosInstance.post(
      `/receptionists/consultation-payment/${appointmentId}`,
      { paymentMode }
    );
  },

  /**
   * GET /api/receptionists/consultation-receipt/{appointmentId}
   * Fetch consultation payment receipt for a given appointment (RECEPTIONIST/PATIENT)
   * @param {number} appointmentId
   * @returns {ReceiptResponse}
   */
  consultationReceipt: (appointmentId) => {
    return axiosInstance.get(
      `/receptionists/consultation-receipt/${appointmentId}`
    );
  },

  /** Alias for consultationReceipt */
  getByAppointment: (appointmentId) => {
    return axiosInstance.get(
      `/receptionists/consultation-receipt/${appointmentId}`
    );
  },

  /**
   * POST /api/pharmacy/payment/{prescriptionId}
   * Process pharmacy/medicine payment for a given prescription (PHARMACIST)
   * @param {number} prescriptionId
   * @param {string} paymentMode - "CASH" | "CARD" | "UPI" | "NET_BANKING"
   * @returns {PaymentResponse}
   */
  pharmacyPayment: (prescriptionId, paymentMode) => {
    return axiosInstance.post(
      `/pharmacy/payment/${prescriptionId}`,
      { paymentMode }
    );
  },

  /**
   * GET /api/pharmacy/receipt/{prescriptionId}
   * Fetch pharmacy payment receipt for a given prescription (PHARMACIST/PATIENT)
   * @param {number} prescriptionId
   * @returns {ReceiptResponse}
   */
  pharmacyReceipt: (prescriptionId) => {
    return axiosInstance.get(`/pharmacy/receipt/${prescriptionId}`);
  },

  /**
   * POST /api/lab-technicians/payment/{labOrderId}
   * Process laboratory payment for a given lab order (LAB_TECHNICIAN)
   * @param {number} labOrderId
   * @param {string} paymentMode - "CASH" | "CARD" | "UPI" | "NET_BANKING"
   * @returns {PaymentResponse}
   */
  labPayment: (labOrderId, paymentMode) => {
    return axiosInstance.post(
      `/lab-technicians/payment/${labOrderId}`,
      { paymentMode }
    );
  },

  /**
   * GET /api/lab-technicians/receipt/{labOrderId}
   * Fetch laboratory payment receipt for a given lab order (LAB_TECHNICIAN/PATIENT)
   * @param {number} labOrderId
   * @returns {ReceiptResponse}
   */
  labReceipt: (labOrderId) => {
    return axiosInstance.get(`/lab-technicians/receipt/${labOrderId}`);
  },
};

export default billingApi;
