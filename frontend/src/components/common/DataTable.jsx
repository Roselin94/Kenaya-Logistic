import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, Inbox, Filter } from 'lucide-react';

export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  searchPlaceholder = 'Rechercher...',
  filterOptions = null,
  currentFilter = '',
  onFilterChange = null,
  itemsPerPage = 10,
  emptyMessage = 'Aucune donnée trouvée.'
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Filtrage local si applicable
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    const term = searchTerm.toLowerCase();

    return data.filter((row) =>
      Object.values(row).some((val) => {
        if (val === null || val === undefined) return false;
        if (typeof val === 'object') return false;
        return String(val).toLowerCase().includes(term);
      })
    );
  }, [data, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
      {/* Barre d'outils (Recherche & Filtres) */}
      <div className="p-2.5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-navy-800/30 focus:border-navy-800 transition-all placeholder:text-slate-400"
          />
        </div>

        {filterOptions && onFilterChange && (
          <div className="flex items-center gap-1.5">
            <Filter size={13} className="text-slate-400" />
            <select
              value={currentFilter}
              onChange={(e) => {
                onFilterChange(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-navy-800/30 focus:border-navy-800 transition-all"
            >
              {filterOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[11.5px] text-slate-600">
          <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-100">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`px-3 py-2 ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-12 text-slate-400">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-gold-500 mb-2"></div>
                  <div className="text-xs font-medium">Chargement des données réelles...</div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-14 text-slate-400">
                  <Inbox size={40} className="mx-auto text-slate-300 mb-2" />
                  <div className="text-sm font-semibold text-slate-600">{emptyMessage}</div>
                  <div className="text-xs text-slate-400 mt-1">
                    Essayez d'ajuster vos critères de recherche ou de filtre.
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIdx) => (
                <tr
                  key={row.id || rowIdx}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={colIdx}
                      className={`px-4 sm:px-6 py-3.5 ${col.className || ''}`}
                    >
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && filteredData.length > 0 && (
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-white">
          <div>
            Affichage de <span className="font-bold text-slate-700">{(currentPage - 1) * itemsPerPage + 1}</span> à{' '}
            <span className="font-bold text-slate-700">
              {Math.min(currentPage * itemsPerPage, filteredData.length)}
            </span>{' '}
            sur <span className="font-bold text-slate-700">{filteredData.length}</span> enregistrements
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-2 font-medium">
              Page {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

