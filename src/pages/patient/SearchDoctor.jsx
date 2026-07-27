/**
 * Search Doctor Page
 * Allows patient to filter doctors by selecting a department.
 */
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Stethoscope, Award, Phone, Wallet, GraduationCap } from 'lucide-react';
import departmentApi from '../../api/departmentApi';
import doctorApi from '../../api/doctorApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function SearchDoctor() {
  const [departments, setDepartments] = useState([]);
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDocs, setLoadingDocs] = useState(false);

  useEffect(() => {
    const loadDepts = async () => {
      try {
        const res = await departmentApi.getAll();
        setDepartments(res.data || []);
      } catch (err) {
        toast.error('Failed to load departments');
      } finally {
        setLoading(false);
      }
    };
    loadDepts();
  }, []);

  const handleDeptChange = async (e) => {
    const deptId = e.target.value;
    setSelectedDeptId(deptId);
    if (!deptId) {
      setDoctors([]);
      return;
    }

    setLoadingDocs(true);
    try {
      const res = await doctorApi.getByDepartment(deptId);
      setDoctors(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load doctor listings');
      setDoctors([]);
    } finally {
      setLoadingDocs(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Find Specialist Doctors</h1>
        <p className="text-sm text-slate-500">Filter doctor directory by selecting clinical departments</p>
      </div>

      {/* Select Box */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm max-w-md space-y-2">
        <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Select Medical Department</label>
        <select value={selectedDeptId} onChange={handleDeptChange}>
          <option value="">-- Choose a Department --</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.departmentName}
            </option>
          ))}
        </select>
      </div>

      {/* Doctor Cards Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Stethoscope className="h-5 w-5 text-blue-600" />
          Specialists Listing ({doctors.length})
        </h2>

        {loadingDocs ? (
          <LoadingSpinner />
        ) : doctors.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {doctors.map((doc) => (
              <div
                key={doc.id}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Doctor header */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold text-lg">
                      Dr
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm group-hover:text-blue-600 transition-colors">
                        Dr. {doc.name || `${doc.firstName} ${doc.lastName}`}
                      </h3>
                      <p className="text-xs font-semibold text-blue-600">{doc.specializationName || doc.specialization || doc.departmentName}</p>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-slate-400" />
                      <span>{doc.qualification || 'MBBS, MD'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-slate-400" />
                      <span>{doc.experience} Years Experience</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <span>{doc.mobile}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Consulting Fee</span>
                  <span className="text-sm font-bold text-slate-800 flex items-center gap-1">
                    <Wallet className="h-4 w-4 text-green-600" />
                    ${doc.consultationFee ?? '500.00'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          selectedDeptId && (
            <p className="text-sm text-slate-400 text-center py-12">No doctors currently registered under this department.</p>
          )
        )}
      </div>
    </div>
  );
}
