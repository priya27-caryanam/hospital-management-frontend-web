/**
 * Doctor API
 * Endpoints for viewing doctor profiles, department, specialization, and availability listings.
 * APIs:
 *   - GET /api/doctors?department={departmentId}&specialization={specializationId}
 *   - GET /api/doctors/available?date={date}&departmentId={departmentId}&specializationId={specializationId}
 *   - GET /api/doctors/all
 *   - GET /api/doctors/{id}
 */
import axiosInstance from './axios';

/** Mock Fallback Doctors with all availability statuses */
export const MOCK_DOCTORS = [
  // Cardiology -> Cardiologist (101)
  {
    id: 1,
    name: 'Dr. John Doe',
    firstName: 'John',
    lastName: 'Doe',
    department: 'Cardiology',
    departmentId: 1,
    specialization: 'Cardiologist',
    specializationId: 101,
    availabilityStatus: 'AVAILABLE',
    experience: 12,
    consultationFee: 800,
  },
  {
    id: 2,
    name: 'Dr. Sachin Patil',
    firstName: 'Sachin',
    lastName: 'Patil',
    department: 'Cardiology',
    departmentId: 1,
    specialization: 'Cardiologist',
    specializationId: 101,
    availabilityStatus: 'UNAVAILABLE',
    experience: 11,
    consultationFee: 900,
  },
  {
    id: 3,
    name: 'Dr. Priya Sharma',
    firstName: 'Priya',
    lastName: 'Sharma',
    department: 'Cardiology',
    departmentId: 1,
    specialization: 'Cardiologist',
    specializationId: 101,
    availabilityStatus: 'BUSY',
    experience: 9,
    consultationFee: 750,
  },
  // Cardiology -> Interventional Cardiologist (102)
  {
    id: 4,
    name: 'Dr. Rahul Patil',
    firstName: 'Rahul',
    lastName: 'Patil',
    department: 'Cardiology',
    departmentId: 1,
    specialization: 'Interventional Cardiologist',
    specializationId: 102,
    availabilityStatus: 'AVAILABLE',
    experience: 14,
    consultationFee: 1200,
  },
  {
    id: 5,
    name: 'Dr. Kiran Joshi',
    firstName: 'Kiran',
    lastName: 'Joshi',
    department: 'Cardiology',
    departmentId: 1,
    specialization: 'Interventional Cardiologist',
    specializationId: 102,
    availabilityStatus: 'EMERGENCY_LEAVE',
    experience: 10,
    consultationFee: 950,
  },
  // Cardiology -> Cardiac Electrophysiologist (103)
  {
    id: 6,
    name: 'Dr. Neha Kulkarni',
    firstName: 'Neha',
    lastName: 'Kulkarni',
    department: 'Cardiology',
    departmentId: 1,
    specialization: 'Cardiac Electrophysiologist',
    specializationId: 103,
    availabilityStatus: 'ON_DUTY',
    experience: 8,
    consultationFee: 850,
  },
  {
    id: 7,
    name: 'Dr. Raj Shah',
    firstName: 'Raj',
    lastName: 'Shah',
    department: 'Cardiology',
    departmentId: 1,
    specialization: 'Cardiac Electrophysiologist',
    specializationId: 103,
    availabilityStatus: 'OFF_DUTY',
    experience: 11,
    consultationFee: 900,
  },
  // Neurology -> Neurologist (201)
  {
    id: 8,
    name: 'Dr. Vikram Seth',
    firstName: 'Vikram',
    lastName: 'Seth',
    department: 'Neurology',
    departmentId: 2,
    specialization: 'Neurologist',
    specializationId: 201,
    availabilityStatus: 'AVAILABLE',
    experience: 16,
    consultationFee: 1100,
  },
  {
    id: 9,
    name: 'Dr. Ananya Sen',
    firstName: 'Ananya',
    lastName: 'Sen',
    department: 'Neurology',
    departmentId: 2,
    specialization: 'Neurologist',
    specializationId: 201,
    availabilityStatus: 'BUSY',
    experience: 7,
    consultationFee: 700,
  },
  // Neurology -> Neurosurgeon (202)
  {
    id: 10,
    name: 'Dr. Sanjay Verma',
    firstName: 'Sanjay',
    lastName: 'Verma',
    department: 'Neurology',
    departmentId: 2,
    specialization: 'Neurosurgeon',
    specializationId: 202,
    availabilityStatus: 'ON_DUTY',
    experience: 18,
    consultationFee: 1500,
  },
  {
    id: 11,
    name: 'Dr. Meera Nambiar',
    firstName: 'Meera',
    lastName: 'Nambiar',
    department: 'Neurology',
    departmentId: 2,
    specialization: 'Neurosurgeon',
    specializationId: 202,
    availabilityStatus: 'UNAVAILABLE',
    experience: 13,
    consultationFee: 1250,
  },
  // Orthopedics -> Orthopedic Surgeon (301)
  {
    id: 12,
    name: 'Dr. Rajesh Kumar',
    firstName: 'Rajesh',
    lastName: 'Kumar',
    department: 'Orthopedics',
    departmentId: 3,
    specialization: 'Orthopedic Surgeon',
    specializationId: 301,
    availabilityStatus: 'AVAILABLE',
    experience: 11,
    consultationFee: 850,
  },
  {
    id: 13,
    name: 'Dr. Sunita Rao',
    firstName: 'Sunita',
    lastName: 'Rao',
    department: 'Orthopedics',
    departmentId: 3,
    specialization: 'Orthopedic Surgeon',
    specializationId: 301,
    availabilityStatus: 'EMERGENCY_LEAVE',
    experience: 14,
    consultationFee: 950,
  },
  // Orthopedics -> Joint Replacement Specialist (302)
  {
    id: 14,
    name: 'Dr. Alok Deshmukh',
    firstName: 'Alok',
    lastName: 'Deshmukh',
    department: 'Orthopedics',
    departmentId: 3,
    specialization: 'Joint Replacement Specialist',
    specializationId: 302,
    availabilityStatus: 'ON_DUTY',
    experience: 15,
    consultationFee: 1300,
  },
  // Pediatrics -> General Pediatrician (401)
  {
    id: 15,
    name: 'Dr. Pooja Mehta',
    firstName: 'Pooja',
    lastName: 'Mehta',
    department: 'Pediatrics',
    departmentId: 4,
    specialization: 'General Pediatrician',
    specializationId: 401,
    availabilityStatus: 'AVAILABLE',
    experience: 8,
    consultationFee: 600,
  },
];

