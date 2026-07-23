/**
 * Symptoms API
 * Endpoints for fetching symptoms master list and getting department suggestions
 * OpenAPI Spec: symptom-controller
 *
 * NOTE: POST /api/symptoms/suggest is @PreAuthorize("hasRole('PATIENT')") only.
 * Calling it from a RECEPTIONIST session will return 403 Forbidden.
 */
import axiosInstance from './axios';

const symptomsApi = {
  /** GET /api/symptoms — Get all symptoms (any authenticated user) */
  getAll: () => {
    return axiosInstance.get('/symptoms');
  },

  /** POST /api/symptoms — Create a new symptom (ADMIN only) */
  create: (data) => {
    return axiosInstance.post('/symptoms', data);
  },

  /**
   * POST /api/symptoms/suggest — Suggest department & doctors based on symptom names
   * Request body: { symptomNames: ["Fever", "Headache"] }
   * Response: DepartmentSuggestResponse { departmentId, departmentName, floorNumber, availableDoctors: DoctorResponse[] }
   * @PreAuthorize("hasRole('PATIENT')") — PATIENT role required
   */
  suggest: (symptomNames) => {
    return axiosInstance.post('/symptoms/suggest', { symptomNames });
  },
};

export default symptomsApi;
