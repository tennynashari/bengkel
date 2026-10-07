import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Sparkles, Building2, Tag } from 'lucide-react';
import { createService, updateService, deleteService } from '../../services/api';
import Pagination from './Pagination';
import { useLanguage } from '../../context/LanguageContext';

export default function ServiceManager({ services = [], categories = [], selectedOutletId = 'ALL', outlets = [], onRefresh }) {
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);

  // Form State
  const initialOutlet = selectedOutletId === 'ALL' ? '' : selectedOutletId;
  const [targetOutletId, setTargetOutletId] = useState(initialOutlet);
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [vehicleType, setVehicleType] = useState('CAR');
  
  // Matrix Pricing
  const [priceSmall, setPriceSmall] = useState(50000);
  const [priceMedium, setPriceMedium] = useState(65000);
  const [priceLarge, setPriceLarge] = useState(80000);
  const [priceLuxury, setPriceLuxury] = useState(100000);
  const [loading, setLoading] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  const handleOpenAdd = () => {
    setEditingService(null);
    setTargetOutletId(selectedOutletId === 'ALL' ? '' : selectedOutletId);
    setCategoryId(categories[0]?.id || 1);
    setName('');
    setDescription('');
    setVehicleType('CAR');
    setPriceSmall(50000);
    setPriceMedium(65000);
    setPriceLarge(80000);
    setPriceLuxury(100000);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (srv) => {
    setEditingService(srv);
    setTargetOutletId(srv.outlet_id || '');
    setCategoryId(srv.category_id);
    setName(srv.name);
    setDescription(srv.description || '');
    setVehicleType(srv.vehicle_type || 'CAR');

    const pS = srv.pricing?.find(p => p.size_category === 'SMALL')?.price || 50000;
    const pM = srv.pricing?.find(p => p.size_category === 'MEDIUM')?.price || 65000;
    const pL = srv.pricing?.find(p => p.size_category === 'LARGE')?.price || 80000;
    const pX = srv.pricing?.find(p => p.size_category === 'LUXURY')?.price || 100000;

    setPriceSmall(pS);
    setPriceMedium(pM);
    setPriceLarge(pL);
    setPriceLuxury(pX);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const pricing = [
      { size_category: 'SMALL', price: Number(priceSmall), estimated_duration_minutes: 45 },
      { size_category: 'MEDIUM', price: Number(priceMedium), estimated_duration_minutes: 45 },
      { size_category: 'LARGE', price: Number(priceLarge), estimated_duration_minutes: 60 },
      { size_category: 'LUXURY', price: Number(priceLuxury), estimated_duration_minutes: 60 }
    ];

    const payload = {
      category_id: categoryId,
      outlet_id: targetOutletId ? Number(targetOutletId) : null,
      name,
      description,
      vehicle_type: vehicleType,
      pricing
    };

    try {
      if (editingService) {
        await updateService(editingService.id, payload);
      } else {
        await createService(payload);
      }
      if (onRefresh) onRefresh();
      setIsModalOpen(false);
    } catch (err) {
      alert(t('sm_saveFail') + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm(t('sm_confirmDelete'))) {
      try {
        await deleteService(id);
        if (onRefresh) onRefresh();
      } catch (err) {
        alert(t('sm_deleteFail'));
      }
    }
  };

  const totalPages = Math.ceil((services || []).length / itemsPerPage) || 1;
  const paginatedServices = (services || []).slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const currentOutletName = selectedOutletId === 'ALL' 
    ? t('sm_allBranchesHq') 
    : (outlets.find(o => o.id === Number(selectedOutletId))?.name || t('bm_branchNum', { n: selectedOutletId }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 sm:p-6 rounded-3xl border border-slate-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-black text-white font-heading">{t('sm_title')}</h3>
            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              <span>{currentOutletName}</span>
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {t('sm_sub')}
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-amber-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t('sm_add')}</span>
        </button>
      </div>

      {/* Table List */}
      <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900 shadow-xl">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/80 uppercase text-[10px] tracking-wider text-slate-400 font-semibold border-b border-slate-800">
            <tr>
              <th className="p-4">{t('sm_thService')}</th>
              <th className="p-4">{t('sm_thBranch')}</th>
              <th className="p-4">{t('sm_thVehicle')}</th>
              <th className="p-4">{t('sm_thPriceSM')}</th>
              <th className="p-4">{t('sm_thPriceLXL')}</th>
              <th className="p-4 text-center">{t('sm_thAction')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {paginatedServices.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-slate-500">
                  <Sparkles className="w-10 h-10 mx-auto mb-2 opacity-30 text-amber-400" />
                  <p className="font-bold text-sm text-slate-300">{t('sm_empty', { name: currentOutletName })}</p>
                </td>
              </tr>
            ) : (
              paginatedServices.map((srv) => {
                const pS = srv.pricing?.find(p => p.size_category === 'SMALL')?.price || 0;
                const pM = srv.pricing?.find(p => p.size_category === 'MEDIUM')?.price || 0;
                const pL = srv.pricing?.find(p => p.size_category === 'LARGE')?.price || 0;
                const pX = srv.pricing?.find(p => p.size_category === 'LUXURY')?.price || 0;
                const outletInfo = outlets.find(o => o.id === srv.outlet_id);

                return (
                  <tr key={srv.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4">
                      <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 mb-1 inline-block">
                        {srv.category_name || t('sm_general')}
                      </span>
                      <h4 className="font-bold text-white text-sm">{srv.name}</h4>
                      <p className="text-slate-400 text-[11px] line-clamp-1 mt-0.5">{srv.description || '-'}</p>
                    </td>
                    <td className="p-4">
                      <span className="text-[11px] font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/20 inline-flex items-center gap-1">
                        📍 {srv.outlet_name || outletInfo?.name || t('sm_allBranchesApply')}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase border ${
                        srv.vehicle_type === 'MOTORCYCLE' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' : 
                        srv.vehicle_type === 'CAR' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 
                        'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      }`}>
                        {srv.vehicle_type}
                      </span>
                    </td>
                    <td className="p-4 space-y-1">
                      <span className="block text-slate-300">Small (S): <strong className="text-emerald-400">Rp {pS.toLocaleString('id-ID')}</strong></span>
                      <span className="block text-slate-300">Medium (M): <strong className="text-emerald-400">Rp {pM.toLocaleString('id-ID')}</strong></span>
                    </td>
                    <td className="p-4 space-y-1">
                      <span className="block text-slate-300">Large (L): <strong className="text-emerald-400">Rp {pL.toLocaleString('id-ID')}</strong></span>
                      <span className="block text-slate-300">Luxury (XL): <strong className="text-emerald-400">Rp {pX.toLocaleString('id-ID')}</strong></span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(srv)}
                          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
                          title={t('sm_edit')}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(srv.id)}
                          className="p-2.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-rose-400 transition cursor-pointer"
                          title={t('sm_delete')}
                        >
                          <Trash2 className="w-4 h-4" />
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
          totalItems={(services || []).length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
        />
      </div>

      {/* Modal Add / Edit Service */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div 
            className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-white font-heading flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>{editingService ? t('sm_modalEdit') : t('sm_modalAdd')}</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 uppercase font-bold text-[10px] tracking-wider mb-1">
                  {t('sm_thBranch')}
                </label>
                <select
                  value={targetOutletId}
                  onChange={(e) => setTargetOutletId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-bold focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="">{t('sm_optGlobal')}</option>
                  {outlets.map(o => (
                    <option key={o.id} value={o.id}>
                      📍 {t('sm_optOnly', { name: o.name, city: o.city })}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 uppercase font-bold text-[10px] tracking-wider mb-1">{t('sm_category')}</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-bold focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 uppercase font-bold text-[10px] tracking-wider mb-1">{t('sm_name')}</label>
                  <input
                    type="text"
                    required
                    placeholder={t('sm_namePh')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 uppercase font-bold text-[10px] tracking-wider mb-1">{t('sm_vehicleFor')}</label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-bold focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="CAR">{t('sm_vCar')}</option>
                    <option value="MOTORCYCLE">{t('sm_vMoto')}</option>
                    <option value="ALL">{t('sm_vAll')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 uppercase font-bold text-[10px] tracking-wider mb-1">{t('sm_desc')}</label>
                <textarea
                  rows={2}
                  placeholder={t('sm_descPh')}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Matrix Pricing */}
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-3">
                <span className="font-bold text-amber-400 uppercase tracking-wider text-[10px] block flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  <span>{t('sm_matrix')}</span>
                </span>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">{t('sm_pS')}</label>
                    <input
                      type="number"
                      value={priceSmall}
                      onChange={(e) => setPriceSmall(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">{t('sm_pM')}</label>
                    <input
                      type="number"
                      value={priceMedium}
                      onChange={(e) => setPriceMedium(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">{t('sm_pL')}</label>
                    <input
                      type="number"
                      value={priceLarge}
                      onChange={(e) => setPriceLarge(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-300 uppercase mb-1">{t('sm_pX')}</label>
                    <input
                      type="number"
                      value={priceLuxury}
                      onChange={(e) => setPriceLuxury(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                    />
                  </div>
                </div>
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
                  {loading ? t('bm_saving') : t('sm_save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
