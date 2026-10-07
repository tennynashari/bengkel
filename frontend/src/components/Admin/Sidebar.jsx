import { useLanguage } from '../../context/LanguageContext';
import React from 'react';
import { 
  Building2,
  LayoutDashboard, 
  ClipboardList, 
  CreditCard,
  Wrench, 
  Sparkles, 
  Users, 
  UserCog,
  Eye, 
  LogOut, 
  X,
  ShieldCheck,
  ChevronRight,
  Gauge
} from 'lucide-react';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  adminUser, 
  onLogout, 
  onToggleViewMode,
  counts = { bays: 0, bookings: 0, payments: 0, services: 0, mechanics: 0, users: 0, outlets: 0 },
  isOpenMobile,
  onCloseMobile
}) {
  const { language, setLanguage, t } = useLanguage();
  const isSuperAdmin = adminUser?.role === 'SUPER_ADMIN';

  const rawNavItems = [
    {
      id: 'bays',
      label: t('menuLiveBays'),
      subLabel: t('subLiveBays'),
      icon: Gauge,
      badge: `${counts.bays} Pit`,
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    },
    {
      id: 'bookings',
      label: t('menuBookings'),
      subLabel: t('subBookings'),
      icon: ClipboardList,
      badge: `${counts.bookings} Data`,
      badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
    },
    {
      id: 'payments',
      label: t('menuPayments'),
      subLabel: t('subPayments'),
      icon: CreditCard,
      badge: `${counts.payments || 0} Siap`,
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    },
    {
      id: 'bay_mgr',
      label: t('menuBayMgr'),
      subLabel: t('subBayMgr'),
      icon: Wrench,
      badge: counts.bays,
      badgeColor: 'bg-slate-800 text-slate-400 border-slate-700'
    },
    {
      id: 'service_mgr',
      label: t('menuServiceMgr'),
      subLabel: t('subServiceMgr'),
      icon: Sparkles,
      badge: counts.services,
      badgeColor: 'bg-slate-800 text-slate-400 border-slate-700'
    },
    {
      id: 'mechanic_mgr',
      label: t('menuMechanicMgr'),
      subLabel: t('subMechanicMgr'),
      icon: Users,
      badge: counts.mechanics,
      badgeColor: 'bg-slate-800 text-slate-400 border-slate-700'
    },
    {
      id: 'user_mgr',
      label: t('menuUserMgr'),
      subLabel: t('subUserMgr'),
      icon: UserCog,
      badge: `${counts.users || 0} User`,
      badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    },
    {
      id: 'outlet_mgr',
      label: t('menuOutletMgr'),
      subLabel: t('subOutletMgr'),
      icon: Building2,
      badge: `${counts.outlets || 0} Cabang`,
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    },
    {
      id: 'settings',
      label: t('menuSettings'),
      subLabel: t('subSettings'),
      icon: ShieldCheck,
      badge: 'Setting',
      badgeColor: 'bg-slate-800 text-cyan-400 border-cyan-500/30'
    }
  ];

  // Restrict user_mgr, outlet_mgr, and settings strictly to Super Admin
  const navItems = rawNavItems.filter(item => {
    if (['user_mgr', 'outlet_mgr', 'settings'].includes(item.id)) {
      return isSuperAdmin;
    }
    return true;
  });

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed top-0 left-0 bottom-0 z-50 w-72 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Brand Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-heading font-extrabold text-white text-base tracking-tight">AUTOBENGKEL</span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-amber-500 text-slate-950">PRO</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Panel Operasional Staff</p>
            </div>
          </div>

          {/* Close button for mobile */}
          <button 
            onClick={onCloseMobile}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card */}
        <div className="p-4 mx-3 my-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-sm">
            {adminUser?.name ? adminUser.name.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">{adminUser?.name || 'Staff Bengkel'}</p>
            <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{isSuperAdmin ? 'Super Admin HQ' : 'Admin Cabang'}</span>
            </div>
          </div>
        </div>

        {/* Navigation Menu Links */}
        <div className="flex-1 px-3 py-2 space-y-1.5 overflow-y-auto custom-scrollbar">
          <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Menu Utama</p>
          
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full text-left px-3.5 py-3 rounded-2xl flex items-center justify-between gap-3 transition group relative ${
                  isActive 
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold shadow-lg shadow-amber-500/20' 
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white font-medium'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2 rounded-xl transition ${
                    isActive ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-amber-400 group-hover:bg-slate-700'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs truncate">{item.label}</p>
                    <p className={`text-[10px] truncate ${isActive ? 'text-slate-900/80 font-semibold' : 'text-slate-500'}`}>
                      {item.subLabel}
                    </p>
                  </div>
                </div>

                {item.badge !== undefined && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border flex-shrink-0 ${
                    isActive ? 'bg-slate-950 text-amber-400 border-slate-900' : item.badgeColor
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer Actions */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          {/* Language Switcher */}
          <div className="flex items-center justify-between bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/60 mb-2">
            <span className="text-[11px] font-bold text-slate-400 pl-1">Bahasa / Lang:</span>
            <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-lg p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setLanguage('id')}
                className={`px-2 py-0.5 rounded font-extrabold text-[11px] transition ${
                  language === 'id' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                🇮🇩 ID
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2 py-0.5 rounded font-extrabold text-[11px] transition ${
                  language === 'en' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                🇬🇧 EN
              </button>
            </div>
          </div>

          <button
            onClick={onToggleViewMode}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 font-bold text-xs flex items-center justify-center gap-2 border border-cyan-500/20 transition shadow-sm"
          >
            <Eye className="w-4 h-4" />
            <span>{t('viewPublicSite')}</span>
          </button>

          <button
            onClick={onLogout}
            className="w-full py-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-xs flex items-center justify-center gap-2 border border-rose-500/20 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('logout')}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
