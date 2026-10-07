import { useLanguage } from '../context/LanguageContext';
import React, { useState, useEffect } from 'react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  Car, 
  ShieldCheck, 
  CreditCard, 
  Sparkles,
  Landmark,
  Copy,
  Upload,
  MessageSquare,
  QrCode
} from 'lucide-react';
import { createBooking, uploadPaymentProof, fetchOutlets } from '../services/api';

// Helper to compress image before uploading
const compressImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const elem = document.createElement('canvas');
        const maxDimension = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        elem.width = width;
        elem.height = height;
        const ctx = elem.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(elem.toDataURL('image/jpeg', 0.8));
      };
    };
  });
};

const sizeGuides = {
  CAR: [
    { key: 'SMALL', label: 'Small', desc: 'Brio, Yaris, Jazz, Raize, Agya, March' },
    { key: 'MEDIUM', label: 'Medium', desc: 'Avanza, Xpander, HR-V, Innova, Civic, BR-V' },
    { key: 'LARGE', label: 'Large', desc: 'Fortuner, Pajero Sport, CR-V, Palisade, CX-8' },
    { key: 'LUXURY', label: 'Luxury / Super', desc: 'Alphard, Vellfire, Land Cruiser, Porsche, Defender' }
  ],
  MOTORCYCLE: [
    { key: 'SMALL', label: 'Small Bike', desc: 'Beat, Scoopy, Vario 125, Mio, Fazzio' },
    { key: 'MEDIUM', label: 'Maxi Matic', desc: 'NMAX, PCX, ADV, Aerox, Vario 160' },
    { key: 'LARGE', label: 'Sport Bike', desc: 'CBR250RR, R25, Ninja 250, MT-25, XSR155' },
    { key: 'LUXURY', label: 'Big Bike / Moge', desc: 'Harley Davidson, BMW GS, Ducati, Kawasaki ZX-6R' }
  ]
};

