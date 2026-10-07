import Pagination from './Pagination';
import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit2, 
  CheckCircle, 
  XCircle, 
  Phone, 
  Search
} from 'lucide-react';
import { createMechanic, updateMechanic, deleteMechanic } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

export const MECHANIC_ROLES = [
  { id: 'Head Mechanic', labelKey: 'mr_0', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  { id: 'Car Detailer Specialist', labelKey: 'mr_1', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { id: 'Car Washer', labelKey: 'mr_2', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  { id: 'Motor Detailer Specialist', labelKey: 'mr_3', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  { id: 'Motor Washer', labelKey: 'mr_4', color: 'bg-teal-500/20 text-teal-400 border-teal-500/30' },
  { id: 'Mekanik Service', labelKey: 'mr_5', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' }
];

export default function MechanicManager({ mechanics = [], selectedOutletId = 1, outlets = [], onRefresh }) {
  const { t } = useLanguage();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMechanic, setEditingMechanic] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');

  // Form State
  const [name, setName] = useState('');
  const [role, setRole] = useState('Head Mechanic');
  const [phone, setPhone] = useState('');
  const [isActive, setIsActive] = useState(1);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  const handleOpenAdd = () => {
    setEditingMechanic(null);
    setName('');
    setRole('Head Mechanic');
    setPhone('');
    setIsActive(1);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (mech) => {
    setEditingMechanic(mech);
    setName(mech.name);
    setRole(mech.role);
    setPhone(mech.phone || '');
    setIsActive(mech.is_active);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingMechanic) {
        await updateMechanic(editingMechanic.id, {
          name,
          role,
          phone,
          is_active: isActive
        });
      } else {
        await createMechanic({
          outlet_id: selectedOutletId || 1,
          name,
          role,
          phone,
          is_active: isActive
        });
      }
      setIsModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(t('mm_saveFail') + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm(t('mm_confirmDelete'))) {
      try {
        await deleteMechanic(id);
        if (onRefresh) onRefresh();
      } catch (err) {
        alert(t('mm_deleteFail'));
      }
    }
  };

  const getRoleBadge = (roleName) => {
    if (!roleName) return <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">{t('mm_staff')}</span>;
    const matched = MECHANIC_ROLES.find(r => r.id.toLowerCase() === roleName.toLowerCase());
    if (matched) {
      return (
        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${matched.color}`}>
          {t(matched.labelKey)}
        </span>
      );
    }
    return (
      <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
        {roleName}
      </span>
    );
  };

  // Filter Mechanics
  const filtered = mechanics
    .filter(m => {
      if (filterRole !== 'ALL' && m.role !== filterRole) return false;
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        m.name.toLowerCase().includes(term) ||
        (m.role && m.role.toLowerCase().includes(term)) ||
        (m.phone && m.phone.includes(term))
      );
    });

  const totalMechanics = mechanics.length;
  const activeMechanics = mechanics.filter(m => m.is_active === 1).length;

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginatedMechanics = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      
      {/* Header & Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading font-extrabold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            <span>{t('mm_title')}</span>
          </h2>
          <p className="text-xs text-slate-400">{t('mm_sub')}</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t('mm_add')}</span>
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-1 shadow-md">
          <span className="text-slate-400 uppercase font-semibold text-[11px]">{t('mm_total')}</span>
          <div className="text-2xl font-extrabold text-white font-heading">{t('mm_people', { n: totalMechanics })}</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/30 space-y-1 shadow-md">
          <span className="text-emerald-400 uppercase font-semibold text-[11px]">{t('mm_active')}</span>
          <div className="text-2xl font-extrabold text-emerald-400 font-heading">{t('mm_people', { n: activeMechanics })}</div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-amber-500/30 space-y-1 shadow-md">
          <span className="text-amber-400 uppercase font-semibold text-[11px]">{t('mm_carSpec')}</span>
          <div className="text-2xl font-extrabold text-amber-400 font-heading">
            {t('mm_people', { n: mechanics.filter(m => m.role?.includes('Car')).length })}
          </div>
        </div>
        <div className="p-4 rounded-2xl bg-slate-900 border border-purple-500/30 space-y-1 shadow-md">
          <span className="text-purple-400 uppercase font-semibold text-[11px]">{t('mm_motorSpec')}</span>
          <div className="text-2xl font-extrabold text-purple-400 font-heading">
            {t('mm_people', { n: mechanics.filter(m => m.role?.includes('Motor')).length })}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('mm_searchPh')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-2xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1">
          <button
            onClick={() => setFilterRole('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              filterRole === 'ALL'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {t('mm_allRoles', { n: mechanics.length })}
          </button>
          {MECHANIC_ROLES.map(r => (
            <button
              key={r.id}
              onClick={() => setFilterRole(r.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                filterRole === r.id
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {t(r.labelKey)} ({mechanics.filter(m => m.role === r.id).length})
            </button>
          ))}
        </div>
      </div>

      {/* Table List */}
      <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900 shadow-xl">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/80 uppercase text-[10px] tracking-wider text-slate-400 font-semibold border-b border-slate-800">
            <tr>
              <th className="p-4">{t('mm_thName')}</th>
              <th className="p-4">{t('mm_thRole')}</th>
              <th className="p-4">{t('mm_thPhone')}</th>
              <th className="p-4">{t('mm_thStatus')}</th>
              <th className="p-4 text-center">{t('mm_thAction')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-slate-500">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-400" />
                  <p className="font-semibold text-sm">{t('mm_empty')}</p>
                </td>
              </tr>
            ) : (
              filtered.map((m) => (
                <tr key={m.id} className="hover:bg-slate-800/40 transition">
                  <td className="p-4 font-bold text-white text-sm">
                    {m.name}
                  </td>
                  <td className="p-4">
                    {getRoleBadge(m.role)}
                  </td>
                  <td className="p-4 text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{m.phone || '-'}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                      m.is_active === 1 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}>
                      {m.is_active === 1 ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      <span>{m.is_active === 1 ? t('mm_on') : t('mm_off')}</span>
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(m)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
                        title={t('mm_edit')}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-rose-400 transition cursor-pointer"
                        title={t('mm_delete')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
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

      {/* Modal Add / Edit Mechanic */}
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
              <Users className="w-5 h-5 text-amber-400" />
              <span>{editingMechanic ? t('mm_modalEdit') : t('mm_modalAdd')}</span>
            </h3>
            <p className="text-xs text-slate-400">{t('mm_modalSub')}</p>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 uppercase font-bold text-[10px] tracking-wider mb-1">
                  {t('mm_fullName')}
                </label>
                <input
                  type="text"
                  required
                  placeholder={t('mm_namePh')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 uppercase font-bold text-[10px] tracking-wider mb-1">
                  {t('mm_thRole')}
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-400 cursor-pointer font-semibold text-amber-300"
                >
                  {MECHANIC_ROLES.map(r => (
                    <option key={r.id} value={r.id}>
                      {t(r.labelKey)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 uppercase font-bold text-[10px] tracking-wider mb-1">
                  {t('mm_thPhone')}
                </label>
                <input
                  type="tel"
                  placeholder={t('mm_phonePh')}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 uppercase font-bold text-[10px] tracking-wider mb-1">
                  {t('mm_activeStatus')}
                </label>
                <select
                  value={isActive}
                  onChange={(e) => setIsActive(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value={1}>{t('mm_optActive')}</option>
                  <option value={0}>{t('mm_optInactive')}</option>
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
                  {loading ? t('bm_saving') : t('mm_save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
