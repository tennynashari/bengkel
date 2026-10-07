import Pagination from './Pagination';
import { useLanguage } from '../../context/LanguageContext';
import React, { useState } from 'react';
import { 
  CreditCard, 
  Printer, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Calendar, 
  Search, 
  ArrowUpRight, 
  TrendingUp, 
  Receipt,
  FileCheck,
  AlertCircle,
  Coins,
  ShieldCheck
} from 'lucide-react';
import { updateBookingStatus } from '../../services/api';

export default function PaymentManager({ bookings = [], onOpenInvoice, onRefresh }) {
  const { language, t } = useLanguage();
  const [filterPayment, setFilterPayment] = useState('ALL'); // 'ALL', 'PENDING_SETTLEMENT', 'FULLY_PAID'
  const [searchTerm, setSearchTerm] = useState('');
  const [settlingBooking, setSettlingBooking] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState('CASH');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  // STRICT FILTER: Hanya booking yang statusnya READY / READY_TO_PICK atau COMPLETED
  const relevantBookings = bookings.filter(b => 
    b.status === 'COMPLETED' || b.status === 'READY' || b.status === 'READY_TO_PICK'
  );

  // Filter based on payment status & search query
  const filtered = relevantBookings
    .filter(b => {
      const isPaid = b.payment_status === 'FULLY_PAID' || b.payment_status === 'PAID';
      if (filterPayment === 'PENDING_SETTLEMENT') return !isPaid;
      if (filterPayment === 'FULLY_PAID') return isPaid;
      return true;
    })
    .filter(b => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        b.booking_code.toLowerCase().includes(term) ||
        b.customer_name.toLowerCase().includes(term) ||
        b.license_plate.toLowerCase().includes(term)
      );
    });

  // Calculate Financial Metrics (Based on completed/ready bookings)
  const totalRevenue = relevantBookings.reduce((sum, b) => {
    const isPaid = b.payment_status === 'FULLY_PAID' || b.payment_status === 'PAID';
    if (isPaid) return sum + parseFloat(b.total_amount || 0);
    if (b.payment_status === 'DP_PAID') return sum + parseFloat(b.deposit_amount || 0);
    return sum;
  }, 0);

  const pendingSettlement = relevantBookings.reduce((sum, b) => {
    const isPaid = b.payment_status === 'FULLY_PAID' || b.payment_status === 'PAID';
    if (!isPaid) {
      const total = parseFloat(b.total_amount || 0);
      const dp = b.payment_status === 'DP_PAID' ? parseFloat(b.deposit_amount || 0) : 0;
      return sum + Math.max(0, total - dp);
    }
    return sum;
  }, 0);

  const paidCount = relevantBookings.filter(b => b.payment_status === 'FULLY_PAID' || b.payment_status === 'PAID').length;
  const pendingCount = relevantBookings.filter(b => b.payment_status !== 'FULLY_PAID' && b.payment_status !== 'PAID').length;

  const handleConfirmPayment = async () => {
    if (!settlingBooking) return;
    setLoading(true);
    try {
      await updateBookingStatus(settlingBooking.id, {
        payment_status: 'FULLY_PAID'
      });
      if (onRefresh) onRefresh();
      setSettlingBooking(null);
    } catch (err) {
      alert(t('pay_settleFail') + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginatedPayments = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-xs font-semibold text-slate-400">{t('pay_cashIn')}</p>
            <h4 className="text-xl font-heading font-extrabold text-emerald-400 mt-1">
              Rp {totalRevenue.toLocaleString('id-ID')}
            </h4>
            <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              <span>{t('pay_paidOrders', { n: paidCount })}</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-xs font-semibold text-slate-400">{t('pay_remaining')}</p>
            <h4 className="text-xl font-heading font-extrabold text-amber-400 mt-1">
              Rp {pendingSettlement.toLocaleString('id-ID')}
            </h4>
            <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-amber-400" />
              <span>{t('pay_needSettle', { n: pendingCount })}</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-xs font-semibold text-slate-400">{t('pay_totalUnits')}</p>
            <h4 className="text-xl font-heading font-extrabold text-cyan-400 mt-1">
              {t('pay_vehiclesCount', { n: relevantBookings.length })}
            </h4>
            <p className="text-[10px] text-slate-500 mt-1">
              {t('pay_doneInPit')}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <FileCheck className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('pay_searchPh')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-2xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 transition"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {[
            { id: 'ALL', label: t('pay_tabAll') },
            { id: 'PENDING_SETTLEMENT', label: t('pay_tabPending') },
            { id: 'FULLY_PAID', label: t('pay_tabPaid') }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterPayment(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                filterPayment === tab.id
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

      </div>

      {/* Table of Completed / Ready to Pick Bookings */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="p-4">{t('pay_thCodeDate')}</th>
              <th className="p-4">{t('pay_thCustomer')}</th>
              <th className="p-4">{t('pay_thVehiclePit')}</th>
              <th className="p-4">{t('pay_thWork')}</th>
              <th className="p-4">{t('pay_thCost')}</th>
              <th className="p-4">{t('pay_thPay')}</th>
              <th className="p-4 text-center">{t('pay_thAction')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-8 text-center text-slate-500">
                  <Receipt className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-400" />
                  <p className="font-semibold text-sm">{t('pay_empty')}</p>
                  <p className="text-xs text-slate-500 mt-1">{t('pay_emptyHint1')} <span className="text-cyan-400 font-bold">READY TO PICK</span> {t('pay_emptyHintOr')} <span className="text-emerald-400 font-bold">COMPLETED</span> {t('pay_emptyHint2')}</p>
                </td>
              </tr>
            ) : (
              paginatedPayments.map((b) => {
                const total = parseFloat(b.total_amount || 0);
                const dp = parseFloat(b.deposit_amount || 0);
                const isPaid = b.payment_status === 'FULLY_PAID' || b.payment_status === 'PAID';
                const isDp = b.payment_status === 'DP_PAID';
                const remaining = isPaid ? 0 : (isDp ? Math.max(0, total - dp) : total);

                return (
                  <tr key={b.id} className="hover:bg-slate-800/30 transition">
                    
                    {/* Kode & Tanggal */}
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 font-heading font-black text-amber-400 text-sm">
                        <span>{b.booking_code}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{formatDate(b.scheduled_date)} {b.scheduled_time ? `• ${b.scheduled_time}` : ''}</span>
                      </p>
                    </td>

                    {/* Pelanggan */}
                    <td className="p-4">
                      <p className="font-bold text-white text-sm">{b.customer_name}</p>
                      <p className="text-[11px] text-slate-400">{b.customer_phone}</p>
                    </td>

                    {/* Kendaraan & Pit */}
                    <td className="p-4">
                      <p className="font-bold text-slate-200">{b.vehicle_brand_model}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-amber-300 font-bold">
                          {b.license_plate}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {b.bay_name || t('pay_pitDefault')}
                        </span>
                      </div>
                    </td>

                    {/* Status Pengerjaan */}
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold inline-block ${
                        b.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      }`}>
                        {b.status === 'COMPLETED' ? t('pay_stCompleted') : t('pay_stReady')}
                      </span>
                    </td>

                    {/* Rincian Biaya */}
                    <td className="p-4 space-y-0.5">
                      <div className="flex justify-between gap-3 text-slate-400 text-[11px]">
                        <span>{t('pay_totalCost')}</span>
                        <span className="font-bold text-white">Rp {total.toLocaleString('id-ID')}</span>
                      </div>
                      {isDp && (
                        <div className="flex justify-between gap-3 text-emerald-400 text-[11px]">
                          <span>{t('pay_dpPaid')}</span>
                          <span>- Rp {dp.toLocaleString('id-ID')}</span>
                        </div>
                      )}
                      <div className={`flex justify-between gap-3 font-extrabold text-xs border-t border-slate-800 pt-0.5 ${
                        isPaid ? 'text-emerald-400' : 'text-amber-300'
                      }`}>
                        <span>{isPaid ? t('pay_paidAmt') : t('pay_balance')}</span>
                        <span>Rp {isPaid ? total.toLocaleString('id-ID') : remaining.toLocaleString('id-ID')}</span>
                      </div>
                    </td>

                    {/* Status Pembayaran */}
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black inline-flex items-center gap-1 ${
                        isPaid 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                          : isDp
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {isPaid ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        <span>{isPaid ? t('cm_paid') : isDp ? t('cm_dpPaid') : t('cm_unpaid')}</span>
                      </span>
                      {!isPaid && (
                        <p className="text-[10px] text-amber-400 font-semibold mt-1">
                          {isDp ? t('pay_cashierRemain', { n: remaining.toLocaleString('id-ID') }) : t('pay_fullPayNeeded')}
                        </p>
                      )}
                    </td>

                    {/* Aksi Kasir */}
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        
                        {/* Tombol Pelunasan (jika belum lunas) */}
                        {!isPaid && (
                          <button
                            onClick={() => setSettlingBooking(b)}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-extrabold text-[11px] flex items-center gap-1 shadow-sm transition cursor-pointer"
                            title={t('pay_settleTitle')}
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>{t('pay_settle')}</span>
                          </button>
                        )}

                        {/* Tombol Cetak Nota */}
                        <button
                          onClick={() => onOpenInvoice(b)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-extrabold text-[11px] flex items-center gap-1 border border-slate-700 transition cursor-pointer"
                          title={t('pay_printInvoiceTitle')}
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>{t('pay_printInvoice')}</span>
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

      {/* MODAL PROSES PELUNASAN KASIR */}
      {settlingBooking && (() => {
        const total = parseFloat(settlingBooking.total_amount || 0);
        const dp = parseFloat(settlingBooking.deposit_amount || 0);
        const isDp = settlingBooking.payment_status === 'DP_PAID';
        const mustPay = isDp ? Math.max(0, total - dp) : total;

        return (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSettlingBooking(null);
            }}
          >
            <div 
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-slate-100"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-heading font-bold text-white flex items-center gap-2 mb-1">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                <span>{t('pay_modalTitle')}</span>
              </h3>
              <p className="text-xs text-slate-400 mb-4">{t('pay_modalSub')}</p>

              {/* Rincian Tagihan */}
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-2 text-xs mb-4">
                <div className="flex justify-between text-slate-400">
                  <span>{t('pay_invNo')}</span>
                  <span className="font-bold text-amber-400 font-heading">INV/{settlingBooking.booking_code}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>{t('cm_customer')}</span>
                  <span className="font-bold text-white">{settlingBooking.customer_name}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>{t('cm_vehicle')}</span>
                  <span className="text-slate-200">{settlingBooking.vehicle_brand_model} ({settlingBooking.license_plate})</span>
                </div>
                <div className="flex justify-between text-slate-300 border-t border-slate-700 pt-2">
                  <span>{t('cm_totalService')}</span>
                  <span className="font-bold text-white">Rp {total.toLocaleString('id-ID')}</span>
                </div>
                {isDp ? (
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>{t('pay_dpReceived')}</span>
                    <span>- Rp {dp.toLocaleString('id-ID')} (DP_PAID)</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-slate-400">
                    <span>{t('pay_initialStatus')}</span>
                    <span>{t('pay_noDp')}</span>
                  </div>
                )}
                <div className="border-t border-slate-700 pt-2 flex justify-between text-sm font-extrabold text-emerald-400 font-heading">
                  <span>{t('pay_mustPay')}</span>
                  <span>Rp {mustPay.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Pilihan Metode Bayar */}
              <div className="space-y-2 mb-5 text-xs">
                <label className="block text-slate-300 font-bold uppercase tracking-wider text-[10px]">
                  {t('pay_chooseMethod')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'CASH', label: t('pay_mCash') },
                    { id: 'QRIS', label: t('pay_mQris') },
                    { id: 'TRANSFER', label: t('pay_mTransfer') },
                    { id: 'CARD', label: t('pay_mCard') }
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMethod(m.id)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition text-left cursor-pointer ${
                        selectedMethod === m.id
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSettlingBooking(null)}
                  className="w-1/3 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition cursor-pointer"
                >
                  {t('cm_cancel')}
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleConfirmPayment}
                  className="w-2/3 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{loading ? t('pay_processing') : t('pay_confirm')}</span>
                </button>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
