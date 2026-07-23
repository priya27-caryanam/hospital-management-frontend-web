/**
 * DataTable Component
 * Reusable table with pagination, loading state, and empty state
 */
import { ChevronLeft, ChevronRight, Database } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

export default function DataTable({ columns, data, loading, emptyMessage = 'No data found', pageSize = 10, currentPage = 1, onPageChange }) {
  // Client-side pagination if no external handler
  const usesClientPaging = !onPageChange;
  const totalPages = Math.ceil((data?.length || 0) / pageSize);

  // If client-side, slice data
  const displayData = usesClientPaging
    ? (data || []).slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : data || [];

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <Database className="h-12 w-12 mb-3 opacity-50" />
        <p className="text-sm font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayData.map((row, rowIdx) => (
              <tr
                key={row.id || rowIdx}
                className="transition-colors hover:bg-blue-50/30"
              >
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className="px-4 py-3 text-slate-700 whitespace-nowrap">
                    {col.render ? col.render(row) : row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-4 py-3">
          <p className="text-xs text-slate-500">
            Showing {((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, data.length)} of {data.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange ? onPageChange(currentPage - 1) : null}
              disabled={currentPage <= 1}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 text-xs font-medium text-slate-600">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => onPageChange ? onPageChange(currentPage + 1) : null}
              disabled={currentPage >= totalPages}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
