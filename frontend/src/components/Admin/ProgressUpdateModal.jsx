import React, { useState } from 'react';
import { X, Camera, CheckCircle2, Upload } from 'lucide-react';
import { addProgress } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

export default function ProgressUpdateModal({ isOpen, onClose, booking, onRefresh }) {
  const { t } = useLanguage();
  const [stageName, setStageName] = useState('Poles & Coating Stage 1');
  const [photoUrl, setPhotoUrl] = useState('https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=600');
  const [notes, setNotes] = useState('Poles tahap cutting selesai, dilanjutkan finishing coating.');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !booking) return null;

  const handleSave = async () => {
    setLoading(true);
    try {
      await addProgress(booking.id, {
        stage_name: stageName,
        photo_url: photoUrl,
        notes
      });
      if (onRefresh) onRefresh();
      onClose();
    } catch (err) {
      alert(t('prg_fail') + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative my-auto text-slate-100 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-heading font-bold text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-purple-400" />
              <span>{t('prg_title')}</span>
            </h3>
            <p className="text-[11px] text-slate-400">{booking.booking_code} • {booking.vehicle_brand_model}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 font-bold mb-1">{t('prg_stage')}</label>
            <select
              value={stageName}
              onChange={(e) => setStageName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold focus:outline-none focus:border-purple-400 cursor-pointer"
            >
              <option value="Pencucian Busa Salju & Hidrolik">{t('prg_s1')}</option>
              <option value="Clay Bar & Decontamination">{t('prg_s2')}</option>
              <option value="Poles 3-Stage Body Cutting">{t('prg_s3')}</option>
              <option value="Aplikasi Nano Ceramic Coating 9H">{t('prg_s4')}</option>
              <option value="Interior Vacuum & Dressing">{t('prg_s5')}</option>
              <option value="Finishing & Quality Control">{t('prg_s6')}</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1">{t('prg_photoUrl')}</label>
            <input
              type="text"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-400 font-mono text-[11px]"
            />
          </div>

          {/* Image Preview */}
          {photoUrl && (
            <div className="rounded-xl border border-slate-700 overflow-hidden max-h-48 bg-slate-950 flex items-center justify-center">
              <img src={photoUrl} alt={t('prg_alt')} className="w-full h-auto max-h-48 object-cover" />
            </div>
          )}

          <div>
            <label className="block text-slate-400 font-bold mb-1">{t('prg_notes')}</label>
            <textarea
              rows="2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-400 text-xs"
            ></textarea>
          </div>

          <div className="flex gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 cursor-pointer"
            >
              {t('cm_cancel')}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleSave}
              className="w-2/3 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-black flex items-center justify-center gap-1.5 shadow-md shadow-purple-500/20 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? t('prg_uploading') : t('prg_send')}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
