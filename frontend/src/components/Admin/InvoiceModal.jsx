import React, { useRef, useEffect } from 'react';
import { 
  Printer, 
  X, 
  CheckCircle2, 
  Wrench, 
  Calendar, 
  Clock, 
  Car, 
  User, 
  Phone, 
  MapPin, 
  ShieldCheck,
  CreditCard,
  QrCode
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function InvoiceModal({ isOpen, onClose, booking, outlet }) {
  const { language, t } = useLanguage();
  const printRef = useRef();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !booking) return null;

  const handlePrint = () => {
    window.print();
  };

  const totalAmount = parseFloat(booking.total_amount || 0);
  const depositAmount = parseFloat(booking.deposit_amount || 0);
  const isFullyPaid = booking.payment_status === 'FULLY_PAID' || booking.payment_status === 'PAID';
  const isDpPaid = booking.payment_status === 'DP_PAID';
  const remainingAmount = isFullyPaid ? 0 : (isDpPaid ? Math.max(0, totalAmount - depositAmount) : totalAmount);

  const todayStr = new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Styles for clean printing */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-invoice, #printable-invoice * {
            visibility: visible;
          }
          #printable-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            background: #ffffff !important;
            color: #000000 !important;
            border: none !important;
            box-shadow: none !important;
          }
          #printable-invoice * {
            color: #000000 !important;
            border-color: #e2e8f0 !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <div 
        className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8 text-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Action Header (No Print) */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6 no-print">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-amber-400" />
            <h3 className="font-heading font-bold text-white text-base">{t('inv_preview')}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{t('inv_printBtn')}</span>
            </button>
            <button 
              onClick={onClose} 
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
              title={t('inv_closeTitle')}
            >
              <X className="w-4 h-4" />
              <span>{t('inv_close')}</span>
            </button>
          </div>
        </div>

        {/* PRINTABLE INVOICE CONTAINER */}
        <div id="printable-invoice" ref={printRef} className="bg-slate-950 p-6 sm:p-8 rounded-2xl border border-slate-800 text-slate-200">
          
          {/* Header Bengkel */}
          <div className="flex flex-col sm:row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 font-black shadow-md flex-shrink-0">
                <Wrench className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-heading font-black text-xl text-white tracking-tight">AUTOBENGKEL DETAILING</h1>
                <p className="text-xs text-slate-400">{outlet?.name || 'AutoDetailing & Wash Hub Jakarta'}</p>
                <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-amber-400 flex-shrink-0" />
                  <span>{outlet?.address || 'Jl. Radio Dalam No. 88, Kebayoran Baru, Jakarta Selatan'}</span>
                </p>
                <p className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                  <span>{t('inv_csWa')} {outlet?.phone || '0812-9988-7766'}</span>
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t('inv_number')}</span>
              <span className="font-heading font-extrabold text-amber-400 text-base block">INV/{booking.booking_code}</span>
              <span className="text-xs text-slate-400 block mt-1">{t('inv_date')} {todayStr}</span>
              <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-black border ${
                isFullyPaid 
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                  : isDpPaid
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {isFullyPaid ? t('cm_paid') : isDpPaid ? t('inv_dpStatus') : t('inv_waiting')}
              </span>
            </div>
          </div>

          {/* Info Customer & Kendaraan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-5 border-b border-slate-800 text-xs">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('inv_customer')}</p>
              <p className="font-bold text-white text-sm">{booking.customer_name}</p>
              <p className="text-slate-400">{t('inv_phone')} {booking.customer_phone}</p>
              {booking.customer_email && <p className="text-slate-400">{t('inv_email')} {booking.customer_email}</p>}
            </div>

            <div className="space-y-1 sm:text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('inv_vehSchedule')}</p>
              <p className="font-bold text-white text-sm">{booking.vehicle_brand_model} ({booking.license_plate})</p>
              <p className="text-slate-400 uppercase">{t('inv_typeSize', { type: booking.vehicle_type || 'CAR', size: booking.vehicle_size })}</p>
              <p className="text-slate-400">{t('inv_pitMech', { pit: booking.bay_name || t('inv_defaultPit'), mech: booking.mechanic_name || t('inv_defaultMech') })}</p>
            </div>
          </div>

          {/* Tabel Rincian Jasa / Layanan */}
          <div className="py-5">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5">{t('inv_thDesc')}</th>
                  <th className="py-2.5 text-center">{t('inv_thCat')}</th>
                  <th className="py-2.5 text-right">{t('inv_thCost')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                <tr>
                  <td className="py-3 font-semibold text-white">
                    {booking.service_names || t('inv_defaultService')}
                    <span className="block text-[11px] text-slate-400 font-normal">{t('inv_pro')}</span>
                  </td>
                  <td className="py-3 text-center text-slate-300 font-medium">{booking.vehicle_size}</td>
                  <td className="py-3 text-right font-bold text-white">Rp {totalAmount.toLocaleString('id-ID')}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Rincian Total & Pelunasan */}
          <div className="border-t border-slate-800 pt-4 space-y-2 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>{t('cm_totalService')}</span>
              <span className="font-bold text-white">Rp {totalAmount.toLocaleString('id-ID')}</span>
            </div>

            {isDpPaid && (
              <div className="flex justify-between text-slate-300">
                <span>{t('inv_dpLine')}</span>
                <span className="font-bold text-emerald-400">- Rp {depositAmount.toLocaleString('id-ID')}</span>
              </div>
            )}

            <div className="flex justify-between text-base font-extrabold border-t border-slate-800/80 pt-3 text-amber-400 font-heading">
              <span>{isFullyPaid ? t('inv_totalPaid') : t('inv_remainingDue')}</span>
              <span>Rp {isFullyPaid ? totalAmount.toLocaleString('id-ID') : remainingAmount.toLocaleString('id-ID')}</span>
            </div>
          </div>

          {/* Syarat & Garansi */}
          <div className="mt-8 pt-5 border-t border-dashed border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 text-[10px] text-slate-400">
            <div className="space-y-1 max-w-sm">
              <p className="font-bold text-slate-300 uppercase flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>{t('inv_warrantyTitle')}</span>
              </p>
              <p>{t('inv_t1')}</p>
              <p>{t('inv_t2')}</p>
              <p>{t('inv_t3')}</p>
            </div>

            <div className="text-center sm:text-right min-w-[120px]">
              <p className="text-[10px] text-slate-400 mb-8">{t('inv_regards')}</p>
              <p className="font-bold text-white border-t border-slate-700 pt-1">AUTOBENGKEL PRO</p>
            </div>
          </div>

        </div>

        {/* Footer Actions (No Print) */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end gap-3 no-print">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition cursor-pointer"
          >
            {t('inv_closePreview')}
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{t('inv_printNow')}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
