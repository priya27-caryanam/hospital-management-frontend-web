/**
 * Symptoms Diagnostic Suggestion Page (Receptionist view)
 *
 * IMPORTANT ROLE NOTE:
 * POST /api/symptoms/suggest is @PreAuthorize("hasRole('PATIENT')") on the backend.
 * A RECEPTIONIST session will receive HTTP 403 Forbidden when calling this endpoint.
 * This page shows a clear warning and the symptom list is purely informational
 * for the receptionist to manually advise the patient.
 *
 * SymptomResponse DTO fields: { id, symptomName, departmentId, departmentName }
 * SymptomSuggestRequest DTO: { symptomNames: List<String> }
 * DepartmentSuggestResponse DTO: { departmentId, departmentName, floorNumber, availableDoctors: DoctorResponse[] }
 * DoctorResponse DTO: { id, firstName, lastName, specialization, consultationFee, experience, ... }
 */
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { HeartPulse, Check, AlertCircle, Info, Stethoscope } from 'lucide-react';
import symptomsApi from '../../api/symptomsApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function SymptomsSuggestion() {
  const [symptoms, setSymptoms] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [suggesting, setSuggesting] = useState(false);
  /** @type {DepartmentSuggestResponse | null} */
  const [suggestion, setSuggestion] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    const loadSymptoms = async () => {
      try {
        const res = await symptomsApi.getAll();
        setSymptoms(res.data || []);
      } catch (err) {
        toast.error('Failed to load symptoms master list');
      } finally {
        setLoading(false);
      }
    };
    loadSymptoms();
  }, []);

  const handleToggleSymptom = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const handleGetSuggestions = async () => {
    if (selectedIds.length === 0) {
      toast.error('Please select at least one symptom');
      return;
    }

    // Extract symptom names from selected IDs — backend requires symptomNames not IDs
    const symptomNames = selectedIds
      .map((id) => symptoms.find((s) => s.id === id)?.symptomName)
      .filter(Boolean);

    setSuggesting(true);
    setSuggestion(null);
    setAccessDenied(false);

    try {
      // POST /api/symptoms/suggest — { symptomNames: [...] }
      const res = await symptomsApi.suggest(symptomNames);
      // Response: DepartmentSuggestResponse { departmentId, departmentName, floorNumber, availableDoctors }
      setSuggestion(res.data);
      toast.success('Suggestion generated');
    } catch (err) {
      console.error(err);
      if (err.response?.status === 403) {
        setAccessDenied(true);
        toast.error('Access denied — suggestion is patient-only. Use the list below for manual guidance.');
      } else {
        toast.error(err.response?.data?.message || 'Failed to analyze symptoms');
      }
    } finally {
      setSuggesting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Symptoms Diagnostic Suggestion</h1>
        <p className="text-sm text-slate-500">
          Pick patient symptoms to get department and physician recommendations
        </p>
      </div>

      {/* Role restriction notice */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-amber-800">For Reference Only</p>
          <p className="text-amber-700 mt-0.5">
            The auto-suggest feature requires a Patient login. As a receptionist, use
            the symptom list below to manually determine the appropriate department and
            guide the patient to book via the self-service portal.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3 items-start">
        {/* Symptoms Selector */}
        <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
            <HeartPulse className="h-5 w-5 text-blue-600 animate-pulse-soft" />
            Pick Presenting Symptoms ({selectedIds.length} Selected)
          </h3>

          {symptoms.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 max-h-[50vh] overflow-y-auto pr-2">
              {symptoms.map((s) => {
                const isSelected = selectedIds.includes(s.id);
                return (
                  <div
                    key={s.id}
                    onClick={() => handleToggleSymptom(s.id)}
                    className={`flex items-start justify-between p-3.5 rounded-xl border cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="space-y-1">
                      {/* symptomName is the correct DTO field */}
                      <p className="text-sm font-semibold text-slate-800">{s.symptomName}</p>
                      {/* departmentName is available — show as a tag */}
                      {s.departmentName && (
                        <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-medium border bg-slate-50 text-slate-600 border-slate-200">
                          {s.departmentName}
                        </span>
                      )}
                    </div>
                    <div
                      className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border transition-all ${
                        isSelected ? 'border-blue-500 bg-blue-600 text-white' : 'border-slate-300 bg-transparent'
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-slate-400 py-6 text-center">No symptoms defined in database yet.</p>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={handleGetSuggestions}
              disabled={suggesting || selectedIds.length === 0}
              className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 transition-colors disabled:opacity-50"
            >
              {suggesting ? 'Analyzing...' : 'Get Suggestion'}
            </button>
          </div>
        </div>

        {/* Suggestion Results */}
        <div className="md:col-span-1 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Recommendations
            </h3>

            {suggesting && <LoadingSpinner />}

            {/* 403 access denied state */}
            {!suggesting && accessDenied && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 space-y-1">
                <p className="text-sm font-semibold text-rose-700">Access Restricted</p>
                <p className="text-xs text-rose-600">
                  Only patients can use the auto-suggest feature. Refer to the
                  symptom → department mapping visible in the list.
                </p>
              </div>
            )}

            {!suggesting && !suggestion && !accessDenied && (
              <div className="text-center py-8 text-slate-400 space-y-2">
                <AlertCircle className="h-8 w-8 mx-auto opacity-50" />
                <p className="text-sm font-semibold">Ready for diagnostics</p>
                <p className="text-xs">Select symptoms and click analyze.</p>
              </div>
            )}

            {/* DepartmentSuggestResponse result */}
            {!suggesting && suggestion && (
              <div className="space-y-6 animate-fade-in">
                {/* Suggested Department */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                    Suggested Department
                  </h4>
                  <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3.5">
                    <p className="font-bold text-slate-800 text-sm">{suggestion.departmentName}</p>
                    {suggestion.floorNumber != null && (
                      <p className="text-xs text-slate-500 mt-0.5">Floor: {suggestion.floorNumber}</p>
                    )}
                  </div>
                </div>

                {/* Available Doctors from availableDoctors[] */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                    Available Doctors
                  </h4>
                  {suggestion.availableDoctors?.length > 0 ? (
                    <div className="space-y-2">
                      {suggestion.availableDoctors.map((doc) => (
                        <div
                          key={doc.id}
                          className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center gap-3"
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white uppercase">
                            <Stethoscope className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">
                              Dr. {doc.firstName} {doc.lastName}
                            </p>
                            <p className="text-[10px] text-slate-500 font-semibold">
                              {doc.specialization}
                              {doc.consultationFee && ` | Fee: ₹${doc.consultationFee}`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">
                      No available specialist doctors at this time.
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
