import Pagination from './Pagination';
import { useLanguage } from '../../context/LanguageContext';
import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Eye, 
  Edit, 
  FileText, 
  Camera, 
  Wrench, 
  Calendar, 
  Clock, 
  Globe, 
  UserCheck, 
  MessageCircle, 
  Tag, 
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  X,
  CreditCard,
  ShieldCheck,
  Coins,
  AlertCircle,
  Filter,
  User,
  RotateCcw,
  Search
} from 'lucide-react';
import { updateBookingStatus, deleteBooking } from '../../services/api';

export default function BookingManager({ 
  bookings = [], 
  mechanics = [],
  onOpenBooking,
  onOpenInspection, 
  onOpenProgress, 
  onOpenAssignBay, 
  onRefresh 
}) {
  const { t } = useLanguage();
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterSource, setFilterSource] = useState('ALL');
  const [filterPayment, setFilterPayment] = useState('ALL'); // 'ALL', 'DP_PAID', 'FULLY_PAID', 'PENDING'
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterMechanic, setFilterMechanic] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedProofBooking, setSelectedProofBooking] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  // Normalize date string to 'YYYY-MM-DD'
  const normalizeDate = (dStr) => {
    if (!dStr) return '';
    if (typeof dStr === 'string') {
      return dStr.split('T')[0].trim();
    }
    try {
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return '';
      return d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  // Compile unique mechanic list from both mechanics prop and bookings
  const mechanicOptions = useMemo(() => {
    const map = new Map();
    if (Array.isArray(mechanics)) {
      mechanics.forEach(m => {
        if (m && m.name) {
          map.set(m.name.trim().toLowerCase(), {
            id: m.id,
            name: m.name.trim(),
            specialization: m.specialization || m.role || ''
          });
        }
      });
    }
    if (Array.isArray(bookings)) {
      bookings.forEach(b => {
        if (b && b.mechanic_name) {
          const key = b.mechanic_name.trim().toLowerCase();
          if (!map.has(key)) {
            map.set(key, {
              id: b.mechanic_id || key,
              name: b.mechanic_name.trim(),
              specialization: ''
            });
          }
        }
      });
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [mechanics, bookings]);

  // Filter Bookings
  const filtered = useMemo(() => {
    return bookings.filter(b => {
      // 1. Filter Status Pengerjaan
      if (filterStatus !== 'ALL' && b.status !== filterStatus) return false;

      // 2. Filter Sumber (Online vs Walk-in)
      if (filterSource === 'ONLINE' && !b.booking_code?.startsWith('WEB-')) return false;
      if (filterSource === 'WALK_IN' && b.booking_code?.startsWith('WEB-')) return false;

      // 3. Filter Pembayaran
      if (filterPayment === 'FULLY_PAID' && b.payment_status !== 'FULLY_PAID' && b.payment_status !== 'PAID') return false;
      if (filterPayment === 'DP_PAID' && b.payment_status !== 'DP_PAID') return false;
      if (filterPayment === 'PENDING' && (b.payment_status === 'FULLY_PAID' || b.payment_status === 'PAID' || b.payment_status === 'DP_PAID')) return false;

      // 4. Filter Start Date
      const bookingDate = normalizeDate(b.scheduled_date || b.created_at);
      if (filterStartDate) {
        if (!bookingDate || bookingDate < filterStartDate) return false;
      }

      // 5. Filter End Date
      if (filterEndDate) {
        if (!bookingDate || bookingDate > filterEndDate) return false;
      }

      // 6. Filter Mechanic
      if (filterMechanic !== 'ALL') {
        if (filterMechanic === 'UNASSIGNED') {
          if (b.mechanic_name && b.mechanic_name.trim() !== '') return false;
        } else {
          const bMechName = (b.mechanic_name || '').trim().toLowerCase();
          const targetMech = filterMechanic.trim().toLowerCase();
          if (bMechName !== targetMech && String(b.mechanic_id) !== String(filterMechanic)) return false;
        }
      }

      // 7. Search query (search by booking code, customer name, phone, plate, car model)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const code = (b.booking_code || '').toLowerCase();
        const name = (b.customer_name || '').toLowerCase();
        const phone = (b.customer_phone || '').toLowerCase();
        const plate = (b.license_plate || '').toLowerCase();
        const model = (b.vehicle_brand_model || '').toLowerCase();
        if (!code.includes(q) && !name.includes(q) && !phone.includes(q) && !plate.includes(q) && !model.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [bookings, filterStatus, filterSource, filterPayment, filterStartDate, filterEndDate, filterMechanic, searchQuery]);

  const hasActiveFilters = filterStatus !== 'ALL' || 
    filterSource !== 'ALL' || 
    filterPayment !== 'ALL' || 
    Boolean(filterStartDate) || 
    Boolean(filterEndDate) || 
    filterMechanic !== 'ALL' ||
    Boolean(searchQuery);

  const resetAllFilters = () => {
    setFilterStatus('ALL');
    setFilterSource('ALL');
    setFilterPayment('ALL');
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterMechanic('ALL');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'BOOKED': return { label: t('stat_BOOKED'), color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
      case 'CHECKED_IN': return { label: t('stat_CHECKED_IN'), color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' };
      case 'IN_PROGRESS': return { label: t('stat_IN_PROGRESS'), color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
      case 'QC': return { label: t('stat_QC'), color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' };
      case 'READY': return { label: t('stat_READY'), color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' };
      case 'COMPLETED': return { label: t('stat_COMPLETED'), color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
      default: return { label: status, color: 'bg-slate-700 text-slate-300 border-slate-600' };
    }
  };

  const getPaymentBadge = (b) => {
    const isPaid = b.payment_status === 'FULLY_PAID' || b.payment_status === 'PAID';
    const isDp = b.payment_status === 'DP_PAID';
    const total = parseFloat(b.total_amount || 0);
    const dp = parseFloat(b.deposit_amount || 0);
    const remaining = isPaid ? 0 : Math.max(0, total - dp);

    if (isPaid) {
      return {
        label: t('cm_paid'),
        color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
        detail: `Rp ${total.toLocaleString('id-ID')} (100%)`,
        status: 'PAID'
      };
    }
    if (isDp) {
      return {
        label: t('cm_dpPaid'),
        color: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
        detail: t('bk_dpDetail', { dp: dp.toLocaleString('id-ID'), rem: remaining.toLocaleString('id-ID') }),
        status: 'DP_PAID'
      };
    }
    return {
      label: t('cm_unpaid'),
      color: 'bg-slate-800 text-slate-400 border-slate-700',
      detail: t('bk_billDetail', { total: total.toLocaleString('id-ID') }),
      status: 'PENDING'
    };
  };

  const handleDeleteBooking = async (b) => {
    const isOnline = b.booking_code?.startsWith('WEB-');
    const msg = `${t('bk_confirmDelete', { code: b.booking_code, name: b.customer_name, vehicle: b.vehicle_brand_model })}\n\n${isOnline ? t('bk_warnOnline') : ''}`;
    
    if (confirm(msg)) {
      try {
        await deleteBooking(b.id);
        if (onRefresh) onRefresh();
      } catch (err) {
        alert(t('bk_deleteFail') + (err.response?.data?.error || err.message));
      }
    }
  };

  const handleVerifyPayment = async (newPaymentStatus) => {
    if (!selectedProofBooking) return;
    setLoadingAction(true);
    try {
      await updateBookingStatus(selectedProofBooking.id, {
        payment_status: newPaymentStatus
      });
      if (onRefresh) onRefresh();
      setSelectedProofBooking(null);
    } catch (err) {
      alert(t('bk_payUpdateFail'));
    } finally {
      setLoadingAction(false);
    }
  };

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginatedBookings = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading font-extrabold text-white flex items-center gap-2">
            <span>{t('bk_title')}</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold">
              {t('bk_records', { n: filtered.length })}
            </span>
          </h2>
          <p className="text-xs text-slate-400">{t('bk_subtitle')}</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Create Booking Button */}
          {onOpenBooking && (
            <button
              onClick={onOpenBooking}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t('bk_createBtn')}</span>
            </button>
          )}

          {/* Quick Reset Button if active filters */}
          {hasActiveFilters && (
            <button
              onClick={resetAllFilters}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('bk_resetAll')}</span>
            </button>
          )}
        </div>
      </div>

      {/* FILTER PANEL: Start Date, End Date, Mechanic, Search, Status & Source */}
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-400 border-b border-slate-800/80 pb-2.5">
          <Filter className="w-4 h-4" />
          <span>{t('bk_filterTitle')}</span>
        </div>

        {/* Row 1: Dates & Mechanic & Search */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Filter Start Date */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('bk_startDate')}</span>
            </label>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => {
                setFilterStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-950/80 border border-slate-700/80 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition cursor-pointer [color-scheme:dark]"
            />
          </div>

          {/* Filter End Date */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t('bk_endDate')}</span>
            </label>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => {
                setFilterEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-950/80 border border-slate-700/80 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 transition cursor-pointer [color-scheme:dark]"
            />
          </div>

          {/* Filter Mechanic */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t('bk_mechanicName')}</span>
            </label>
            <select
              value={filterMechanic}
              onChange={(e) => {
                setFilterMechanic(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-950/80 border border-slate-700/80 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 transition cursor-pointer"
            >
              <option value="ALL">{t('bk_allMechanics')}</option>
              <option value="UNASSIGNED">{t('bk_unassignedOpt')}</option>
              {mechanicOptions.map(m => (
                <option key={m.id || m.name} value={m.name}>
                  {m.name} ({m.specialization || t('bk_technician')})
                </option>
              ))}
            </select>
          </div>

          {/* Search Query */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-purple-400" />
              <span>{t('bk_searchLabel')}</span>
            </label>
            <input
              type="text"
              placeholder={t('bk_searchPh')}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-950/80 border border-slate-700/80 text-slate-200 placeholder-slate-500 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition"
            />
          </div>

        </div>

        {/* Row 2: Status & Badges Filter */}
        <div className="pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Status Pengerjaan Filter */}
            <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-2xl border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-500 px-2">{t('bk_status')}</span>
              {[
                { id: 'ALL', label: t('bk_stAll') },
                { id: 'BOOKED', label: t('bk_stBooked') },
                { id: 'IN_PROGRESS', label: t('bk_stProcess') },
                { id: 'READY', label: t('bk_stReady') },
                { id: 'COMPLETED', label: t('bk_stDone') }
              ].map(st => (
                <button
                  key={st.id}
                  onClick={() => { setFilterStatus(st.id); setCurrentPage(1); }}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                    filterStatus === st.id 
                      ? 'bg-blue-500 text-white shadow-sm' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* Source Filter */}
            <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-2xl border border-slate-800">
              {[
                { id: 'ALL', label: t('bk_srcAll') },
                { id: 'ONLINE', label: t('bk_srcOnline') },
                { id: 'WALK_IN', label: t('bk_srcWalkIn') }
              ].map(src => (
                <button
                  key={src.id}
                  onClick={() => { setFilterSource(src.id); setCurrentPage(1); }}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                    filterSource === src.id 
                      ? 'bg-amber-500 text-slate-950 shadow-sm' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {src.label}
                </button>
              ))}
            </div>

            {/* Payment Filter */}
            <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-2xl border border-slate-800">
              {[
                { id: 'ALL', label: t('bk_payAll') },
                { id: 'DP_PAID', label: t('bk_payDp') },
                { id: 'FULLY_PAID', label: t('bk_payPaid') },
                { id: 'PENDING', label: t('bk_payPending') }
              ].map(pay => (
                <button
                  key={pay.id}
                  onClick={() => { setFilterPayment(pay.id); setCurrentPage(1); }}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                    filterPayment === pay.id 
                      ? 'bg-emerald-500 text-slate-950 shadow-sm' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {pay.label}
                </button>
              ))}
            </div>

          </div>

          {/* Result Count Indicator */}
          <div className="text-xs text-slate-400">
            {t('bk_showing')} <span className="font-bold text-white">{filtered.length}</span> {t('bk_of')} <span className="font-bold text-slate-300">{bookings.length}</span> {t('bk_totalBookings')}
          </div>

        </div>
      </div>

      {/* Table of Bookings */}
      <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900 shadow-xl">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/90 uppercase text-[10px] tracking-wider text-slate-400 font-semibold border-b border-slate-800">
            <tr>
              <th className="p-4">{t('bk_thCode')}</th>
              <th className="p-4">{t('bk_thCustomer')}</th>
              <th className="p-4">{t('bk_thVehicle')}</th>
              <th className="p-4">{t('bk_thSchedule')}</th>
              <th className="p-4">{t('bk_thPit')}</th>
              <th className="p-4">{t('bk_thStatus')}</th>
              <th className="p-4">{t('bk_thPayment')}</th>
              <th className="p-4 text-center">{t('bk_thAction')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="8" className="p-8 text-center text-slate-500 font-semibold">
                  <div className="max-w-md mx-auto space-y-2">
                    <p className="text-slate-400 text-sm">{t('bk_empty')}</p>
                    {hasActiveFilters && (
                      <button
                        onClick={resetAllFilters}
                        className="text-xs text-amber-400 hover:underline font-bold"
                      >
                        {t('bk_resetToShow')}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedBookings.map((b) => {
                const isOnline = b.booking_code?.startsWith('WEB-');
                const st = getStatusBadge(b.status);
                const payInfo = getPaymentBadge(b);
                const waClean = (b.customer_phone || '').replace(/^0/, '62').replace(/[^0-9]/g, '');
                const waText = encodeURIComponent(t('bk_waText', { name: b.customer_name, code: b.booking_code, vehicle: b.vehicle_brand_model, plate: b.license_plate }));

                return (
                  <tr key={b.id} className="hover:bg-slate-800/40 transition">
                    
                    {/* Kode & Sumber */}
                    <td className="p-4">
                      <span className="font-heading font-black text-amber-400 text-sm block">
                        {b.booking_code}
                      </span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase inline-block mt-1 ${
                        isOnline 
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' 
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {isOnline ? t('bk_online') : t('bk_walkinStaff')}
                      </span>
                    </td>

                    {/* Pelanggan */}
                    <td className="p-4">
                      <p className="font-bold text-white text-sm">{b.customer_name}</p>
                      <a
                        href={`https://wa.me/${waClean}?text=${waText}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold mt-0.5"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>{b.customer_phone}</span>
                      </a>
                    </td>

                    {/* Kendaraan & Layanan */}
                    <td className="p-4 space-y-1">
                      <p className="font-bold text-slate-200">{b.vehicle_brand_model}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-amber-300 font-bold">
                        {b.license_plate}
                      </span>
                      {b.service_names && (
                        <p className="text-[10px] text-slate-400 truncate max-w-xs">{b.service_names}</p>
                      )}
                    </td>

                    {/* Jadwal */}
                    <td className="p-4">
                      <p className="font-semibold text-slate-200 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{b.scheduled_date}</span>
                      </p>
                      <p className="text-[11px] text-amber-400 font-bold flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>{t('bk_timeAt', { t: b.scheduled_time || '09:00' })}</span>
                      </p>
                    </td>

                    {/* Pit & Mekanik */}
                    <td className="p-4">
                      <p className="font-bold text-cyan-400">{b.bay_name || t('bk_noPit')}</p>
                      <p className="text-[11px] text-slate-300 font-medium flex items-center gap-1 mt-0.5">
                        <User className="w-3 h-3 text-emerald-400" />
                        <span>{b.mechanic_name || t('bk_noMech')}</span>
                      </p>
                    </td>

                    {/* Status Pengerjaan */}
                    <td className="p-4">
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border inline-block ${st.color}`}>
                        {st.label}
                      </span>
                    </td>

                    {/* Status Pembayaran & Bukti Transfer */}
                    <td className="p-4 space-y-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedProofBooking(b)}
                        className={`text-[10px] font-extrabold px-2.5 py-1 rounded-xl border text-left flex items-center gap-1 cursor-pointer transition hover:opacity-90 shadow-sm ${payInfo.color}`}
                        title={t('bk_payManageTitle')}
                      >
                        <CreditCard className="w-3 h-3 flex-shrink-0" />
                        <span>{payInfo.label}</span>
                      </button>

                      <p className="text-[10px] text-slate-400 font-mono">
                        {payInfo.detail}
                      </p>

                      {/* Tombol Lihat Bukti Transfer jika ada */}
                      {b.payment_proof && (
                        <button
                          type="button"
                          onClick={() => setSelectedProofBooking(b)}
                          className="px-2 py-0.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[9px] font-bold flex items-center gap-1 cursor-pointer transition"
                        >
                          <ImageIcon className="w-2.5 h-2.5 text-emerald-400" />
                          <span>{t('bk_viewProof')}</span>
                        </button>
                      )}
                    </td>

                    {/* Aksi Operasional */}
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        
                        {/* Alokasi Pit */}
                        <button
                          onClick={() => onOpenAssignBay(b)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-amber-500/20 text-amber-400 border border-slate-700 hover:border-amber-500/40 transition cursor-pointer"
                          title={t('bk_actAssign')}
                        >
                          <Wrench className="w-3.5 h-3.5" />
                        </button>

                        {/* Inspeksi */}
                        <button
                          onClick={() => onOpenInspection(b)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-cyan-500/20 text-cyan-400 border border-slate-700 hover:border-cyan-500/40 transition cursor-pointer"
                          title={t('bk_actInspect')}
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>

                        {/* Progress */}
                        <button
                          onClick={() => onOpenProgress(b)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-purple-500/20 text-purple-400 border border-slate-700 hover:border-purple-500/40 transition cursor-pointer"
                          title={t('bk_actProgress')}
                        >
                          <Camera className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDeleteBooking(b)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-rose-400 border border-slate-700 hover:border-rose-500/40 transition cursor-pointer"
                          title={t('bk_actDelete')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                      </div>
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filtered.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      </div>

      {/* MODAL KELOLA & VERIFIKASI PEMBAYARAN */}
      {selectedProofBooking && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedProofBooking(null);
          }}
        >
          <div 
            className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8 relative text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-heading font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-400" />
                <span>{t('bk_modalTitle')}</span>
              </h3>
              <button 
                onClick={() => setSelectedProofBooking(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Rincian Tagihan & Status Saat Ini */}
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">{t('cm_bookingCode')}</span>
                <span className="font-bold text-amber-400 font-heading text-sm">{selectedProofBooking.booking_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{t('cm_customer')}</span>
                <span className="font-bold text-white">{selectedProofBooking.customer_name} ({selectedProofBooking.customer_phone})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{t('cm_vehicle')}</span>
                <span className="text-slate-200">{selectedProofBooking.vehicle_brand_model} ({selectedProofBooking.license_plate})</span>
              </div>
              <div className="border-t border-slate-700 pt-2 flex justify-between">
                <span className="text-slate-300">{t('cm_totalService')}</span>
                <span className="font-bold text-white">Rp {parseFloat(selectedProofBooking.total_amount || 0).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-bold">
                <span>{t('bk_depositListed')}</span>
                <span>Rp {parseFloat(selectedProofBooking.deposit_amount || 0).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-700 pt-2">
                <span className="text-slate-400">{t('bk_currentPayStatus')}</span>
                <span className={`font-black text-[11px] px-2.5 py-0.5 rounded-full border ${
                  selectedProofBooking.payment_status === 'FULLY_PAID' || selectedProofBooking.payment_status === 'PAID'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : selectedProofBooking.payment_status === 'DP_PAID'
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {selectedProofBooking.payment_status === 'FULLY_PAID' || selectedProofBooking.payment_status === 'PAID'
                    ? t('cm_paid')
                    : selectedProofBooking.payment_status === 'DP_PAID'
                    ? t('cm_dpPaid')
                    : t('cm_unpaidFull')}
                </span>
              </div>
            </div>

            {/* Foto Bukti Transfer jika ada */}
            {selectedProofBooking.payment_proof ? (
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">{t('bk_proofFromCustomer')}</span>
                <div className="rounded-2xl border border-slate-700 overflow-hidden max-h-72 flex items-center justify-center bg-slate-950">
                  <img 
                    src={selectedProofBooking.payment_proof} 
                    alt={t('bk_proofAlt')} 
                    className="w-full h-auto max-h-72 object-contain"
                  />
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-500">
                {t('bk_noProof')}
              </div>
            )}

            {/* Verifikasi Actions */}
            <div className="space-y-2 pt-2 text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">{t('bk_chooseVerify')}</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  disabled={loadingAction}
                  onClick={() => handleVerifyPayment('DP_PAID')}
                  className="py-2.5 px-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold transition cursor-pointer text-center"
                >
                  {t('bk_setDp')}
                </button>
                <button
                  type="button"
                  disabled={loadingAction}
                  onClick={() => handleVerifyPayment('FULLY_PAID')}
                  className="py-2.5 px-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black transition cursor-pointer shadow-lg shadow-emerald-500/20 text-center"
                >
                  {t('bk_setPaid')}
                </button>
                <button
                  type="button"
                  disabled={loadingAction}
                  onClick={() => handleVerifyPayment('PENDING')}
                  className="py-2.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold transition cursor-pointer text-center"
                >
                  {t('bk_setUnpaid')}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
