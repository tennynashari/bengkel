import React from 'react';
import { MessageCircle } from 'lucide-react';

export default function WhatsAppWidget({ phone = '081299887766' }) {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const waUrl = `https://wa.me/62${cleanPhone.replace(/^0/, '')}?text=Halo%20AUTOSTUDIO%2C%20saya%20ingin%20tanya%20informasi%20layanan%20bengkel%20%26%20auto%20detailing.`;

  return (
    <a
      href={waUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-2xl shadow-emerald-500/40 transition transform hover:scale-105 group border border-emerald-300/40"
    >
      <div className="relative">
        <MessageCircle className="w-5 h-5 fill-slate-950 text-emerald-500 stroke-[2.5]" />
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-200 animate-ping" />
      </div>
      <span className="font-heading tracking-wide">Hubungi CS WhatsApp</span>
    </a>
  );
}
