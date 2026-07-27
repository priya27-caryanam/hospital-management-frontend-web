/**
 * Lab Technician Dashboard Page
 * Displays lab metrics matching LabDashboardResponse DTO: totalLabOrders, pendingTests, completedReports, totalReports
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TestTube, Clock, CheckCircle, FileCheck, ArrowRight } from 'lucide-react';
import dashboardApi from '../../api/dashboardApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function LabDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await dashboardApi.getLabStats();
        setStats(res.data);
      } catch (err) {
        console.error('Failed to load lab stats:', err);
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
        <h1 className="text-2xl font-bold text-slate-900">Lab Technician Dashboard</h1>
        <p className="text-sm text-slate-500">Consolidated stats for laboratory diagnostics & test reports</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <div
          onClick={() => navigate('/lab/reports?status=ALL')}
          className="group cursor-pointer rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex items-center justify-between hover:shadow-md hover:-translate-y-0.5 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 transition-transform group-hover:scale-105">
              <TestTube className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase">Total Lab Orders</p>
              <p className="text-2xl font-bold text-slate-900">{stats?.totalLabOrders ?? 0}</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
        </div>

        <div
          onClick={() => navigate('/lab/reports?status=PENDING')}
          className="group cursor-pointer rounded-2xl border border-amber-200 bg-amber-50/30 p-6 shadow-sm flex items-center justify-between hover:shadow-md hover:-translate-y-0.5 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600 transition-transform group-hover:scale-105">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase">Pending Tests</p>
              <p className="text-2xl font-bold text-amber-600">{stats?.pendingTests ?? 0}</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-amber-300 group-hover:text-amber-600 transition-colors" />
        </div>

        <div
          onClick={() => navigate('/lab/reports?status=COMPLETED')}
          className="group cursor-pointer rounded-2xl border border-emerald-200 bg-emerald-50/30 p-6 shadow-sm flex items-center justify-between hover:shadow-md hover:-translate-y-0.5 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 transition-transform group-hover:scale-105">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase">Completed Reports</p>
              <p className="text-2xl font-bold text-emerald-600">{stats?.completedReports ?? 0}</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-emerald-300 group-hover:text-emerald-600 transition-colors" />
        </div>

        <div
          onClick={() => navigate('/lab/reports?status=ALL')}
          className="group cursor-pointer rounded-2xl border border-blue-200 bg-blue-50/30 p-6 shadow-sm flex items-center justify-between hover:shadow-md hover:-translate-y-0.5 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 transition-transform group-hover:scale-105">
              <FileCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase">Total Reports</p>
              <p className="text-2xl font-bold text-blue-600">{stats?.totalReports ?? 0}</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-blue-300 group-hover:text-blue-600 transition-colors" />
        </div>
      </div>
    </div>
  );
}
