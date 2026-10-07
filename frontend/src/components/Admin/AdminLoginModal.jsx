import React, { useState } from 'react';
import { UserCheck, Lock, Mail, ShieldCheck, X } from 'lucide-react';
import { loginUser } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

export default function AdminLoginModal({ isOpen, onClose, onLoginSuccess }) {
  const { language, setLanguage, t } = useLanguage();
  const [email, setEmail] = useState('admin@bengkel.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await loginUser(email, password);
      onLoginSuccess(data.user, data.token);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Login gagal. Periksa kembali email dan password.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoAccount = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('admin123');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md transition-opacity">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        
        {/* Glow Header */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-amber-500" />

        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/20 text-cyan-400">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">{t('loginModalTitle')}</h2>
              <p className="text-xs text-slate-400">{t('loginSubtitle')}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
              <button
                type="button"
                onClick={() => setLanguage('id')}
                className={`px-2 py-0.5 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                  language === 'id' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                🇮🇩 ID
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2 py-0.5 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                  language === 'en' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                🇬🇧 EN
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-800/60 hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">{t('emailLabel')}</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@bengkel.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition"
              />
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">{t('passwordLabel')}</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 transition"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold rounded-xl text-sm transition shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
          >
            {loading ? t('loginLoading') : t('btnLogin')}
          </button>
        </form>

        {/* Demo Accounts List */}
        <div className="pt-4 border-t border-slate-800/80 space-y-2">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{t('demoAccountsTitle')}</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setDemoAccount('admin@bengkel.com')}
              className="p-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-300 font-semibold text-left transition"
            >
              <span className="block text-[10px] text-purple-400 font-bold uppercase">{t('demoSuperAdmin')}</span>
              <span className="truncate block text-slate-200">admin@bengkel.com</span>
            </button>
            <button
              type="button"
              onClick={() => setDemoAccount('admin.jkt@bengkel.com')}
              className="p-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-300 font-semibold text-left transition"
            >
              <span className="block text-[10px] text-cyan-400 font-bold uppercase">{t('demoBranchAdmin')} (JKT)</span>
              <span className="truncate block text-slate-200">admin.jkt@bengkel.com</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
