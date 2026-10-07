import { useLanguage } from '../../context/LanguageContext';
import React, { useState } from 'react';
import { Wrench, CheckCircle, Clock, AlertCircle, ChevronLeft, ChevronRight, Filter, ShieldCheck } from 'lucide-react';

export default function LiveBayBoard({ bays, onAssignBay }) {
  const { t } = useLanguage();
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL' | 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4; // Display 4 pits per slide/page for clean layout

  // Filter bays by status
  const filteredBays = filterStatus === 'ALL'
    ? bays
    : bays.filter(b => {
        const isOccupied = b.status === 'OCCUPIED' || b.booking_code;
        if (filterStatus === 'OCCUPIED') return isOccupied;
        if (filterStatus === 'AVAILABLE') return !isOccupied && b.status !== 'MAINTENANCE';
        if (filterStatus === 'MAINTENANCE') return b.status === 'MAINTENANCE';
        return true;
      });

  // Pagination calculation
  const totalPages = Math.ceil(filteredBays.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentBays = filteredBays.slice(startIndex, startIndex + itemsPerPage);

  const totalPits = bays.length;
  const occupiedPits = bays.filter(b => b.status === 'OCCUPIED' || b.booking_code).length;
  const availablePits = totalPits - occupiedPits;

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleFilterChange = (status) => {
    setFilterStatus(status);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Overview Stats */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white font-heading flex items-center gap-2">
            <Wrench className="w-5 h-5 text-amber-400" />
            <span>{t('pitBoardTitle')}</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {t('lb_subtitle', { n: totalPits })}
          </p>
        </div>

        {/* Ringkasan Badges */}
        <div className="flex items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300">
            {t('lb_total')} <strong className="text-white">{totalPits} {t('lb_pitUnit')}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
            {t('lb_occupied')} <strong>{occupiedPits} {t('lb_pitUnit')}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
            {t('lb_empty')} <strong>{availablePits} {t('lb_pitUnit')}</strong>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Pagination Controls Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900 border border-slate-800">
        
        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-400 font-semibold px-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-amber-400" />
            <span>{t('lb_filterPit')}</span>
          </span>
          <button
            onClick={() => handleFilterChange('ALL')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition ${
              filterStatus === 'ALL' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {t('lb_all')} ({totalPits})
          </button>
          <button
            onClick={() => handleFilterChange('OCCUPIED')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition ${
              filterStatus === 'OCCUPIED' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {t('lb_inUse')} ({occupiedPits})
          </button>
          <button
            onClick={() => handleFilterChange('AVAILABLE')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition ${
              filterStatus === 'AVAILABLE' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {t('lb_ready')} ({availablePits})
          </button>
        </div>

        {/* SIDE PAGINATION CONTROLS (Ke Samping) */}
        {totalPages > 1 && (
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs text-slate-400 font-medium">
              {t('lb_showing', { from: startIndex + 1, to: Math.min(startIndex + itemsPerPage, filteredBays.length), total: filteredBays.length })}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition border border-slate-700"
                title={t('lb_prevPage')}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition border border-slate-700"
                title={t('lb_nextPage')}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Live Pits Grid (Paginated 4 Pits per view) */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 min-h-[260px]">
        {currentBays.map((bay) => {
          const isOccupied = bay.status === 'OCCUPIED' || bay.booking_code;
          return (
            <div 
              key={bay.id}
              className={`p-5 rounded-2xl border transition relative flex flex-col justify-between ${
                isOccupied
                  ? 'bg-amber-500/10 border-amber-500/40 text-white shadow-lg shadow-amber-500/5'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-amber-400 font-heading">
                    Pit #{bay.bay_number}
                  </span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    isOccupied 
                      ? 'bg-amber-400 text-slate-950 animate-pulse' 
                      : bay.status === 'MAINTENANCE'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {isOccupied ? t('lb_statusInUse') : bay.status === 'MAINTENANCE' ? t('lb_statusRepair') : t('lb_statusReady')}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-white text-sm">{bay.name}</h4>
                  <span className="text-[10px] text-slate-400 uppercase font-medium">{t('lb_type')} {bay.bay_type}</span>
                </div>

                {isOccupied ? (
                  <div className="space-y-1 pt-2 border-t border-slate-800/80">
                    <span className="text-xs font-bold text-white block">{bay.vehicle_brand_model}</span>
                    <span className="text-xs text-amber-400 font-extrabold block">{bay.license_plate}</span>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>{t('lb_code')} <strong>{bay.booking_code}</strong></span>
                      <span className="text-slate-300 font-semibold">{bay.customer_name}</span>
                    </div>
                  </div>
                ) : (
                  <div className="py-5 text-center text-slate-500 text-xs italic">
                    {t('lb_readyText')}
                  </div>
                )}
              </div>

              <div className="pt-3 mt-3 border-t border-slate-800/60">
                <button
                  onClick={() => onAssignBay(bay)}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-xs font-bold text-slate-200 transition border border-slate-700 hover:border-amber-400"
                >
                  {isOccupied ? t('lb_manage') : t('lb_assign')}
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* Pagination Page Dots / Status Footnote */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pgNum) => (
            <button
              key={pgNum}
              onClick={() => setCurrentPage(pgNum)}
              className={`h-2 rounded-full transition-all ${
                currentPage === pgNum ? 'w-8 bg-amber-400' : 'w-2 bg-slate-800 hover:bg-slate-700'
              }`}
              title={t('lb_gotoPage', { n: pgNum })}
            />
          ))}
        </div>
      )}

    </div>
  );
}
