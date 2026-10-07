import React, { useState } from 'react';
import { X, Save, Check, Camera, AlertTriangle, ShieldCheck } from 'lucide-react';
import { saveInspection } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

export default function DigitalInspectionModal({ isOpen, onClose, booking, onRefresh }) {
  const { t } = useLanguage();
  const [odometer, setOdometer] = useState('45,000 KM');
  const [fuelLevel, setFuelLevel] = useState('3/4');
  const [notes, setNotes] = useState('Baret halus bumper depan kiri, velg baret tipis.');
  const [scratches, setScratches] = useState([
    'Bumper Depan Kiri',
    'Pintu Kanan Belakang',
    'Kaca Depan Jamur Tipis'
  ]);
  const [newScratch, setNewScratch] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !booking) return null;

  const handleAddScratch = (e) => {
    e.preventDefault();
    if (newScratch.trim()) {
      setScratches([...scratches, newScratch.trim()]);
      setNewScratch('');
    }
  };

  const handleRemoveScratch = (idx) => {
    setScratches(scratches.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await saveInspection(booking.id, {
        odometer,
        fuel_level: fuelLevel,
        scratches_data: { scratches },
        initial_photos: ['https://images.unsplash.com/photo-1520050206274-a1ae44613e6d?w=600'],
        notes
      });
      if (onRefresh) onRefresh();
      onClose();
    } catch (err) {
      alert(t('ins_saveFail') + (err.response?.data?.error || err.message));
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
        className="bg-slate-900 border border-slate-800 rounded-2xl sm:rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative my-auto text-slate-100 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-heading font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              <span>{t('ins_title')}</span>
            </h3>
            <p className="text-[11px] text-slate-400">{t('ins_no')} {booking.booking_code} • {booking.vehicle_brand_model} ({booking.license_plate})</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          
          {/* Odometer & Fuel Level */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-bold mb-1">{t('ins_odometer')}</label>
              <input
                type="text"
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
                placeholder={t('ins_odoPh')}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono font-bold focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label className="block text-slate-400 font-bold mb-1">{t('ins_fuel')}</label>
              <select
                value={fuelLevel}
                onChange={(e) => setFuelLevel(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                <option value="1/4">{`⛽ ${t('ins_tank', { lvl: '1/4' })}`}</option>
                <option value="1/2">{`⛽ ${t('ins_tank', { lvl: '1/2' })}`}</option>
                <option value="3/4">{`⛽ ${t('ins_tank', { lvl: '3/4' })}`}</option>
                <option value="FULL">{`⛽ ${t('ins_tank', { lvl: 'FULL' })}`}</option>
              </select>
            </div>
          </div>

          {/* Checklist Baret & Kerusakan Awal */}
          <div className="space-y-2">
            <label className="block text-slate-400 font-bold">{t('ins_scratches')}</label>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {scratches.map((s, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-800/80 border border-slate-700">
                  <span className="text-slate-200">{s}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveScratch(idx)}
                    className="text-rose-400 hover:text-rose-300 text-[10px] font-bold cursor-pointer"
                  >
                    {t('ins_remove')}
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddScratch} className="flex gap-2">
              <input
                type="text"
                value={newScratch}
                onChange={(e) => setNewScratch(e.target.value)}
                placeholder={t('ins_addPh')}
                className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs cursor-pointer"
              >
                {t('ins_add')}
              </button>
            </form>
          </div>

          {/* Catatan Tambahan */}
          <div>
            <label className="block text-slate-400 font-bold mb-1">{t('ins_notesLabel')}</label>
            <textarea
              rows="3"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('ins_notesPh')}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400 text-xs"
            ></textarea>
          </div>

          {/* Actions */}
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
              className="w-2/3 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? t('ins_saving') : t('ins_save')}</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
