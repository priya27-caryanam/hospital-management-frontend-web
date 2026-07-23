/**
 * Admin Reports Placeholder Page
 * Displays a 'Coming Soon' placeholder for reports dashboard.
 */
import { BarChart3, AlertCircle, Sparkles } from 'lucide-react';

export default function Reports() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center p-4">
      <div className="relative mb-6">
        {/* Animated accent circle */}
        <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 opacity-20 blur-xl animate-pulse-soft" />

        <div className="relative rounded-2xl bg-white border border-slate-200 p-5 shadow-md flex items-center justify-center">
          <BarChart3 className="h-12 w-12 text-blue-600" />
        </div>
      </div>

      <div className="max-w-md space-y-3">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-100">
          <Sparkles className="h-3 w-3" />
          Under Development
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics & Reports Dashboard</h1>
        <p className="text-sm text-slate-500 leading-relaxed">
          The reporting module is currently under active construction. Soon you'll be able to view hospital performance analytics, appointment reports, revenue breakdowns, and patient demographics here.
        </p>
      </div>

      {/* Demo indicators */}
      <div className="mt-8 grid grid-cols-2 gap-4 max-w-sm w-full">
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm text-left opacity-60">
          <div className="h-2 w-8 bg-slate-200 rounded-full mb-2" />
          <div className="h-4 w-16 bg-blue-100 rounded-full mb-1" />
          <div className="h-2.5 w-24 bg-slate-100 rounded-full" />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm text-left opacity-60">
          <div className="h-2 w-8 bg-slate-200 rounded-full mb-2" />
          <div className="h-4 w-20 bg-blue-100 rounded-full mb-1" />
          <div className="h-2.5 w-16 bg-slate-100 rounded-full" />
        </div>
      </div>
    </div>
  );
}
