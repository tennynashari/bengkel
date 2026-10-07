import { useLanguage } from '../context/LanguageContext';
import React, { useState, useEffect } from 'react';
import { 
  X, 
  Search, 
  Car, 
  Clock, 
  ShieldCheck, 
  CheckCircle, 
  CheckCircle2, 
  Wrench, 
  AlertTriangle, 
  FileText, 
  Image as ImageIcon, 
  Landmark, 
  Copy, 
  Upload, 
  MessageSquare, 
  CreditCard, 
  Sparkles, 
  QrCode 
} from 'lucide-react';
import { trackBooking, uploadPaymentProof, fetchOutlets } from '../services/api';

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

const statusSteps = [
  { key: 'BOOKED', label: 'Terkonfirmasi' },
  { key: 'CHECKED_IN', label: 'Inspeksi Masuk' },
  { key: 'IN_PROGRESS', label: 'Dalam Pengerjaan Pit' },
  { key: 'QC', label: 'Quality Control' },
  { key: 'READY', label: 'Siap Diambil' },
  { key: 'COMPLETED', label: 'Selesai' }
];

export default function StatusTrackerModal({ isOpen, onClose, initialCode }) {
  const { t } = useLanguage();
  const [searchCode, setSearchCode] = useState(initialCode || '');
  const [bookingData, setBookingData] = useState(null);
  const [outletData, setOutletData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Upload proof state
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState('');
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofUploaded, setProofUploaded] = useState(false);
  const [copiedBank, setCopiedBank] = useState('');
  const [paymentTab, setPaymentTab] = useState('QRIS'); // 'QRIS' or 'BANK'

  // Fetch fresh outlet info when modal is open
  useEffect(() => {
    if (isOpen) {
      fetchOutlets().then(res => {
        if (res.data && res.data.length > 0) {
          setOutletData(res.data[0]);
        }
      }).catch(err => console.error('Error fetching outlet info:', err));
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (initialCode) {
      setSearchCode(initialCode);
      handleSearch(initialCode);
    }
  }, [initialCode]);

  const handleClose = () => {
    setBookingData(null);
    setSearchCode('');
    setError('');
    setProofPreview('');
    setProofUploaded(false);
    onClose();
  };

  if (!isOpen) return null;

  const handleSearch = async (codeToSearch) => {
    const code = codeToSearch || searchCode;
    if (!code) return;
    setLoading(true);
    setError('');
    try {
      const res = await trackBooking(code);
      setBookingData(res.data);
      setProofUploaded(false);
      setProofPreview('');
    } catch (err) {
      setError(err.response?.data?.error || 'Data booking atau plat nomor tidak ditemukan.');
      setBookingData(null);
    } finally {
      setLoading(false);
    }
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
    if (!proofPreview || !bookingData?.booking?.id) return;
    setUploadingProof(true);
    try {
      await uploadPaymentProof(bookingData.booking.id, proofPreview);
      setProofUploaded(true);
      // Refresh status
      handleSearch(bookingData.booking.booking_code);
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

  const getStepIndex = (status) => {
    return statusSteps.findIndex(s => s.key === status);
  };

  const currentStepIdx = bookingData ? getStepIndex(bookingData.booking.status) : 0;
  const b = bookingData?.booking;

  // WA format
  const rawWa = b?.outlet_wa || outletData?.whatsapp_number || '081299887766';
  const cleanWa = rawWa.replace(/^0/, '62').replace(/[^0-9]/g, '');
  const waMessage = b ? encodeURIComponent(
    `Halo Admin AutoDetailing, saya ingin konfirmasi status booking dan pembayaran:\n\n` +
    `📌 *No. Booking:* ${b.booking_code}\n` +
    `👤 *Nama:* ${b.customer_name}\n` +
    `🚗 *Kendaraan:* ${b.vehicle_brand_model} (${b.license_plate})\n` +
    `Status pengerjaan: ${b.status}\n` +
    `Status bayar: ${b.payment_status}\n\n` +
    `Terima kasih!`
  ) : '';
  const waUrl = `https://wa.me/${cleanWa}?text=${waMessage}`;

  const totalAmount = parseFloat(b?.total_amount || 0);
  const depositAmount = parseFloat(b?.deposit_amount || 0);
  const isFullyPaid = b?.payment_status === 'FULLY_PAID' || b?.payment_status === 'PAID';
  const isDpPaid = b?.payment_status === 'DP_PAID';
  const remainingAmount = isFullyPaid ? 0 : Math.max(0, totalAmount - depositAmount);

  // QRIS Image resolution
  const sampleQRISFallback = 'https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=00020101021126580014ID.CO.QRIS.WWW011893600002011234567802150000000000000010303UMI51440014ID.CO.QRIS.WWW02150000000000000010303UMI5204581253033605802ID5921AUTOBENGKEL DETAILING6007JAKARTA61051214062070703A016304E8A9';
  const qrisImg = b?.qris_image || outletData?.qris_image || sampleQRISFallback;
  const merchantName = b?.qris_merchant_name || outletData?.qris_merchant_name || 'AUTOBENGKEL DETAILING HUB';

  const bankName = b?.bank_name || outletData?.bank_name || 'BCA';
  const bankAccNum = b?.bank_account_number || outletData?.bank_account_number || '8830-1928-3344';
  const bankAccHolder = b?.bank_account_holder || outletData?.bank_account_holder || 'PT AUTOBENGKEL DETAILING';

  const secondaryBank = b?.secondary_bank || outletData?.secondary_bank;
  const secondaryAccNum = b?.secondary_account_number || outletData?.secondary_account_number;
  const secondaryAccHolder = b?.secondary_account_holder || outletData?.secondary_account_holder;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div 
        className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8 text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header Close Button */}
        <button 
          onClick={handleClose} 
          className="absolute top-6 right-6 text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
          title="Tutup Modal Tracker"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1 mb-6">
          <h2 className="text-xl font-heading font-black text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            <span>Live Status Tracker & Pembayaran</span>
          </h2>
          <p className="text-xs text-slate-400">Pantau progres pengerjaan di Pit, detail inspeksi, scan barcode QRIS, dan konfirmasi bukti transfer.</p>
        </div>

        {/* Search Input Bar */}
        <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Masukkan Kode Booking (cth: WEB-12345) atau Plat Nomor..."
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-2xl text-xs text-white uppercase focus:outline-none focus:border-amber-400 font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs transition cursor-pointer"
          >
            {loading ? 'Mencari...' : 'Lacak Status'}
          </button>
        </form>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2 mb-6">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* DETAIL HASIL LACAK */}
        {bookingData && b && (
          <div className="space-y-6 animate-fadeIn text-xs">
            
            {/* Header Info Kendaraan */}
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-heading font-black text-amber-400 text-base">{b.booking_code}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 font-mono font-bold text-slate-200">
                    {b.license_plate}
                  </span>
                </div>
                <p className="text-white font-bold text-sm mt-0.5">{b.vehicle_brand_model}</p>
                <p className="text-[11px] text-slate-400">Pemilik: {b.customer_name} ({b.customer_phone})</p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[10px] text-slate-400 block">Lokasi & Mekanik:</span>
                <span className="font-bold text-cyan-400">{b.bay_name || 'Menunggu Alokasi Pit'}</span>
                <span className="text-slate-300 block text-[11px]">{b.mechanic_name || 'Tim Detailer'}</span>
              </div>
            </div>

            {/* Stepper Status Realtime */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">Tahapan Pengerjaan di Bengkel</span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {statusSteps.map((step, idx) => {
                  const isDone = idx <= currentStepIdx;
                  const isCurrent = idx === currentStepIdx;
                  return (
                    <div 
                      key={step.key} 
                      className={`p-2.5 rounded-xl border text-center transition ${
                        isCurrent 
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-extrabold shadow-sm'
                          : isDone
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-500'
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full mx-auto mb-1 flex items-center justify-center text-[10px]">
                        {isDone ? <CheckCircle className="w-3.5 h-3.5" /> : idx + 1}
                      </div>
                      <p className="text-[10px] leading-tight truncate">{step.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* STATUS PEMBAYARAN (RINCIAN JELAS & PROPORSIONAL) */}
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-4 text-left">
              <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-amber-400" />
                  <span>Rincian Pembayaran</span>
                </span>
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                  isFullyPaid 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : isDpPaid
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {isFullyPaid ? '✅ LUNAS (PAID)' : isDpPaid ? '🟡 DP TERBAYAR' : '⏳ BELUM DIBAYAR'}
                </span>
              </div>

              {/* Logika Tampilan Rincian Biaya */}
              {isFullyPaid ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Total Biaya Layanan:</span>
                    <span className="font-bold text-white">Rp {totalAmount.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-xs text-emerald-400 font-bold">
                    <span>Total Terbayar:</span>
                    <span>Rp {totalAmount.toLocaleString('id-ID')} (100% LUNAS)</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-emerald-300 border-t border-slate-700 pt-1">
                    <span>Sisa Tagihan:</span>
                    <span>Rp 0 (LUNAS)</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] flex items-center gap-2 mt-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>Pembayaran telah diverifikasi lunas sepenuhnya oleh kasir bengkel.</span>
                  </div>
                </div>
              ) : isDpPaid ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Total Biaya Layanan:</span>
                    <span className="font-bold text-white">Rp {totalAmount.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-xs text-emerald-400 font-bold">
                    <span>Uang Muka (DP) Terbayar:</span>
                    <span>- Rp {depositAmount.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-amber-300 border-t border-slate-700 pt-1">
                    <span>Sisa Pelunasan di Kasir:</span>
                    <span>Rp {remainingAmount.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-center gap-2 mt-2">
                    <Sparkles className="w-4 h-4 flex-shrink-0" />
                    <span>DP telah diterima. Sisa tagihan dapat dilunasi saat serah terima kendaraan via QRIS atau kasir.</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Total Biaya Layanan:</span>
                    <span className="font-bold text-white">Rp {totalAmount.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-amber-300 border-t border-slate-700 pt-1">
                    <span>Jumlah yang Harus Ditransfer:</span>
                    <span>Rp {depositAmount > 0 ? depositAmount.toLocaleString('id-ID') : totalAmount.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              )}

              {/* Status Bukti Transfer jika sudah terkirim */}
              {b.payment_proof && (
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                  <img src={b.payment_proof} alt="Bukti Transfer" className="w-12 h-12 object-cover rounded-lg border border-slate-700 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Bukti Transfer Telah Terkirim</span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {isFullyPaid ? 'Telah diverifikasi lunas.' : isDpPaid ? 'DP telah diverifikasi valid.' : 'Sedang diverifikasi oleh staff kasir kami.'}
                    </p>
                  </div>
                </div>
              )}

              {/* SECTION METODE PEMBAYARAN (QRIS & BANK) - TAMPIL JIKA BELUM LUNAS */}
              {!isFullyPaid && (
                <div className="space-y-3 pt-2 border-t border-slate-700/60">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pilih Metode Pembayaran / Pelunasan</span>
                    <span className="text-[11px] font-bold text-amber-300 font-mono">
                      {isDpPaid ? ('Sisa: Rp ' + remainingAmount.toLocaleString('id-ID')) : ('Tagihan: Rp ' + (depositAmount || totalAmount).toLocaleString('id-ID'))}
                    </span>
                  </div>

                  {/* Pilihan Tab QRIS vs Bank */}
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setPaymentTab('QRIS')}
                      className={`py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        paymentTab === 'QRIS'
                          ? 'bg-cyan-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <QrCode className="w-4 h-4" />
                      <span>📱 Scan Barcode QRIS</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentTab('BANK')}
                      className={`py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        paymentTab === 'BANK'
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Landmark className="w-4 h-4" />
                      <span>🏦 Transfer Bank</span>
                    </button>
                  </div>

                  {/* TAMPILAN QRIS */}
                  {paymentTab === 'QRIS' && (
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-2.5 animate-fadeIn">
                      <div className="bg-white p-3 rounded-2xl inline-block shadow-xl">
                        <img 
                          src={qrisImg} 
                          alt="QRIS Barcode Bengkel" 
                          className="w-44 h-44 sm:w-48 sm:h-48 object-contain mx-auto"
                        />
                        <p className="text-[10px] font-black text-slate-950 mt-1 uppercase tracking-tight">
                          {merchantName}
                        </p>
                        <p className="text-[8px] text-slate-500 font-bold">NMID: ID1020038912301 • QRIS ALL PAYMENT</p>
                      </div>
                      <p className="text-[11px] text-slate-300 font-medium">
                        Buka aplikasi mobile banking atau e-wallet (BCA, Mandiri, GoPay, OVO, Dana, ShopeePay), lalu scan barcode di atas.
                      </p>
                    </div>
                  )}

                  {/* TAMPILAN BANK TRANSFER */}
                  {paymentTab === 'BANK' && (
                    <div className="space-y-2 animate-fadeIn">
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-white text-xs">{bankName}</p>
                          <p className="font-mono text-amber-300 font-bold text-xs">{bankAccNum}</p>
                          <p className="text-[10px] text-slate-400">a/n {bankAccHolder}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyText(bankAccNum, 'bca_track')}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 text-amber-400 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedBank === 'bca_track' ? 'Tersalin' : 'Salin'}</span>
                        </button>
                      </div>

                      {secondaryBank && secondaryAccNum && (
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-white text-xs">{secondaryBank}</p>
                            <p className="font-mono text-cyan-300 font-bold text-xs">{secondaryAccNum}</p>
                            <p className="text-[10px] text-slate-400">a/n {secondaryAccHolder}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopyText(secondaryAccNum, 'secondary_track')}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 text-cyan-400 font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                          >
                            <Copy className="w-3 h-3" />
                            <span>{copiedBank === 'secondary_track' ? 'Tersalin' : 'Salin'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Form Upload Bukti Transfer */}
                  <div className="pt-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Upload Bukti Pembayaran / Pelunasan
                    </p>
                    {proofUploaded ? (
                      <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold text-xs">
                        Bukti transfer berhasil diunggah! Staff kasir kami akan segera memverifikasi.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="w-full text-xs text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 cursor-pointer"
                        />
                        {proofPreview && (
                          <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-900 border border-slate-800">
                            <img src={proofPreview} alt="Preview" className="w-10 h-10 object-cover rounded-lg border border-slate-700" />
                            <button
                              type="button"
                              disabled={uploadingProof}
                              onClick={handleUploadProof}
                              className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition cursor-pointer"
                            >
                              {uploadingProof ? 'Mengunggah...' : 'Kirim Bukti Transfer'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>

            {/* ACTION BUTTONS (WA LINK & CLOSE) */}
            <div className="space-y-2 pt-2">
              <a
                href={waUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>💬 Hubungi Admin WhatsApp Bengkel</span>
              </a>

              <button
                type="button"
                onClick={handleClose}
                className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition cursor-pointer"
              >
                Tutup Pelacakan
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