export default function BookingWizard({ isOpen, onClose, outlets = [], selectedOutletId = 1, userAssignedOutlet = null, currentUser = null, services = [], preSelectedService, onBookingSuccess }) {
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState(null);

  // Upload proof state
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState('');
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofUploaded, setProofUploaded] = useState(false);
  const [copiedBank, setCopiedBank] = useState('');
  const [paymentMethodTab, setPaymentMethodTab] = useState('QRIS'); // 'QRIS' or 'BANK'

  // Form State
  const [formData, setFormData] = useState({
    outlet_id: userAssignedOutlet || selectedOutletId || 1,
    vehicle_type: 'CAR',
    vehicle_size: 'MEDIUM',
    vehicle_brand_model: '',
    license_plate: '',
    vehicle_color: '',
    selectedServices: [],
    scheduled_date: new Date().toISOString().split('T')[0],
    scheduled_time: '09:00',
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    payment_choice: 'DP', // 'DP' or 'FULL'
    deposit_amount: 0
  });

  const [freshOutlet, setFreshOutlet] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (userAssignedOutlet) {
        setFormData(prev => ({ ...prev, outlet_id: Number(userAssignedOutlet) }));
      } else if (selectedOutletId) {
        setFormData(prev => ({ ...prev, outlet_id: Number(selectedOutletId) }));
      }
    }
  }, [isOpen, selectedOutletId, userAssignedOutlet]);

  useEffect(() => {
    if (isOpen) {
      fetchOutlets().then(res => {
        if (res.data && res.data.length > 0) {
          const match = res.data.find(o => parseInt(o.id) === parseInt(formData.outlet_id || selectedOutletId));
          setFreshOutlet(match || res.data[0]);
        }
      }).catch(err => console.error('Error fetching latest outlet for wizard:', err));
    }
  }, [isOpen, formData.outlet_id, selectedOutletId]);

  const currentOutlet = outlets.find(o => parseInt(o.id) === parseInt(formData.outlet_id || selectedOutletId)) || freshOutlet || outlets[0] || {};

  // Dynamically generate time slots based on outlet operating hours (open_time & close_time)
  const getTimeSlots = () => {
    const openStr = currentOutlet.open_time || '08:00';
    const closeStr = currentOutlet.close_time || '21:00';

    let startHour = parseInt(openStr.split(':')[0], 10);
    let endHour = parseInt(closeStr.split(':')[0], 10);

    if (isNaN(startHour)) startHour = 8;
    if (isNaN(endHour)) endHour = 21;

    // Handle 00:00 midnight closing or 24h operation
    if (endHour <= startHour && endHour !== 0) {
      endHour = 22;
    } else if (endHour === 0) {
      endHour = 24;
    }

    const slots = [];
    for (let h = startHour; h <= endHour; h++) {
      const hourStr = (h === 24 ? 0 : h).toString().padStart(2, '0');
      slots.push(`${hourStr}:00`);
    }

    return slots.length > 0 ? slots : ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleCloseWizard();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (preSelectedService) {
      setFormData(prev => ({
        ...prev,
        vehicle_type: preSelectedService.vehicle_type || 'CAR',
        selectedServices: [preSelectedService.id]
      }));
    }
  }, [preSelectedService]);

  const handleCloseWizard = () => {
    setSuccessData(null);
    setStep(1);
    setProofPreview('');
    setProofUploaded(false);
    onClose();
  };

  if (!isOpen) return null;

  // Filter Services by Vehicle Type
  const availableServices = services.filter(s => s.vehicle_type === formData.vehicle_type);

  // Calculate pricing based on vehicle size
  const calculateTotal = () => {
    return formData.selectedServices.reduce((total, serviceId) => {
      const s = services.find(item => item.id === serviceId);
      if (!s) return total;
      const pricing = s.pricing?.find(p => p.size_category === formData.vehicle_size);
      return total + (pricing ? parseFloat(pricing.price) : 0);
    }, 0);
  };

  const totalAmount = calculateTotal();
  const minDeposit = Math.round(totalAmount * 0.3); // 30% DP

  const handleServiceToggle = (id) => {
    setFormData(prev => {
      const exists = prev.selectedServices.includes(id);
      if (exists) {
        return { ...prev, selectedServices: prev.selectedServices.filter(sId => sId !== id) };
      } else {
        return { ...prev, selectedServices: [...prev.selectedServices, id] };
      }
    });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setProofFile(file);
      const compressedBase64 = await compressImage(file);
      setProofPreview(compressedBase64);
    }
  };

  const handleUploadProof = async () => {
    if (!proofPreview || !successData?.bookingId) return;
    setUploadingProof(true);
    try {
      await uploadPaymentProof(successData.bookingId, proofPreview);
      setProofUploaded(true);
    } catch (err) {
      alert('Gagal mengunggah bukti transfer: ' + (err.response?.data?.error || err.message));
    } finally {
      setUploadingProof(false);
    }
  };

  const handleCopyText = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedBank(type);
    setTimeout(() => setCopiedBank(''), 3000);
  };

  const handleSubmitBooking = async () => {
    if (!formData.customer_name?.trim() || !formData.customer_phone?.trim()) {
      alert('Mohon lengkapi Nama dan Nomor WhatsApp!');
      return;
    }
    if (!formData.license_plate?.trim()) {
      alert('Mohon lengkapi Nomor Polisi (Plat)!');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        outlet_id: Number(formData.outlet_id || selectedOutletId || 1),
        customer_name: formData.customer_name.trim(),
        customer_phone: formData.customer_phone.trim(),
        customer_email: formData.customer_email?.trim() || '',
        vehicle_type: formData.vehicle_type,
        vehicle_brand_model: formData.vehicle_brand_model?.trim() || 'Standard',
        vehicle_size: formData.vehicle_size,
        license_plate: formData.license_plate.trim().toUpperCase(),
        vehicle_color: formData.vehicle_color?.trim() || '',
        scheduled_date: formData.scheduled_date,
        scheduled_time: formData.scheduled_time,
        services: formData.selectedServices,
        deposit_amount: formData.payment_choice === 'DP' ? minDeposit : totalAmount,
        booking_source: userAssignedOutlet ? 'STAFF' : 'ONLINE',
        payment_proof: proofPreview || null
      };

      const res = await createBooking(payload);
      setSuccessData({
        bookingId: res.data.bookingId,
        bookingCode: res.data.bookingCode,
        totalAmount: totalAmount,
        depositAmount: payload.deposit_amount,
        paymentChoice: formData.payment_choice
      });

      if (onBookingSuccess) onBookingSuccess();
    } catch (err) {
      alert('Gagal membuat booking: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  // WA format
  const rawWa = currentOutlet.whatsapp_number || '081299887766';
  const cleanWa = rawWa.replace(/^0/, '62').replace(/[^0-9]/g, '');
  const transferAmount = successData?.depositAmount || minDeposit;
  const transferAmountStr = transferAmount.toLocaleString('id-ID');
  
  const waMessage = successData ? encodeURIComponent(
    `Halo Admin AutoDetailing, saya telah melakukan booking online:\n\n` +
    `📌 *No. Booking:* ${successData.bookingCode}\n` +
    `👤 *Nama:* ${formData.customer_name}\n` +
    `🚗 *Kendaraan:* ${formData.vehicle_brand_model} (${formData.license_plate})\n` +
    `📅 *Jadwal:* ${formData.scheduled_date} jam ${formData.scheduled_time} WIB\n` +
    `💳 *Pembayaran:* ${successData.paymentChoice === 'DP' ? 'Uang Muka (DP 30%)' : 'Lunas (100%)'} Rp ${transferAmountStr}\n\n` +
    `Mohon dikonfirmasi ya, terima kasih!`
  ) : '';
  const waUrl = `https://wa.me/${cleanWa}?text=${waMessage}`;

  const sampleQRISFallback = 'https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=00020101021126580014ID.CO.QRIS.WWW011893600002011234567802150000000000000010303UMI51440014ID.CO.QRIS.WWW02150000000000000010303UMI5204581253033605802ID5921AUTOBENGKEL DETAILING6007JAKARTA61051214062070703A016304E8A9';
  const mainOutlet = outlets.find(o => parseInt(o.id) === 1) || outlets[0] || {};
  
  const qrisImg = currentOutlet.qris_image || mainOutlet.qris_image || sampleQRISFallback;
  const qrisMerchantName = currentOutlet.qris_merchant_name || mainOutlet.qris_merchant_name || 'AUTOBENGKEL DETAILING HUB';

  const bankName = currentOutlet.bank_name || mainOutlet.bank_name || 'Bank Central Asia (BCA)';
  const bankAccount = currentOutlet.bank_account_number || mainOutlet.bank_account_number || '8830-1928-3344';
  const bankHolder = currentOutlet.bank_account_holder || mainOutlet.bank_account_holder || 'PT AUTOBENGKEL DETAILING';

  const secBankName = currentOutlet.secondary_bank || mainOutlet.secondary_bank || '';
  const secBankAccount = currentOutlet.secondary_account_number || mainOutlet.secondary_account_number || '';
  const secBankHolder = currentOutlet.secondary_account_holder || mainOutlet.secondary_account_holder || '';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleCloseWizard();
      }}
    >
      <div 
        className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-5 sm:p-8 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header Close Button */}
        <button 
          onClick={handleCloseWizard} 
          className="absolute top-4 right-4 sm:top-6 sm:right-6 z-30 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 transition cursor-pointer"
          title="Tutup Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {!successData ? (
          <div>
            {/* Step Indicator */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">{t('bw_stepOf', { step })}</span>
                <h2 className="text-lg sm:text-xl font-heading font-black text-white">
                  {step === 1 && t('bw_step1Title')}
                  {step === 2 && t('bw_step2Title')}
                  {step === 3 && t('bw_step3Title')}
                </h2>
              </div>

              <div className="flex items-center gap-1.5">
                {[1, 2, 3].map(i => (
                  <div 
                    key={i} 
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
                      step === i 
                        ? 'bg-amber-500 text-slate-950' 
                        : step > i 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {step > i ? '✓' : i}
                  </div>
                ))}
              </div>
            </div>

            {/* STEP 1: Pilih Tipe Kendaraan & Layanan */}
            {step === 1 && (
              <div className="space-y-4 text-xs">
                {/* Branch Selection */}
                <div>
                  <label className="block text-slate-300 font-bold mb-1 uppercase tracking-wider text-[10px]">
                    {t('bw_branchLabel')}
                  </label>
                  {userAssignedOutlet ? (
                    <div className="w-full bg-slate-950/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-amber-400 font-bold text-xs flex items-center justify-between opacity-95">
                      <span>📍 {currentOutlet.name || 'Cabang Saya'} ({currentOutlet.city || 'Cabang'})</span>
                      <span className="text-[9px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30 uppercase font-mono font-bold">{t('bw_lockedBranch')}</span>
                    </div>
                  ) : (
                    <select
                      value={formData.outlet_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, outlet_id: Number(e.target.value) }))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-amber-400 font-bold text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
                    >
                      {outlets.map(o => (
                        <option key={o.id} value={o.id} className="bg-slate-900 text-white">
                          📍 {o.name} ({o.city || 'Cabang'})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Switch Tipe Kendaraan */}
                <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-950/60 rounded-2xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, vehicle_type: 'CAR', selectedServices: [] }))}
                    className={`py-2.5 rounded-xl font-extrabold flex items-center justify-center gap-2 transition cursor-pointer ${
                      formData.vehicle_type === 'CAR' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Car className="w-4 h-4" />
                    <span>{t('bw_vCar')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, vehicle_type: 'MOTORCYCLE', selectedServices: [] }))}
                    className={`py-2.5 rounded-xl font-extrabold flex items-center justify-center gap-2 transition cursor-pointer ${
                      formData.vehicle_type === 'MOTORCYCLE' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{t('bw_vMoto')}</span>
                  </button>
                </div>

                {/* List Layanan */}
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {availableServices.map(srv => {
                    const isSelected = formData.selectedServices.includes(srv.id);
                    const pricing = srv.pricing?.find(p => p.size_category === formData.vehicle_size);
                    const priceVal = pricing ? parseFloat(pricing.price) : 0;

                    return (
                      <div
                        key={srv.id}
                        onClick={() => handleServiceToggle(srv.id)}
                        className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected 
                            ? 'bg-amber-500/10 border-amber-500/60 text-white shadow-sm' 
                            : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex-1">
                          <p className="font-bold text-xs text-white">{srv.name}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{srv.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-heading font-black text-amber-400 text-xs">Rp {priceVal.toLocaleString('id-ID')}</p>
                          <span className={`text-[9px] px-2 py-0.5 rounded-md font-bold uppercase inline-block mt-0.5 ${
                            isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-700 text-slate-300'
                          }`}>
                            {isSelected ? t('bw_selected') : t('bw_add')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 2: Ukuran Kendaraan & Jadwal Kedatangan */}
            {step === 2 && (
              <div className="space-y-4 text-xs">
                {/* Panduan Ukuran */}
                <div>
                  <label className="block text-slate-400 text-[10px] font-bold uppercase mb-2">{t('bw_sizeLabel')}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {sizeGuides[formData.vehicle_type]?.map(g => (
                      <button
                        key={g.key}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, vehicle_size: g.key }))}
                        className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                          formData.vehicle_size === g.key
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-sm'
                            : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <p className="font-bold text-white text-xs">{g.label}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{g.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Form Jadwal & Kendaraan */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 text-[10px] font-bold uppercase mb-1">{t('bw_dateLabel')}</label>
                    <input
                      type="date"
                      value={formData.scheduled_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, scheduled_date: e.target.value }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] font-bold uppercase mb-1">{t('bw_timeLabel')}</label>
                    <input
                      type="time"
                      value={formData.scheduled_time}
                      onChange={(e) => setFormData(prev => ({ ...prev, scheduled_time: e.target.value }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400 font-bold cursor-pointer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 text-[10px] font-bold uppercase mb-1">{t('bw_brandLabel')}</label>
                    <input
                      type="text"
                      placeholder={t('bw_brandPh')}
                      value={formData.vehicle_brand_model}
                      onChange={(e) => setFormData(prev => ({ ...prev, vehicle_brand_model: e.target.value }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] font-bold uppercase mb-1">{t('bw_plateLabel')}</label>
                    <input
                      type="text"
                      placeholder={t('bw_platePh')}
                      value={formData.license_plate}
                      onChange={(e) => setFormData(prev => ({ ...prev, license_plate: e.target.value }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400 uppercase font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] font-bold uppercase mb-1">{t('bw_colorLabel')}</label>
                  <input
                    type="text"
                    placeholder={t('bw_colorPh')}
                    value={formData.vehicle_color}
                    onChange={(e) => setFormData(prev => ({ ...prev, vehicle_color: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            )}

            {/* STEP 3: Kontak & Pembayaran */}
            {step === 3 && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 text-[10px] font-bold uppercase mb-1">{t('bw_ownerName')}</label>
                    <input
                      type="text"
                      required
                      placeholder={t('bw_ownerNamePh')}
                      value={formData.customer_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] font-bold uppercase mb-1">{t('bw_ownerPhone')}</label>
                    <input
                      type="tel"
                      required
                      placeholder={t('bw_ownerPhonePh')}
                      value={formData.customer_phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, customer_phone: e.target.value }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] font-bold uppercase mb-1">{t('bw_ownerEmail')}</label>
                  <input
                    type="email"
                    placeholder={t('bw_ownerEmailPh')}
                    value={formData.customer_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, customer_email: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Pilihan Bayar DP / Lunas */}
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">{t('bw_payChoiceGroup')}</span>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, payment_choice: 'DP' }))}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        formData.payment_choice === 'DP'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      <p className="font-bold text-xs">{t('bw_payDp')}</p>
                      <p className="text-[11px] font-extrabold text-amber-400 mt-1">Rp {minDeposit.toLocaleString('id-ID')}</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, payment_choice: 'FULL' }))}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        formData.payment_choice === 'FULL'
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      <p className="font-bold text-xs">{t('bw_payFull')}</p>
                      <p className="text-[11px] font-extrabold text-emerald-400 mt-1">Rp {totalAmount.toLocaleString('id-ID')}</p>
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* Bottom Nav Actions */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(prev => prev - 1)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>{t('btnBack')}</span>
                </button>
              ) : <div />}

              {step < 3 ? (
                <button
                  type="button"
                  disabled={step === 1 && formData.selectedServices.length === 0}
                  onClick={() => setStep(prev => prev + 1)}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                >
                  <span>{t('bw_next')}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={loading || !formData.customer_name || !formData.customer_phone}
                  onClick={handleSubmitBooking}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs flex items-center gap-2 shadow-xl shadow-amber-500/20 transition cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{loading ? t('bw_processing') : t('bw_confirmSubmit')}</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          
          /* SUCCESS MODAL AFTER BOOKING (QRIS + BANK INTEGRATION) */
          <div className="pt-4 sm:pt-2 space-y-6 text-center animate-fadeIn text-xs">
            {/* Success Header Hero Card */}
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-emerald-500/15 via-slate-900/80 to-slate-900 border border-emerald-500/30 text-center space-y-3 relative overflow-hidden shadow-xl">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span className="text-[11px] font-extrabold text-emerald-400 uppercase tracking-widest block">
                  {t('bw_successTitle')}
                </span>
                
                {/* Highlighted Booking Code Badge */}
                <div className="mt-3 inline-flex items-center gap-2 bg-slate-950 border border-amber-500/50 px-5 py-2.5 rounded-2xl shadow-inner">
                  <span className="text-xs font-bold text-slate-400">{t('bw_codeLabel')}</span>
                  <span className="text-xl sm:text-2xl font-mono font-black text-amber-400 tracking-wider">
                    {successData.bookingCode}
                  </span>
                </div>

                <p className="text-slate-300 text-xs mt-3 max-w-md mx-auto leading-relaxed">
                  {t('bw_successSub')}
                </p>
              </div>
            </div>

            {/* TAB METODE PEMBAYARAN (QRIS VS REKENING BANK) */}
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-left space-y-4">
              <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-amber-400" />
                  <span>{t('bw_payMethodTitle')}</span>
                </span>
                <span className="text-xs font-black text-amber-300 font-heading">
                  {t('bw_billTotal', { amt: transferAmountStr })}
                </span>
              </div>

              {/* Tab Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setPaymentMethodTab('QRIS')}
                  className={`py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    paymentMethodTab === 'QRIS'
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  <span>{t('bw_tabQris')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethodTab('BANK')}
                  className={`py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    paymentMethodTab === 'BANK'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Landmark className="w-4 h-4" />
                  <span>{t('bw_tabBank')}</span>
                </button>
              </div>

              {/* TAMPILAN QRIS */}
              {paymentMethodTab === 'QRIS' && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-3 animate-fadeIn">
                  <div className="bg-white p-3.5 rounded-2xl inline-block shadow-xl">
                    <img 
                      src={qrisImg} 
                      alt="QRIS AutoBengkel" 
                      className="w-44 h-44 sm:w-48 sm:h-48 object-contain mx-auto"
                    />
                    <p className="text-[10px] font-black text-slate-950 mt-1 uppercase tracking-tight">
                      {qrisMerchantName}
                    </p>
                    <p className="text-[8px] text-slate-500 font-bold">NMID: ID1020038912301 • QRIS STATIS / DINAMIS</p>
                  </div>
                  <p className="text-[11px] text-slate-300 font-medium max-w-sm mx-auto">
                    {t('bw_qrisInstruction')}
                  </p>
                </div>
              )}

              {/* TAMPILAN REKENING TRANSFER BANK */}
              {paymentMethodTab === 'BANK' && (
                <div className="space-y-2 animate-fadeIn">
                  {/* Bank 1 */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div>
                      <p className="font-bold text-white text-xs">{bankName}</p>
                      <p className="font-mono text-amber-300 font-extrabold text-sm">{bankAccount}</p>
                      <p className="text-[10px] text-slate-400">a/n {bankHolder}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopyText(bankAccount, 'bca')}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedBank === 'bca' ? t('bw_copied') : t('bw_copy')}</span>
                    </button>
                  </div>

                  {/* Bank 2 (Optional) */}
                  {secBankName && secBankAccount && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                      <div>
                        <p className="font-bold text-white text-xs">{secBankName}</p>
                        <p className="font-mono text-cyan-300 font-extrabold text-sm">{secBankAccount}</p>
                        <p className="text-[10px] text-slate-400">a/n {secBankHolder}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyText(secBankAccount, 'mandiri')}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedBank === 'mandiri' ? t('bw_copied') : t('bw_copy')}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* WIDGET UPLOAD BUKTI TRANSFER */}
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-left space-y-3">
              <span className="font-bold text-slate-300 flex items-center gap-1.5 text-xs">
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>{t('bw_proofGroup')}</span>
              </span>

              {proofUploaded ? (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center gap-2 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{t('bw_proofSuccess')}</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 cursor-pointer"
                  />

                  {proofPreview && (
                    <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <img src={proofPreview} alt="Preview Bukti" className="w-12 h-12 object-cover rounded-lg border border-slate-700" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-white truncate">{proofFile?.name}</p>
                        <p className="text-[10px] text-emerald-400">{t('bw_proofReady')}</p>
                      </div>
                      <button
                        type="button"
                        disabled={uploadingProof}
                        onClick={handleUploadProof}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition cursor-pointer"
                      >
                        {uploadingProof ? t('bw_uploading') : t('bw_uploadBtn')}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ACTION BUTTONS (WA LINK & CLOSE) */}
            <div className="space-y-2 pt-2">
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{t('bw_waBtn')}</span>
              </a>

              <button
                type="button"
                onClick={handleCloseWizard}
                className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition cursor-pointer"
              >
                {t('bw_finishClose')}
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
