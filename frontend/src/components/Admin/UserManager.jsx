import React, { useState } from 'react';
import { Users, Plus, Edit2, Trash2, ShieldCheck, Building2, Key, Mail, UserCheck, Shield } from 'lucide-react';
import { createUser, updateUser, deleteUser } from '../../services/api';
import Pagination from './Pagination';
import { useLanguage } from '../../context/LanguageContext';

export default function UserManager({ users = [], outlets = [], currentUser = null, onRefresh }) {
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('BRANCH_ADMIN');
  const [outletId, setOutletId] = useState(outlets[0]?.id || 1);
  const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(3);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setPassword('');
    setRole('BRANCH_ADMIN');
    setOutletId(outlets[0]?.id || 1);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setName(user.name || '');
    setEmail(user.email || '');
    setPassword(''); // leave blank if no change
    setRole(user.role || 'BRANCH_ADMIN');
    setOutletId(user.outlet_id || (outlets[0]?.id || 1));
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name,
        email,
        role,
        outlet_id: role === 'SUPER_ADMIN' ? null : parseInt(outletId)
      };
      if (password) {
        payload.password = password;
      }

      if (editingUser) {
        await updateUser(editingUser.id, payload);
      } else {
        if (!password) {
          alert(t('um_pwdRequiredNew'));
          setLoading(false);
          return;
        }
        await createUser(payload);
      }
      setIsModalOpen(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || err.message || t('um_saveFail'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, userName) => {
    if (!window.confirm(t('um_confirmDelete', { name: userName }))) return;
    try {
      await deleteUser(id);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || err.message || t('um_deleteFail'));
    }
  };

  // Filter & Search Logic
  const filteredUsers = users.filter(u => {
    const matchSearch = (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (u.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchRole = filterRole === 'ALL' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  const getRoleBadge = (uRole) => {
    if (uRole === 'SUPER_ADMIN') {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center gap-1.5 w-fit">
          <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
          {t('um_superAdminBadge')}
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1.5 w-fit">
        <Building2 className="w-3.5 h-3.5 text-cyan-400" />
        {t('um_branchAdminBadge')}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl border border-cyan-500/30">
              <Users className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-wide">{t('um_title')}</h1>
              <p className="text-sm text-slate-400">{t('um_sub')}</p>
            </div>
          </div>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl transition shadow-lg shadow-cyan-500/20 flex items-center gap-2 text-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          {t('um_add')}
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder={t('um_searchPh')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
          >
            <option value="ALL">{t('um_allRoles')}</option>
            <option value="SUPER_ADMIN">{t('um_superAdminRole')}</option>
            <option value="BRANCH_ADMIN">{t('um_branchAdminRole')}</option>
          </select>
        </div>
      </div>

      {/* Users Grid / List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedUsers.map((u) => {
          const assignedOutlet = outlets.find(o => parseInt(o.id) === parseInt(u.outlet_id));
          return (
            <div key={u.id} className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center font-bold text-cyan-400">
                      {(u.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base leading-tight">{u.name}</h3>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 text-slate-500" />
                        {u.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(u)}
                      className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-cyan-400 transition cursor-pointer"
                      title={t('um_modalEdit')}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(u.id, u.name)}
                      className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-red-400 transition cursor-pointer"
                      title="Hapus User"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/60 space-y-2">
                  <div>
                    <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-1">{t('um_thRoleSystem')}</span>
                    {getRoleBadge(u.role)}
                  </div>

                  <div>
                    <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-1">{t('um_thBranchAccess')}</span>
                    {u.role === 'SUPER_ADMIN' ? (
                      <div className="text-xs text-slate-300 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-purple-400" />
                        <span>{t('um_allBranchesHQ')}</span>
                      </div>
                    ) : (
                      <div className="text-xs text-cyan-300 bg-cyan-950/30 px-3 py-1.5 rounded-lg border border-cyan-800/40 flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="font-medium">{assignedOutlet ? assignedOutlet.name : t('um_branchId', { id: u.outlet_id })}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
                <span>{t('um_userId', { id: u.id })}</span>
                <span>{t('um_type', { type: u.role })}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {filteredUsers.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={itemsPerPage}
          totalItems={filteredUsers.length}
          onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
        />
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-cyan-400" />
                {editingUser ? t('um_modalEdit') : t('um_modalAdd')}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">{t('um_fullName')}</label>
                <input
                  type="text"
                  required
                  placeholder={t('um_namePh')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">{t('um_email')}</label>
                <input
                  type="email"
                  required
                  placeholder="admin.bdg@bengkel.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t('um_password')} {editingUser && <span className="text-slate-500 font-normal">{t('um_passwordEditHint')}</span>}
                </label>
                <input
                  type="password"
                  placeholder={editingUser ? "••••••••" : t('um_passwordPhAdd')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">{t('um_roleLabel')}</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="BRANCH_ADMIN">{t('um_optBranchRestricted')}</option>
                  <option value="SUPER_ADMIN">{t('um_optSuperGlobal')}</option>
                </select>
              </div>

              {role === 'BRANCH_ADMIN' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">{t('um_assignBranch')}</label>
                  <select
                    value={outletId}
                    onChange={(e) => setOutletId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    {outlets.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name} ({o.address || o.location || t('om_operating')})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-cyan-400/80 mt-1">
                    {t('um_assignBranchHint')}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-semibold transition cursor-pointer"
                >
                  {t('cm_cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-sm font-bold transition shadow-lg shadow-cyan-500/20 cursor-pointer"
                >
                  {loading ? t('um_saving') : t('um_save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
