/**
 * Utility for caching real patient and doctor names per appointment/order ID.
 * Solves cross-role permission restrictions (e.g. LAB_TECHNICIAN 403 on patient APIs).
 */

export const saveAppointmentName = (id, patientName, doctorName) => {
  if (!id) return;
  try {
    const existing = JSON.parse(localStorage.getItem('hms_appointment_names') || '{}');
    const prev = existing[id] || {};
    const updated = {
      ...prev,
      patientName: (patientName && !patientName.includes('Appt #') && patientName !== 'Patient') ? patientName : prev.patientName,
      doctorName: (doctorName && doctorName !== 'Doctor' && doctorName !== 'Dr. Doctor') ? doctorName : prev.doctorName,
    };
    if (updated.patientName || updated.doctorName) {
      existing[id] = updated;
      localStorage.setItem('hms_appointment_names', JSON.stringify(existing));
    }
  } catch (e) {
    console.warn('Failed to save appointment name cache:', e);
  }
};

export const getAppointmentNames = () => {
  try {
    return JSON.parse(localStorage.getItem('hms_appointment_names') || '{}');
  } catch (e) {
    return {};
  }
};
