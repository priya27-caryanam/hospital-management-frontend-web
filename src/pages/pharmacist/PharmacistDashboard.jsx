/**
 * Pharmacist Dashboard Page
 * Displays pharmacy metrics using PharmacyDashboardResponse: totalMedicines, lowStockMedicines, totalDispensed
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Pill, AlertTriangle, CheckCircle, Package } from 'lucide-react';
import dashboardApi from '../../api/dashboardApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function PharmacistDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await dashboardApi.getPharmacyStats();
        setStats(res.data);
      } catch (err) {
        console.error('Failed to load pharmacy stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pharmacy Dashboard</h1>
        <p className="text-sm text-slate-500">Consolidated metrics for hospital pharmacy inventory & dispensing</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div
          onClick={() => navigate('/pharmacist/medicines')}
          className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 transition-transform group-hover:scale-105">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Total Medicines</p>
            <p className="text-2xl font-bold text-slate-900">{stats?.totalMedicines ?? 0}</p>
          </div>
        </div>

        <div
          onClick={() => navigate('/pharmacist/medicines')}
          className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600 transition-transform group-hover:scale-105">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Low Stock Medicines</p>
            <p className="text-2xl font-bold text-amber-600">{stats?.lowStockMedicines ?? 0}</p>
          </div>
        </div>

        <div
          onClick={() => navigate('/pharmacist/prescriptions')}
          className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 transition-transform group-hover:scale-105">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Total Dispensed</p>
            <p className="text-2xl font-bold text-emerald-600">{stats?.totalDispensed ?? 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
