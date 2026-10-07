import { useLanguage } from '../context/LanguageContext';
import React, { useState } from 'react';
import { Sparkles, Check, Clock, ChevronLeft, ChevronRight, Droplets, Bike, Car } from 'lucide-react';

export default function ServicePackages({ services = [], outlets = [], selectedOutletId = 1, onSelectPackage }) {
  const { t } = useLanguage();
  const [selectedVehicleType, setSelectedVehicleType] = useState('CAR');
  const currentOutlet = (outlets && outlets.find(o => o.id === selectedOutletId)) || (outlets && outlets[0]); // 'CAR' or 'MOTORCYCLE'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  // Filter services by vehicle type (CAR, MOTORCYCLE, or ALL)
  const filteredServices = services.filter(item => {
    if (!item.vehicle_type || item.vehicle_type === 'ALL') return true;
    return item.vehicle_type === selectedVehicleType;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredServices.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredServices.slice(startIndex, startIndex + itemsPerPage);

  const handleVehicleTypeChange = (type) => {
    setSelectedVehicleType(type);
    setCurrentPage(1); // Reset to page 1 on filter change
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <section className="py-16 bg-slate-900/50 border-y border-slate-800/80" id="paket-layanan">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-semibold uppercase tracking-wider">
            Katalog Layanan & Tarif
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-heading">Paket Layanan Cuci, Detailing & Servis</h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Pilih jenis kendaraan Anda untuk menjelajahi berbagai pilihan paket cuci hidrolik, detailing poles, dan nano ceramic coating.
          </p>

          {/* MAIN VEHICLE TYPE TOGGLE (Mobil vs Motor) */}
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => handleVehicleTypeChange('CAR')}
              className={`px-8 py-3.5 rounded-2xl text-sm font-extrabold flex items-center gap-3 transition transform hover:scale-105 border ${
                selectedVehicleType === 'CAR'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/25'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
              }`}
            >
              <Car className="w-5 h-5 stroke-[2.5]" />
              <span>Layanan Mobil ({services.filter(s => !s.vehicle_type || s.vehicle_type === 'CAR' || s.vehicle_type === 'ALL').length})</span>
            </button>

            <button
              onClick={() => handleVehicleTypeChange('MOTORCYCLE')}
              className={`px-8 py-3.5 rounded-2xl text-sm font-extrabold flex items-center gap-3 transition transform hover:scale-105 border ${
                selectedVehicleType === 'MOTORCYCLE'
                  ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-slate-950 border-cyan-400 shadow-lg shadow-cyan-500/25'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
              }`}
            >
              <Bike className="w-5 h-5 stroke-[2.5]" />
              <span>Layanan Motor ({services.filter(s => s.vehicle_type === 'MOTORCYCLE' || s.vehicle_type === 'ALL').length})</span>
            </button>
          </div>
        </div>

        {/* Services Grid (Paginated) */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 min-h-[380px]">
          {currentItems.map((item) => {
            // Get starting price (lowest price among size categories or Small/Medium price)
            const minPriceObj = item.pricing && item.pricing.length > 0 
              ? item.pricing.reduce((min, p) => p.price < min.price ? p : min, item.pricing[0])
              : { price: 50000, estimated_duration_minutes: 45 };

            return (
              <div 
                key={item.id}
                className="glass-card glass-card-hover rounded-2xl p-6 flex flex-col justify-between border border-slate-800 relative group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border ${
                      selectedVehicleType === 'MOTORCYCLE' ? 'text-cyan-400 border-cyan-500/30' : 'text-amber-400 border-amber-500/30'
                    }`}>
                      {selectedVehicleType === 'MOTORCYCLE' ? <Bike className="w-5 h-5" /> : <Car className="w-5 h-5" />}
                    </div>
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {item.category_name}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white font-heading group-hover:text-amber-400 transition">{item.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-3 leading-relaxed">{item.description}</p>
                  </div>

                  <div className="pt-1 flex items-center gap-2 text-xs text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Est. Waktu: {Math.floor(minPriceObj.estimated_duration_minutes / 60)} Jam {minPriceObj.estimated_duration_minutes % 60 ? `${minPriceObj.estimated_duration_minutes % 60}m` : ''}</span>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-800/80 space-y-4">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Harga Mulai Dari</span>
                    <div className="text-xl font-extrabold text-white font-heading">
                      Rp {minPriceObj.price.toLocaleString('id-ID')}
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectPackage(item, 'MEDIUM')}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-2 border border-slate-700 hover:border-amber-400"
                  >
                    <span>{t('selectPackage')}</span>
                    <Check className="w-4 h-4" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>

        {/* PAGINATION CONTROLS */}
        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-3">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 transition border border-slate-700"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex gap-1.5">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pgNum) => (
                <button
                  key={pgNum}
                  onClick={() => handlePageChange(pgNum)}
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition border ${
                    currentPage === pgNum
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  {pgNum}
                </button>
              ))}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 transition border border-slate-700"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </section>
  );
}
