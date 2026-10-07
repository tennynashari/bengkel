import React, { useState, useEffect } from 'react';
import { X, Wrench, UserCheck, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { updateBookingStatus } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

export default function AssignBayModal({ 
  isOpen, 
  onClose, 
  booking, 
  bays = [], 
  mechanics = [], 
  bookings = [], 
  onRefresh 
}) {
  const { t } = useLanguage();
  const [selectedBayId, setSelectedBayId] = useState('');
  const [selectedMechanicId, setSelectedMechanicId] = useState('');
  const [status, setStatus] = useState('IN_PROGRESS');
  const [loading, setLoading] = useState(false);

  // Cari pit & mekanik yang sedang sibuk di booking lain yang BELUM READY / COMPLETED / CANCELLED
  const occupiedBayIds = new Set(
    bookings
      .filter(b => 
        b.id !== booking?.id && 
        !['READY', 'READY_TO_PICK', 'COMPLETED', 'CANCELLED'].includes(b.status) && 
        b.work_bay_id
      )
      .map(b => Number(b.work_bay_id))
  );

  const busyMechanicIds = new Set(
    bookings
      .filter(b => 
        b.id !== booking?.id && 
        !['READY', 'READY_TO_PICK', 'COMPLETED', 'CANCELLED'].includes(b.status) && 
        b.mechanic_id
      )
      .map(b => Number(b.mechanic_id))
  );

  // Saring hanya Pit yang tersedia (atau yang sedang dipakai booking ini)
  const availableBays = bays.filter(bay => 
    !occupiedBayIds.has(Number(bay.id)) || Number(bay.id) === Number(booking?.work_bay_id)
  );

  // Saring hanya Mekanik yang bebas tugas (atau yang sudah dialokasikan ke booking ini)
  const availableMechanics = mechanics.filter(m => 
    !busyMechanicIds.has(Number(m.id)) || Number(m.id) === Number(booking?.mechanic_id)
  );

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (booking) {
      // Set default selected bay
      if (booking.work_bay_id && availableBays.some(b => Number(b.id) === Number(booking.work_bay_id))) {
        setSelectedBayId(booking.work_bay_id);
      } else if (availableBays.length > 0) {
        setSelectedBayId(availableBays[0].id);
      } else {
        setSelectedBayId('');
      }

      // Set default selected mechanic
      if (booking.mechanic_id && availableMechanics.some(m => Number(m.id) === Number(booking.mechanic_id))) {
        setSelectedMechanicId(booking.mechanic_id);
      } else if (availableMechanics.length > 0) {
        setSelectedMechanicId(availableMechanics[0].id);
      } else {
        setSelectedMechanicId('');
      }

      setStatus(booking.status === 'BOOKED' ? 'IN_PROGRESS' : booking.status);
    }
  }, [booking, bays, mechanics, bookings]);

  if (!isOpen || !booking) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBayId && availableBays.length > 0) {
      alert(t('as_pickPitAlert'));
      return;
    }
    setLoading(true);
    try {
      await updateBookingStatus(booking.id, {
        work_bay_id: selectedBayId ? Number(selectedBayId) : null,
        mechanic_id: selectedMechanicId ? Number(selectedMechanicId) : null,
        status
      });
      if (onRefresh) onRefresh();
      onClose();
    } catch (err) {
      alert(t('as_fail'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1 mb-5">
          <h2 className="text-xl font-bold text-white font-heading flex items-center gap-2">
            <Wrench className="w-5 h-5 text-amber-400" />
            <span>{t('as_title')}</span>
          </h2>
          <p className="text-xs text-slate-400">{t('as_sub')}</p>
        </div>

        {/* Info Card Kendaraan */}
        <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 mb-5 space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">{t('cm_bookingCode')}</span>
            <span className="font-extrabold text-amber-400 font-heading">{booking.booking_code}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">{t('cm_vehicle')}</span>
            <span className="font-bold text-white">{booking.vehicle_brand_model} ({booking.license_plate})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">{t('cm_schedule')}</span>
            <span className="font-bold text-amber-300">📅 {booking.scheduled_date} • ⏰ {booking.scheduled_time || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">{t('cm_servicePkg')}</span>
            <span className="text-slate-200 font-semibold">{booking.service_names || 'Auto Detailing Service'}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* Field Pilih Pit */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-slate-300 uppercase font-bold text-[10px] tracking-wider">
                {t('as_choosePit')}
              </label>
              <span className="text-[10px] text-amber-400 font-semibold">
                {t('as_pitsFree', { n: availableBays.length })}
              </span>
            </div>

            {availableBays.length === 0 ? (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span>{t('as_allPitsFull')}</span>
              </div>
            ) : (
              <select
                value={selectedBayId}
                onChange={(e) => setSelectedBayId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-400 cursor-pointer font-medium"
              >
                {availableBays.map(b => (
                  <option key={b.id} value={b.id}>
                    🟢 {b.name} ({b.bay_type})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Field Pilih Mekanik */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-slate-300 uppercase font-bold text-[10px] tracking-wider">
                {t('as_chooseMech')}
              </label>
              <span className="text-[10px] text-emerald-400 font-semibold">
                {t('as_mechReady', { n: availableMechanics.length })}
              </span>
            </div>

            {availableMechanics.length === 0 ? (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{t('as_allMechBusy')}</span>
              </div>
            ) : (
              <select
                value={selectedMechanicId}
                onChange={(e) => setSelectedMechanicId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-400 cursor-pointer font-medium"
              >
                {availableMechanics.map(m => (
                  <option key={m.id} value={m.id}>
                    👤 {m.name} — {m.role}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Status Pengerjaan */}
          <div>
            <label className="block text-slate-300 uppercase font-bold text-[10px] tracking-wider mb-1">
              {t('as_workStatus')}
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-amber-300 font-bold focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="IN_PROGRESS">{t('as_optInProgress')}</option>
              <option value="CHECKED_IN">{t('as_optCheckedIn')}</option>
              <option value="QC">{t('as_optQc')}</option>
              <option value="READY">{t('as_optReady')}</option>
              <option value="COMPLETED">{t('as_optCompleted')}</option>
            </select>
          </div>

          <div className="flex gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition cursor-pointer"
            >
              {t('cm_cancel')}
            </button>
            <button
              type="submit"
              disabled={loading || (availableBays.length === 0 && !booking.work_bay_id)}
              className="w-2/3 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? t('as_saving') : t('as_save')}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
