import { useLanguage } from '../context/LanguageContext';
import React, { useState } from 'react';
import { Search, Sparkles, Shield, Clock, ChevronRight, QrCode, Building2 } from 'lucide-react';

export default function HeroSection({ onOpenBooking, onTrackSearch, outlets = [], selectedOutletId = 1, onSelectOutlet }) {
  const { t } = useLanguage();
  const [searchCode, setSearchCode] = useState('');

  const activeOutlet = outlets.find(o => Number(o.id) === Number(selectedOutletId)) || outlets[0];
  const heroImage = activeOutlet?.hero_image || outlets?.find(o => o.hero_image)?.hero_image;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchCode.trim()) {
      onTrackSearch(searchCode.trim());
    }
  };

  return (
    <section className="relative overflow-hidden pt-8 pb-16 sm:pt-16 sm:pb-24 bg-slate-950">
      
      {/* Background Custom Hero Image if set */}
      {heroImage ? (
        <>
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-100 z-0 pointer-events-none transition-all duration-700"
            style={{ backgroundImage: `url(${heroImage})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 via-slate-950/20 to-slate-950/80 z-0 pointer-events-none" />
        </>
      ) : (
        <>
          {/* Default Background Decorative Lighting */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 sm:w-96 h-72 sm:h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute top-1/2 right-10 w-64 sm:w-80 h-64 sm:h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        </>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="text-center max-w-3xl mx-auto space-y-4 sm:space-y-6">
          
          {/* Branch Selector Card in Hero Section */}
          {outlets && outlets.length > 0 && (
            <div className="mx-auto max-w-md p-3.5 sm:p-4 rounded-2xl bg-slate-900/90 border border-amber-500/50 backdrop-blur-md shadow-2xl text-left space-y-2 my-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  <Building2 className="w-4 h-4 text-amber-400" />
                  <span>PILIH LOKASI CABANG BENGKEL</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                  ⚡ {outlets.length} Cabang Aktif
                </span>
              </div>
              <select
                value={selectedOutletId}
                onChange={(e) => onSelectOutlet && onSelectOutlet(Number(e.target.value))}
                className="w-full bg-slate-950 text-white font-bold text-xs sm:text-sm rounded-xl px-3 py-2.5 border border-slate-700 focus:border-amber-400 focus:outline-none cursor-pointer"
              >
                {outlets.map(o => (
                  <option key={o.id} value={o.id}>
                    📍 {o.name} — {o.address || o.city}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-amber-500/30 text-amber-300 text-xs font-semibold shadow-sm backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Auto Detailing & Cuci Hidrolik Standar Premium</span>
          </div>

          {/* Main Hero Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-heading text-white tracking-tight leading-[1.15] drop-shadow-lg">
            Perawatan Kendaraan <br />
            <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-200 bg-clip-text text-transparent">
              Transparan & Realtime
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-200 max-w-2xl mx-auto leading-relaxed px-2 drop-shadow-md font-medium">
            Nikmati layanan poles bodi, Nano Ceramic Coating 9H, dan cuci hidrolik dengan sistem tracking pengerjaan pit langsung dari ponsel Anda.
          </p>

          {/* Quick Search Tracker Form */}
          <form 
            onSubmit={handleSearchSubmit} 
            className="max-w-xl mx-auto p-1.5 sm:p-2 bg-slate-900/90 border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col sm:flex-row items-center gap-2 backdrop-blur-md"
          >
            <div className="relative w-full flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                placeholder="Cari Plat Nomor / Kode Booking..."
                className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-transparent text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none uppercase font-mono font-bold"
              />
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 transition cursor-pointer"
            >
              <span>Lacak Status</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>

          {/* CTAs Button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenBooking}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 transition cursor-pointer"
            >
              <span>Booking Layanan Sekarang</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* 3 Value Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-6 text-left max-w-4xl mx-auto">
            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 flex items-center gap-3 backdrop-blur-md">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Live Status Pit</h4>
                <p className="text-[11px] text-slate-400">Pantau progres cuci & detailing realtime</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 flex items-center gap-3 backdrop-blur-md">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 flex-shrink-0">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">QRIS & Transfer</h4>
                <p className="text-[11px] text-slate-400">Pembayaran DP & Lunas otomatis instan</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800/80 flex items-center gap-3 backdrop-blur-md">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Garansi Detailing</h4>
                <p className="text-[11px] text-slate-400">Garansi coating hingga 2 tahun penuh</p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
