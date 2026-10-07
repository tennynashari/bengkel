import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  itemsPerPage = 10,
  onPageChange,
  onItemsPerPageChange
}) {
  const { t } = useLanguage();
  if (totalItems === 0) return null;

  // Generate smart page items: next, prev, beberapa awal dan beberapa akhir
  const getPageNumbers = () => {
    if (totalPages <= 6) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = [];
    const startPages = [1, 2];
    const endPages = [totalPages - 1, totalPages];

    pages.push(...startPages);

    if (currentPage > 3 && currentPage < totalPages - 2) {
      pages.push('ellipsis-start');
      pages.push(currentPage);
      pages.push('ellipsis-end');
    } else if (currentPage === 3) {
      pages.push(3);
      pages.push('ellipsis-end');
    } else if (currentPage === totalPages - 2) {
      pages.push('ellipsis-start');
      pages.push(totalPages - 2);
    } else {
      pages.push('ellipsis');
    }

    pages.push(...endPages);

    const result = [];
    pages.forEach((p) => {
      if (typeof p === 'number') {
        if (!result.includes(p)) result.push(p);
      } else {
        result.push(p);
      }
    });

    return result;
  };

  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-slate-800 text-xs text-slate-400 bg-slate-900/60 rounded-b-3xl">
      <div className="flex items-center gap-3">
        <span>
          {t('pg_showing')} <strong className="text-white">{startIndex}</strong> - <strong className="text-white">{endIndex}</strong> {t('pg_of')} <strong className="text-amber-400">{totalItems}</strong> {t('pg_data')}
        </span>
        {onItemsPerPageChange && (
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-[11px] text-slate-500">{t('pg_perPage')}</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                onItemsPerPageChange(Number(e.target.value));
                onPageChange(1);
              }}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              {[3, 5, 10, 20, 50].map((num) => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        {/* Prev Button */}
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed font-bold flex items-center gap-1 transition cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t('pg_prev')}</span>
        </button>

        {/* Page items */}
        {getPageNumbers().map((p, idx) => {
          if (typeof p === 'string') {
            return (
              <span key={`ellipsis-${idx}`} className="px-2 py-1 text-slate-600 font-bold select-none">
                ...
              </span>
            );
          }

          const isActive = p === currentPage;
          return (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 rounded-xl font-bold transition cursor-pointer flex items-center justify-center ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/60'
              }`}
            >
              {p}
            </button>
          );
        })}

        {/* Next Button */}
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed font-bold flex items-center gap-1 transition cursor-pointer"
        >
          <span className="hidden sm:inline">{t('pg_next')}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