/**
 * Helper to normalize doctor object format
 */
export const normalizeDoctor = (doc) => {
  if (!doc) return null;
  const name =
    doc.name ||
    (doc.firstName ? `Dr. ${doc.firstName} ${doc.lastName || ''}`.trim() : `Doctor #${doc.id}`);
  const department =
    typeof doc.department === 'string'
      ? doc.department
      : doc.departmentName || doc.department?.departmentName || 'General Medicine';
  const departmentId = doc.departmentId || doc.department?.id || null;
  const specialization =
    typeof doc.specialization === 'string'
      ? doc.specialization
      : doc.specializationName || doc.specialization?.specializationName || 'Specialist';
  const specializationId = doc.specializationId || doc.specialization?.id || null;
  let availabilityStatus = (doc.availabilityStatus || doc.status || 'AVAILABLE').toUpperCase();
  if (availabilityStatus === 'ACTIVE') availabilityStatus = 'AVAILABLE';
  if (availabilityStatus === 'INACTIVE') availabilityStatus = 'OFF_DUTY';
  const experience = doc.experience ?? 10;
  const consultationFee = doc.consultationFee ?? 800;

  return {
    ...doc,
    id: doc.id,
    name,
    department,
    departmentId,
    specialization,
    specializationId,
    availabilityStatus,
    experience,
    consultationFee,
  };
};

/**
 * GET /api/doctors/available?date={date}&departmentId={departmentId}&specializationId={specializationId}
 * Fetches available doctors for selected date, department, and specialization
 */
export const getAvailableDoctors = (date, departmentId, specializationId) => {
  return axiosInstance.get('/doctors/available', {
    params: {
      date,
      departmentId,
      specializationId,
    },
  });
};

/**
 * Fetch doctors using GET /api/doctors?department={departmentId}&specialization={specializationId}
 * Filters by Department and Specialization.
 */
export const getDoctors = async (departmentId, specializationId, specializationName = '') => {
  try {
    const res = await axiosInstance.get('/doctors', {
      params: {
        department: departmentId,
        specialization: specializationId,
        departmentId,
        specializationId,
      },
    });
    const list = Array.isArray(res.data) ? res.data : (res.data?.data || res.data?.content || []);
    if (list.length > 0) {
      return { data: list.map(normalizeDoctor) };
    }
  } catch (err) {
    // API failed or 404, fallback to local mock filtering
  }

  // Fallback local filtering from MOCK_DOCTORS
  const filtered = MOCK_DOCTORS.filter((doc) => {
    const deptMatch =
      !departmentId ||
      String(doc.departmentId) === String(departmentId) ||
      doc.department.toLowerCase() === String(departmentId).toLowerCase();

    const specMatch =
      !specializationId ||
      String(doc.specializationId) === String(specializationId) ||
      doc.specialization.toLowerCase() === String(specializationId).toLowerCase() ||
      (specializationName &&
        doc.specialization.toLowerCase().includes(specializationName.toLowerCase()));

    return deptMatch && specMatch;
  });

  return { data: filtered.map(normalizeDoctor) };
};

/**
 * GET /api/doctors/all — Get All Doctors (Open Access)
 */
export const getAllDoctors = () => {
  return axiosInstance.get('/doctors/all');
};

const doctorApi = {
  getAvailableDoctors,
  getDoctors,

  /** GET /api/doctors/all — Get All Doctors */
  getAll: () => {
    return axiosInstance.get('/doctors/all');
  },

  /** Alias for getAllDoctors */
  getAllDoctors,

  /** GET /api/doctors/{id} — Fetch doctor profile details by ID */
  getById: (id) => {
    return axiosInstance.get(`/doctors/${id}`);
  },

  /** GET /api/doctors/all — Get Doctors by department filter */
  getByDepartment: async (departmentId) => {
    try {
      const res = await axiosInstance.get('/doctors/all');
      const list = Array.isArray(res.data) ? res.data : (res.data?.data || res.data?.content || []);
      if (!departmentId) return { data: list.map(normalizeDoctor) };
      const filtered = list.filter(
        (d) =>
          String(d.departmentId) === String(departmentId) ||
          String(d.department?.id) === String(departmentId)
      );
      if (filtered.length > 0) {
        return { data: filtered.map(normalizeDoctor) };
      }
    } catch (err) {
      // fallback
    }

    const mockFiltered = MOCK_DOCTORS.filter(
      (d) => String(d.departmentId) === String(departmentId)
    );
    return { data: mockFiltered.map(normalizeDoctor) };
  },

  /** Alias for getDoctors for backward compatibility */
  getByDepartmentAndSpecialization: (departmentId, specializationId, specializationName = '') => {
    return getDoctors(departmentId, specializationId, specializationName);
  },
};

export default doctorApi;

