import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Building2, 
  MessageSquare, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  Landmark,
  QrCode,
  Trash2
} from 'lucide-react';
import { getOutlets, updateOutlet } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

// Helper to compress image
const compressImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const elem = document.createElement('canvas');
        const maxDimension = 1000;
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
        resolve(elem.toDataURL('image/jpeg', 0.85));
      };
    };
  });
};

export default function SettingsManager() {
  const { t } = useLanguage();
  const [outlet, setOutlet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    phone: '',
    whatsapp_number: '',
    bank_name: 'BCA',
    bank_account_number: '',
    bank_account_holder: '',
    secondary_bank: 'MANDIRI',
    secondary_account_number: '',
    secondary_account_holder: '',
    qris_merchant_name: '',
    qris_image: '',
    open_time: '08:00',
    close_time: '20:00'
  });

  useEffect(() => {
    loadOutletData();
  }, []);

  const loadOutletData = async () => {
    setLoading(true);
    try {
      const res = await getOutlets();
      if (res.data && res.data.length > 0) {
        const o = res.data[0];
        setOutlet(o);
        setFormData({
          name: o.name || 'AutoDetailing & Wash Hub Jakarta',
          address: o.address || 'Jl. Radio Dalam No. 88, Kebayoran Baru',
          city: o.city || 'Jakarta Selatan',
          phone: o.phone || '021-7288990',
          whatsapp_number: o.whatsapp_number || '081299887766',
          bank_name: o.bank_name || 'BCA',
          bank_account_number: o.bank_account_number || '8830-1928-3344',
          bank_account_holder: o.bank_account_holder || 'PT AUTOBENGKEL DETAILING',
          secondary_bank: o.secondary_bank || 'MANDIRI',
          secondary_account_number: o.secondary_account_number || '137-00-19283-44',
          secondary_account_holder: o.secondary_account_holder || 'PT AUTOBENGKEL DETAILING',
          qris_merchant_name: o.qris_merchant_name || 'AUTOBENGKEL DETAILING HUB',
          qris_image: o.qris_image || '',
          open_time: o.open_time || '08:00',
          close_time: o.close_time || '20:00'
        });
      }
    } catch (err) {
      setErrorMessage(t('st_loadFail') + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleQRISUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const compressed = await compressImage(file);
      setFormData(prev => ({ ...prev, qris_image: compressed }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!outlet?.id) return;
    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      await updateOutlet(outlet.id, formData);
      setSuccessMessage(t('st_saveSuccess'));
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setErrorMessage(t('st_saveFail') + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs">{t('st_loading')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-heading font-extrabold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-amber-400" />
          <span>{t('st_title')}</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          {t('st_sub')}
        </p>
      </div>

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* KELOMPOK 1: INFORMASI QRIS */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <QrCode className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-heading font-bold text-white uppercase tracking-wider">
              {t('st_qrisGroup')}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">{t('st_qrisMerchantName')}</label>
                <input
                  type="text"
                  value={formData.qris_merchant_name}
                  onChange={(e) => setFormData({ ...formData, qris_merchant_name: e.target.value })}
                  placeholder="cth: AUTOBENGKEL DETAILING HUB"
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">{t('st_qrisUpload')}</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleQRISUpload}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-cyan-500 file:text-slate-950 hover:file:bg-cyan-400 cursor-pointer"
                />
                <p className="text-[10px] text-slate-500 mt-1">{t('st_qrisHint')}</p>
              </div>

              {formData.qris_image && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, qris_image: '' })}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t('st_qrisDelete')}</span>
                </button>
              )}
            </div>

            {/* Preview Box QRIS */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t('st_qrisPreviewTitle')}</span>
              {formData.qris_image ? (
                <div className="bg-white p-3 rounded-2xl inline-block shadow-lg">
                  <img 
                    src={formData.qris_image} 
                    alt="QRIS Barcode" 
                    className="w-44 h-44 object-contain mx-auto"
                  />
                  <p className="text-[10px] font-black text-slate-900 mt-1 uppercase tracking-tight">{formData.qris_merchant_name || 'MERCHANT QRIS'}</p>
                  <p className="text-[8px] text-slate-500 font-bold">NMID: ID1020038912301</p>
                </div>
              ) : (
                <div className="w-44 h-44 rounded-2xl border-2 border-dashed border-slate-800 flex flex-col items-center justify-center mx-auto text-slate-600 gap-2">
                  <QrCode className="w-10 h-10" />
                  <span className="text-[10px]">{t('st_qrisNoImage')}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* KELOMPOK 2: REKENING BANK TRANSFER */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Landmark className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-heading font-bold text-white uppercase tracking-wider">
              {t('st_bankGroup')}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Bank Utama (BCA) */}
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">{t('st_bankPrimary')}</span>
              <div>
                <label className="block text-slate-400 font-medium mb-1">{t('st_bankName')}</label>
                <input
                  type="text"
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  placeholder="BCA"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">{t('st_accountNo')}</label>
                <input
                  type="text"
                  value={formData.bank_account_number}
                  onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
                  placeholder="8830-1928-3344"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-amber-300 font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">{t('st_accountHolder')}</label>
                <input
                  type="text"
                  value={formData.bank_account_holder}
                  onChange={(e) => setFormData({ ...formData, bank_account_holder: e.target.value })}
                  placeholder="PT AUTOBENGKEL DETAILING"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                />
              </div>
            </div>

            {/* Bank Sekunder (Mandiri/BNI/BRI) */}
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block">{t('st_bankSecondary')}</span>
              <div>
                <label className="block text-slate-400 font-medium mb-1">{t('st_secBankName')}</label>
                <input
                  type="text"
                  value={formData.secondary_bank}
                  onChange={(e) => setFormData({ ...formData, secondary_bank: e.target.value })}
                  placeholder="MANDIRI"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">{t('st_secAccountNo')}</label>
                <input
                  type="text"
                  value={formData.secondary_account_number}
                  onChange={(e) => setFormData({ ...formData, secondary_account_number: e.target.value })}
                  placeholder="137-00-19283-44"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-cyan-300 font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-400 font-medium mb-1">{t('st_secAccountHolder')}</label>
                <input
                  type="text"
                  value={formData.secondary_account_holder}
                  onChange={(e) => setFormData({ ...formData, secondary_account_holder: e.target.value })}
                  placeholder="PT AUTOBENGKEL DETAILING"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* KELOMPOK 3: KONTAK & WHATSAPP ADMIN */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-heading font-bold text-white uppercase tracking-wider">
              {t('st_contactGroup')}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 font-bold mb-1">{t('st_waAdmin')}</label>
              <input
                type="text"
                value={formData.whatsapp_number}
                onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                placeholder="081299887766"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-emerald-300 font-bold font-mono focus:outline-none focus:border-emerald-400"
              />
              <p className="text-[10px] text-slate-500 mt-1">{t('st_waHint')}</p>
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">{t('st_phoneOffice')}</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="021-7288990"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>
        </div>

        {/* KELOMPOK 4: PROFIL OUTLET & ALAMAT */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Building2 className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-heading font-bold text-white uppercase tracking-wider">
              {t('st_profileGroup')}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="block text-slate-400 font-bold mb-1">{t('st_workshopName')}</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="AutoDetailing & Wash Hub Jakarta"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400 font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">{t('st_fullAddress')}</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Jl. Radio Dalam No. 88, Kebayoran Baru"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">{t('st_city')}</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Jakarta Selatan"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">{t('st_openTime')}</label>
              <input
                type="time"
                value={formData.open_time}
                onChange={(e) => setFormData({ ...formData, open_time: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">{t('st_closeTime')}</label>
              <input
                type="time"
                value={formData.close_time}
                onChange={(e) => setFormData({ ...formData, close_time: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? t('st_saving') : t('st_saveAll')}</span>
          </button>
        </div>

      </form>

    </div>
  );
}
