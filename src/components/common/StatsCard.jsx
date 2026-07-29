/**
 * Stats Card Component
 * Dashboard statistics card with icon and animated value
 * Supports keyboard accessibility, role="button", uniform height/width, and hover animation
 */
export default function StatsCard({ icon: Icon, label, value, color = 'blue', onClick }) {
  const colorStyles = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    green: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    cyan: 'bg-cyan-50 text-cyan-600 border-cyan-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  };

  const iconBg = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-emerald-100 text-emerald-600',
    purple: 'bg-purple-100 text-purple-600',
    amber: 'bg-amber-100 text-amber-600',
    rose: 'bg-rose-100 text-rose-600',
    cyan: 'bg-cyan-100 text-cyan-600',
    indigo: 'bg-indigo-100 text-indigo-600',
  };

  const handleKeyDown = (e) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={`group relative overflow-hidden rounded-2xl border bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 h-full flex flex-col justify-between select-none ${
        onClick ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500' : ''
      } ${colorStyles[color] || colorStyles.blue}`}
    >
      {/* Decorative gradient blob */}
      <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-20 blur-2xl ${iconBg[color] || iconBg.blue}`} />

      <div className="relative flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl shrink-0 ${iconBg[color] || iconBg.blue} transition-transform duration-300 group-hover:scale-110`}>
          {Icon && <Icon className="h-6 w-6" />}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-slate-900">{value ?? '—'}</p>
        </div>
      </div>
    </div>
  );
}
