/**
 * PatientSymptomChecker Page (Patient)
 *
 * Implements GET /api/symptoms and POST /api/symptoms/suggest
 * Swagger Request Schema: { symptomNames: ["Fever", "Headache"] }
 * Swagger Response Schema (SymptomSuggestionResponse):
 *   {
 *     departmentId, departmentName, floorNumber,
 *     availableDoctors: [
 *       { id, firstName, lastName, email, mobile, departmentName, qualification, gender, experience, specialization, consultationFee, available, profileImage, role, status, licenseNumber }
 *     ]
 *   }
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  HeartPulse,
  Check,
  Stethoscope,
  Building2,
  Phone,
  Mail,
  GraduationCap,
  Award,
  Wallet,
  Calendar,
  AlertCircle,
  BadgeCheck,
} from 'lucide-react';
import symptomsApi from '../../api/symptomsApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function PatientSymptomChecker() {
  const navigate = useNavigate();
  const [symptoms, setSymptoms] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  // Suggestion Result state
  const [suggestion, setSuggestion] = useState(null);

  useEffect(() => {
    const fetchSymptoms = async () => {
      try {
        const res = await symptomsApi.getAll();
        setSymptoms(res.data || []);
      } catch (err) {
        toast.error('Failed to load symptoms list');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSymptoms();
  }, []);

  const toggleSymptom = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  /** Handle POST /api/symptoms/suggest */
  const handleAnalyzeSymptoms = async () => {
    if (selectedIds.length === 0) {
      toast.error('Please select at least one symptom');
      return;
    }

    const symptomNames = selectedIds
      .map((id) => symptoms.find((s) => s.id === id)?.symptomName)
      .filter(Boolean);

    setAnalyzing(true);
    setSuggestion(null);
    try {
      const res = await symptomsApi.suggest(symptomNames);
      setSuggestion(res.data);
      toast.success('Department & doctor recommendations generated!');
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to get symptom suggestion');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <HeartPulse className="h-7 w-7 text-blue-600 animate-pulse-soft" />
          Symptom Checker & Doctor Suggestion
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Select your symptoms to receive instant department and specialist recommendations
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 items-start">
        {/* Left Column: Symptoms Selector */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-800">
              Select Your Presenting Symptoms ({selectedIds.length} Selected)
            </h3>
            {selectedIds.length > 0 && (
              <button
                onClick={() => setSelectedIds([])}
                className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
              >
                Clear Selection
              </button>
            )}
          </div>

          {symptoms.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 max-h-[55vh] overflow-y-auto pr-2">
              {symptoms.map((s) => {
                const isSelected = selectedIds.includes(s.id);
                return (
                  <div
                    key={s.id}
                    onClick={() => toggleSymptom(s.id)}
                    className={`flex items-start justify-between p-3.5 rounded-xl border cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/60 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-800">{s.symptomName}</p>
                      {s.departmentName && (
                        <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-medium border bg-slate-50 text-slate-600 border-slate-200">
                          {s.departmentName}
                        </span>
                      )}
                    </div>
                    <div
                      className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-600 text-white'
                          : 'border-slate-300 bg-transparent'
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-400 py-10 text-center">No symptoms registered in system yet.</p>
          )}

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              onClick={handleAnalyzeSymptoms}
              disabled={analyzing || selectedIds.length === 0}
              className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold px-7 py-2.5 transition-colors disabled:opacity-50 text-sm shadow-sm"
            >
              {analyzing ? 'Analyzing Symptoms...' : 'Analyze Symptoms & Find Doctors'}
            </button>
          </div>
        </div>

        {/* Right Column: Suggestion Results */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Diagnostic Recommendations
            </h3>

            {analyzing && <LoadingSpinner />}

            {!analyzing && !suggestion && (
              <div className="text-center py-10 text-slate-400 space-y-2">
                <AlertCircle className="h-8 w-8 mx-auto opacity-50 text-blue-500" />
                <p className="text-sm font-semibold">Ready for Analysis</p>
                <p className="text-xs">Pick symptoms from the left panel and click Analyze.</p>
              </div>
            )}

            {!analyzing && suggestion && (
              <div className="space-y-5 animate-fade-in">
                {/* Department Info */}
                <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-blue-700 font-bold text-xs uppercase tracking-wider">
                    <Building2 className="h-4 w-4" />
                    Recommended Department
                  </div>
                  <p className="text-base font-bold text-slate-900">{suggestion.departmentName || 'General Medicine'}</p>
                  <div className="flex justify-between text-xs text-slate-600 pt-1 border-t border-blue-100">
                    <span>Dept ID: #{suggestion.departmentId}</span>
                    <span>Floor: {suggestion.floorNumber != null ? `#${suggestion.floorNumber}` : 'Ground'}</span>
                  </div>
                </div>

                {/* Available Doctors List */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Available Specialists ({suggestion.availableDoctors?.length || 0})
                  </h4>

                  {suggestion.availableDoctors?.length > 0 ? (
                    <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1">
                      {suggestion.availableDoctors.map((doc) => (
                        <div
                          key={doc.id}
                          className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2 text-xs hover:border-blue-300 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold">
                                <Stethoscope className="h-4 w-4" />
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 text-sm">
                                  Dr. {doc.firstName} {doc.lastName}
                                </p>
                                <p className="text-blue-600 font-semibold">{doc.specialization || doc.departmentName}</p>
                              </div>
                            </div>
                            {doc.available !== undefined && (
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  doc.available ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                                }`}
                              >
                                {doc.available ? 'Available' : 'Unavailable'}
                              </span>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-2 border-t border-slate-200/60">
                            <div>
                              <span className="text-slate-400 font-medium">Qualification:</span>
                              <p className="font-semibold text-slate-800">{doc.qualification || 'MBBS, MD'}</p>
                            </div>
                            <div>
                              <span className="text-slate-400 font-medium">Experience:</span>
                              <p className="font-semibold text-slate-800">{doc.experience} Years</p>
                            </div>
                            <div>
                              <span className="text-slate-400 font-medium">Email / Mobile:</span>
                              <p className="font-semibold text-slate-800">{doc.mobile || doc.email || '—'}</p>
                            </div>
                            <div>
                              <span className="text-slate-400 font-medium">Consulting Fee:</span>
                              <p className="font-semibold text-emerald-700">₹{doc.consultationFee ?? '500'}</p>
                            </div>
                            {doc.licenseNumber && (
                              <div className="col-span-2">
                                <span className="text-slate-400 font-medium">License #:</span>
                                <span className="font-bold text-slate-700 ml-1">{doc.licenseNumber}</span>
                              </div>
                            )}
                          </div>

                          <button
                            onClick={() => navigate('/patient/book-appointment')}
                            className="w-full mt-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1.5 text-xs transition-colors flex items-center justify-center gap-1"
                          >
                            <Calendar className="h-3.5 w-3.5" />
                            Book Appointment
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic text-center py-4">
                      No matching available doctors at this time.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
