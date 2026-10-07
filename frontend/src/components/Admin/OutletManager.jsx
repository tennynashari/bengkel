import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Plus, 
  Edit, 
  X, 
  Save, 
  CreditCard
} from 'lucide-react';
import { createOutlet, updateOutlet } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

export default function OutletManager({ outlets = [], onRefresh }) {
  const { t } = useLanguage();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    address: '',
    city: 'Jakarta',
    phone: '',
    bca_account_number: '',
    bca_account_holder: '',
    mandiri_account_number: '',
    mandiri_account_holder: '',
    qris_merchant_name: ''
  });

  const handleOpenAdd = () => {
    setFormData({
      code: `CAB-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      address: '',
      city: 'Jakarta',
      phone: '',
      bca_account_number: '',
      bca_account_holder: '',
      mandiri_account_number: '',
      mandiri_account_holder: '',
      qris_merchant_name: ''
    });
    setEditingOutlet(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (outlet) => {
    setFormData({
      code: outlet.code || '',
      name: outlet.name || '',
      address: outlet.address || '',
      city: outlet.city || 'Jakarta',
      phone: outlet.phone || '',
      bca_account_number: outlet.bca_account_number || '',
      bca_account_holder: outlet.bca_account_holder || '',
      mandiri_account_number: outlet.mandiri_account_number || '',
      mandiri_account_holder: outlet.mandiri_account_holder || '',
      qris_merchant_name: outlet.qris_merchant_name || ''
    });
    setEditingOutlet(outlet);
    setShowAddModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      alert(t('om_alertFillName'));
      return;
    }

    setLoading(true);
    try {
      if (editingOutlet) {
        await updateOutlet(editingOutlet.id, formData);
        alert(t('om_alertSuccessUpdate'));
      } else {
        await createOutlet(formData);
        alert(t('om_alertSuccessCreate'));
      }
      if (onRefresh) onRefresh();
      setShowAddModal(false);
    } catch (err) {
      alert(t('om_saveFail') + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading font-extrabold text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-amber-400" />
            <span>{t('om_title')}</span>
          </h2>
          <p className="text-xs text-slate-400">{t('om_sub')}</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t('om_add')}</span>
        </button>
      </div>

      {/* Grid of Outlets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {outlets.map((o) => (
          <div 
            key={o.id}
            className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 hover:border-amber-500/30 transition relative overflow-hidden flex flex-col justify-between"
          >
            {/* Top Info */}
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase">
                    {o.code || `CAB-${o.id}`}
                  </span>
                  <h3 className="text-base font-bold text-white mt-1.5">{o.name}</h3>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  o.is_active !== false 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                    : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                }`}>
                  {o.is_active !== false ? t('om_operating') : t('om_inactive')}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300 border-t border-slate-800/80 pt-3">
                <p className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span>{o.address || t('om_noAddress')} ({o.city || t('om_noCity')})</span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span>{o.phone || t('om_noPhone')}</span>
                </p>
              </div>

              {/* Payment Details info */}
              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-[11px] space-y-1 text-slate-400">
                <p className="font-bold text-slate-200 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t('om_bankQrisTitle')}</span>
                </p>
                <p>BCA: {o.bca_account_number || '-'} a.n {o.bca_account_holder || '-'}</p>
                <p>Mandiri: {o.mandiri_account_number || '-'} a.n {o.mandiri_account_holder || '-'}</p>
                <p className="text-amber-300 font-medium">Merchant QRIS: {o.qris_merchant_name || t('om_qrisStandard')}</p>
              </div>
            </div>

            {/* Action Edit */}
            <div className="pt-3 border-t border-slate-800">
              <button
                onClick={() => handleOpenEdit(o)}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5 text-amber-400" />
                <span>{t('om_editBranch')}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add / Edit Outlet */}
      {showAddModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddModal(false);
          }}
        >
          <div 
            className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 my-8 relative text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-heading font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" />
                <span>{editingOutlet ? t('om_modalEdit') : t('om_modalAdd')}</span>
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">{t('om_code')}</label>
                  <input 
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono"
                    placeholder={t('om_codePh')}
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">{t('om_name')}</label>
                  <input 
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    placeholder={t('om_namePh')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">{t('om_city')}</label>
                  <input 
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    placeholder={t('om_cityPh')}
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">{t('om_phone')}</label>
                  <input 
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    placeholder={t('om_phonePh')}
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">{t('om_address')}</label>
                <textarea 
                  rows="2"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  placeholder={t('om_addressPh')}
                />
              </div>

              {/* Rekening Pembayaran */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <span className="font-bold text-amber-400 block text-[11px] uppercase tracking-wider">{t('om_bankQrisGroup')}</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block">{t('om_bcaNo')}</label>
                    <input 
                      type="text"
                      value={formData.bca_account_number}
                      onChange={(e) => setFormData({ ...formData, bca_account_number: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block">{t('om_bcaHolder')}</label>
                    <input 
                      type="text"
                      value={formData.bca_account_holder}
                      onChange={(e) => setFormData({ ...formData, bca_account_holder: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block">{t('om_mandiriNo')}</label>
                    <input 
                      type="text"
                      value={formData.mandiri_account_number}
                      onChange={(e) => setFormData({ ...formData, mandiri_account_number: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block">{t('om_mandiriHolder')}</label>
                    <input 
                      type="text"
                      value={formData.mandiri_account_holder}
                      onChange={(e) => setFormData({ ...formData, mandiri_account_holder: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block">{t('om_qrisMerchant')}</label>
                  <input 
                    type="text"
                    value={formData.qris_merchant_name}
                    onChange={(e) => setFormData({ ...formData, qris_merchant_name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-white"
                    placeholder={t('om_qrisMerchantPh')}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white font-bold cursor-pointer"
                >
                  {t('cm_cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{loading ? t('om_saving') : t('om_save')}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
