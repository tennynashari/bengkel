import React, { useState } from 'react';
import { Wrench, Phone, Calendar, Search, UserCheck, Globe, Menu, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Navbar({
  onOpenBooking,
  onOpenTracker,
  onOpenLogin,
  onNavigateSection
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigateSection('hero')}>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-black text-white text-xl tracking-tight">{t('brand')}</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 uppercase tracking-wider">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">{t('tagline')}</p>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold">
            <button
              onClick={() => onNavigateSection('hero')}
              className="text-slate-300 hover:text-amber-400 transition"
            >
              {t('navHome')}
            </button>
            <button
              onClick={() => onNavigateSection('services')}
              className="text-slate-300 hover:text-amber-400 transition"
            >
              {t('navServices')}
            </button>
            <button
              onClick={() => onNavigateSection('bays')}
              className="text-slate-300 hover:text-amber-400 transition"
            >
              {t('navPit')}
            </button>
            <button
              onClick={onOpenTracker}
              className="text-slate-300 hover:text-amber-400 flex items-center gap-1.5 transition"
            >
              <Search className="w-4 h-4 text-cyan-400" />
              <span>{t('navTrack')}</span>
            </button>
          </nav>

          {/* Desktop Right Action Buttons */}
          <div className="hidden lg:flex items-center gap-4">
            {/* Language Switcher */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
              <button
                type="button"
                onClick={() => setLanguage('id')}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition cursor-pointer ${
                  language === 'id' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                🇮🇩 ID
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition cursor-pointer ${
                  language === 'en' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                🇬🇧 EN
              </button>
            </div>

            <button
              onClick={onOpenLogin}
              className="px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-300 font-bold text-xs flex items-center gap-2 transition"
            >
              <UserCheck className="w-4 h-4 text-cyan-400" />
              <span>{t('navLogin')}</span>
            </button>

            <button
              onClick={onOpenBooking}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 transition transform hover:-translate-y-0.5"
            >
              <Calendar className="w-4 h-4" />
              <span>{t('navBookNow')}</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 lg:hidden">
            {/* Language Switcher Mobile */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
              <button
                type="button"
                onClick={() => setLanguage('id')}
                className={`px-2 py-0.5 rounded-lg font-bold text-[11px] ${language === 'id' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}
              >
                ID
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2 py-0.5 rounded-lg font-bold text-[11px] ${language === 'en' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}
              >
                EN
              </button>
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-900 text-slate-300 border border-slate-800"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-800 bg-slate-950/95 backdrop-blur-xl p-4 space-y-3">
          <button
            onClick={() => { onNavigateSection('hero'); setIsMobileMenuOpen(false); }}
            className="w-full text-left py-2 text-sm font-semibold text-slate-300"
          >
            {t('navHome')}
          </button>
          <button
            onClick={() => { onNavigateSection('services'); setIsMobileMenuOpen(false); }}
            className="w-full text-left py-2 text-sm font-semibold text-slate-300"
          >
            {t('navServices')}
          </button>
          <button
            onClick={() => { onNavigateSection('bays'); setIsMobileMenuOpen(false); }}
            className="w-full text-left py-2 text-sm font-semibold text-slate-300"
          >
            {t('navPit')}
          </button>
          <button
            onClick={() => { onOpenTracker(); setIsMobileMenuOpen(false); }}
            className="w-full text-left py-2 text-sm font-semibold text-cyan-400 flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span>{t('navTrack')}</span>
          </button>

          <div className="pt-3 border-t border-slate-800 space-y-2">
            <button
              onClick={() => { onOpenLogin(); setIsMobileMenuOpen(false); }}
              className="w-full py-2.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 font-bold text-xs flex items-center justify-center gap-2"
            >
              <UserCheck className="w-4 h-4 text-cyan-400" />
              <span>{t('navLogin')}</span>
            </button>
            <button
              onClick={() => { onOpenBooking(); setIsMobileMenuOpen(false); }}
              className="w-full py-2.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              <span>{t('navBookNow')}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
