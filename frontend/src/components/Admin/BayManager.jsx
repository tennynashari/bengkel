import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Wrench, Building2 } from 'lucide-react';
import { createBay, updateBay, deleteBay } from '../../services/api';
import Pagination from './Pagination';
import { useLanguage } from '../../context/LanguageContext';

export default function BayManager({ bays = [], selectedOutletId = 1, outlets = [], onRefresh }) {
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBay, setEditingBay] = useState(null);

  // Form State
  const initialTargetOutlet = selectedOutletId === 'ALL' ? (outlets[0]?.id || 1) : Number(selectedOutletId);
  const [targetOutletId, setTargetOutletId] = useState(initialTargetOutlet);
  const [name, setName] = useState('');
  const [bayNumber, setBayNumber] = useState(1);
  const [bayType, setBayType] = useState('WASH');
  const [status, setStatus] = useState('AVAILABLE');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  const handleOpenAdd = () => {
    setEditingBay(null);
    setTargetOutletId(selectedOutletId === 'ALL' ? (outlets[0]?.id || 1) : Number(selectedOutletId));
    setName('');
    setBayNumber(bays.length + 1);
    setBayType('WASH');
    setStatus('AVAILABLE');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (bay) => {
    setEditingBay(bay);
    setTargetOutletId(bay.outlet_id);
    setName(bay.name);
    setBayNumber(bay.bay_number);
    setBayType(bay.bay_type);
    setStatus(bay.status);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingBay) {
        await updateBay(editingBay.id, { 
          name, 
          bay_number: bayNumber, 
          bay_type: bayType, 
          status,
          outlet_id: targetOutletId
        });
      } else {
        await createBay({ 
          outlet_id: targetOutletId, 
          name, 
          bay_number: bayNumber, 
          bay_type: bayType, 
          status 
        });
      }
      if (onRefresh) onRefresh();
      setIsModalOpen(false);
    } catch (err) {
      alert(t('bm_saveFail') + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm(t('bm_confirmDelete'))) {
      try {
        await deleteBay(id);
        if (onRefresh) onRefresh();
      } catch (err) {
        alert(t('bm_deleteFail'));
      }
    }
  };

  const totalPages = Math.ceil((bays || []).length / itemsPerPage) || 1;
  const paginatedBays = (bays || []).slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const currentOutletName = selectedOutletId === 'ALL' 
    ? t('bm_allBranches') 
    : (outlets.find(o => o.id === Number(selectedOutletId))?.name || t('bm_branchNum', { n: selectedOutletId }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 sm:p-6 rounded-3xl border border-slate-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-black text-white font-heading">{t('bm_title')}</h3>
            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              <span>{currentOutletName}</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {t('bm_sub')}
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-amber-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t('bm_add')}</span>
        </button>
      </div>

      {/* Grid List */}
      {paginatedBays.length === 0 ? (
        <div className="p-12 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
          <Wrench className="w-12 h-12 mx-auto opacity-30 text-amber-400" />
          <h4 className="font-bold text-slate-300 text-base">{t('bm_emptyTitle', { name: currentOutletName })}</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {t('bm_emptySub')}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {paginatedBays.map((b) => {
            const outletInfo = outlets.find(o => o.id === b.outlet_id);
            return (
              <div key={b.id} className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition shadow-xl space-y-4 relative group flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-amber-400 font-heading bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/20">
                      Pit #{b.bay_number}
                    </span>
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                      b.status === 'AVAILABLE' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 
                      b.status === 'OCCUPIED' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                      'bg-rose-500/20 text-rose-400 border-rose-500/30'
                    }`}>
                      {b.status === 'AVAILABLE' ? t('bm_stAvailable') : b.status === 'OCCUPIED' ? t('bm_stOccupied') : b.status === 'MAINTENANCE' ? t('bm_stMaintenance') : b.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-base leading-snug">{b.name}</h4>
                    <div className="flex items-center gap-1.5 text-slate-400 text-xs mt-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-500">{t('bm_specialization')}</span>
                      <span className="font-extrabold text-cyan-400 text-xs px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                        {b.bay_type}
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center gap-1 pt-1">
                    <span>📍</span>
                    <span className="truncate font-semibold text-slate-400">
                      {b.outlet_name || outletInfo?.name || t('bm_branchNum', { n: b.outlet_id })}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleOpenEdit(b)}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
                    title={t('bm_edit')}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(b.id)}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-rose-400 transition cursor-pointer"
                    title={t('bm_delete')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={(bays || []).length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
      />

      {/* Modal Add / Edit Pit */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div 
            className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 my-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-white font-heading flex items-center gap-2">
              <Wrench className="w-5 h-5 text-amber-400" />
              <span>{editingBay ? t('bm_modalEdit') : t('bm_modalAdd')}</span>
            </h3>
            <p className="text-xs text-slate-400">{t('bm_modalSub')}</p>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 uppercase font-bold text-[10px] tracking-wider mb-1">
                  {t('bm_location')}
                </label>
                <select
                  value={targetOutletId}
                  onChange={(e) => setTargetOutletId(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-bold focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  {outlets.map(o => (
                    <option key={o.id} value={o.id}>
                      📍 {o.name} ({o.city || t('bm_branchDefault')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 uppercase font-bold text-[10px] tracking-wider mb-1">
                  {t('bm_number')}
                </label>
                <input
                  type="number"
                  required
                  value={bayNumber}
                  onChange={(e) => setBayNumber(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-400 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-300 uppercase font-bold text-[10px] tracking-wider mb-1">
                  {t('bm_name')}
                </label>
                <input
                  type="text"
                  required
                  placeholder={t('bm_namePh')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 uppercase font-bold text-[10px] tracking-wider mb-1">
                  {t('bm_type')}
                </label>
                <select
                  value={bayType}
                  onChange={(e) => setBayType(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-semibold focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="CAR">{t('bm_tCar')}</option>
                  <option value="MOTORCYCLE">{t('bm_tMoto')}</option>
                  <option value="BOTH">{t('bm_tBoth')}</option>
                  <option value="WASH">{t('bm_tWash')}</option>
                  <option value="COATING">{t('bm_tCoating')}</option>
                  <option value="DETAILING">{t('bm_tDetailing')}</option>
                  <option value="SERVICE">{t('bm_tService')}</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 uppercase font-bold text-[10px] tracking-wider mb-1">
                  {t('bm_opStatus')}
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-semibold focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="AVAILABLE">{t('bm_sAvail')}</option>
                  <option value="OCCUPIED">{t('bm_sOcc')}</option>
                  <option value="MAINTENANCE">{t('bm_sMaint')}</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition cursor-pointer"
                >
                  {t('cm_cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-1/2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black transition shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  {loading ? t('bm_saving') : t('bm_save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
