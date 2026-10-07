import React from 'react';
import { Wrench, Phone, Mail, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 pt-12 pb-8 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-4 gap-8">
        
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-bold">
              <Wrench className="w-4 h-4" />
            </div>
            <span className="text-lg font-bold text-white font-heading">AUTOSTUDIO</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            Platform sistem booking & manajemen bengkel auto detailing terpercaya dengan penangan presisi tinggi.
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Layanan Populer</h4>
          <ul className="space-y-1">
            <li>Nano Ceramic Coating 9H</li>
            <li>Ultimate Full Detailing</li>
            <li>Engine Tune-Up Carbon Clean</li>
            <li>Servis Ganti Oli Synthetic</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Kontak & Cabang</h4>
          <ul className="space-y-1">
            <li className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-amber-400" /> Jakarta Selatan & Bandung</li>
            <li className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-amber-400" /> 0812-9988-7766</li>
            <li className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-amber-400" /> info@autostudio.id</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Jam Operasional</h4>
          <p>Senin - Minggu: 08:00 - 18:00 WIB</p>
          <p className="text-[10px] text-amber-400 font-semibold pt-2">Customer Care 24/7 via WhatsApp</p>
        </div>

      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mt-8 border-t border-slate-900 text-center text-slate-600">
        © 2026 AUTOSTUDIO Detailing & Servis Kendaraan. All rights reserved.
      </div>
    </footer>
  );
}
