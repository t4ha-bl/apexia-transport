'use client';

import { useTranslation } from '@/lib/i18n/useTranslation';
import { MapPin, PhoneCall, Headset, Envelope, WhatsappLogo } from '@phosphor-icons/react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

const MapContainer = dynamic(
  () => import('react-leaflet').then(mod => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then(mod => mod.TileLayer),
  { ssr: false }
);
const CircleMarker = dynamic(
  () => import('react-leaflet').then(mod => mod.CircleMarker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then(mod => mod.Popup),
  { ssr: false }
);

export default function MapSection() {
  const { t } = useTranslation();
  
  const locations = [
    { c: [33.9716, -6.8498] as [number, number], n: "Rabat", a: "Rue Jbel Moussa, Imm 22, Agdal" },
    { c: [33.5731, -7.5898] as [number, number], n: "Casablanca", a: "Angle Rue Mohamed Smiha et Pierre Parent\nEspace Paquet, Étg 1, Bur 123" },
    { c: [34.0209, -5.0071] as [number, number], n: "Fès", a: "Lot Mamounia, N°12" }
  ];

  return (
    <>
      <section id="offices" className="bg-ink border-y border-gold/10 grid grid-cols-1 md:grid-cols-[2fr_3fr] w-full">
        <div className="p-12 md:p-16 bg-ink flex flex-col justify-center order-2 md:order-1">
          <span className="font-sans font-medium text-[11px] text-muted tracking-label uppercase block mb-2">
            {t('offices_label')}
          </span>
          <div className="w-[60px] h-[1px] bg-gold mb-6" />
          <h2 className="font-display text-[38px] md:text-[44px] leading-tight text-ghost mb-8">
            Présents au Cœur<br/>du Maroc
          </h2>

          <div className="flex flex-col divide-y divide-gold/5">
            <div className="py-6 flex flex-col">
              <div className="flex flex-row items-start gap-3">
                <MapPin size={18} className="text-gold mt-1 shrink-0" weight="fill" />
                <div className="flex flex-col gap-1">
                  <span className="font-sans font-semibold text-[15px] text-ghost">Rabat</span>
                  <span className="font-sans text-[14px] text-[#888888] leading-relaxed whitespace-pre-line">Rue Jbel Moussa, Imm 22, Agdal</span>
                </div>
              </div>
            </div>
            <div className="py-6 flex flex-col">
              <div className="flex flex-row items-start gap-3">
                <MapPin size={18} className="text-gold mt-1 shrink-0" weight="fill" />
                <div className="flex flex-col gap-1">
                  <span className="font-sans font-semibold text-[15px] text-ghost">Casablanca</span>
                  <span className="font-sans text-[14px] text-[#888888] leading-relaxed whitespace-pre-line">Angle Rue Mohamed Smiha et Pierre Parent<br/>Espace Paquet, Étg 1, Bur 123</span>
                </div>
              </div>
            </div>
            <div className="py-6 flex flex-col">
              <div className="flex flex-row items-start gap-3">
                <MapPin size={18} className="text-gold mt-1 shrink-0" weight="fill" />
                <div className="flex flex-col gap-1">
                  <span className="font-sans font-semibold text-[15px] text-ghost">Fès</span>
                  <span className="font-sans text-[14px] text-[#888888] leading-relaxed whitespace-pre-line">Lot Mamounia, N°12</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col divide-y divide-gold/5">
            <div className="flex flex-row gap-3 py-3 items-start">
              <PhoneCall size={16} className="text-gold mt-0.5 shrink-0" />
              <div className="flex flex-col">
                <span className="font-sans text-[14px] text-ghost">+212 5 20 72 18 33</span>
                <span className="font-sans text-[12px] text-[#888888]">Lun–Ven, 09h00–16h00</span>
              </div>
            </div>
            <div className="flex flex-row gap-3 py-3 items-start">
              <PhoneCall size={16} className="text-gold mt-0.5 shrink-0" />
              <div className="flex flex-col">
                <span className="font-sans text-[14px] text-ghost">+212 6 63 53 00 46</span>
                <span className="font-sans text-[12px] text-[#888888]">Lun–Sam, 09h00–18h00</span>
              </div>
            </div>
            <div className="flex flex-row gap-3 py-3 items-start">
              <Headset size={16} className="text-gold mt-0.5 shrink-0" />
              <div className="flex flex-col">
                <span className="font-sans text-[14px] text-ghost">+212 6 64 55 22 11</span>
                <span className="font-sans text-[12px] text-[#888888]">24h/24, 7j/7</span>
              </div>
            </div>
            <div className="flex flex-row gap-3 py-3 items-start">
              <Envelope size={16} className="text-gold mt-0.5 shrink-0" />
              <div className="flex flex-col">
                <span className="font-sans text-[14px] text-ghost">contact@apexiatransport.com</span>
              </div>
            </div>
            <div className="flex flex-row gap-3 py-3 items-start">
              <Envelope size={16} className="text-gold mt-0.5 shrink-0" />
              <div className="flex flex-col">
                <span className="font-sans text-[14px] text-ghost">booking@apexiatransport.com</span>
              </div>
            </div>
          </div>

          <a 
            href="https://wa.me/212664552211" 
            target="_blank"
            className="mt-6 flex flex-row items-center justify-center gap-2 bg-gold text-offblack font-sans font-semibold text-[13px] uppercase tracking-[0.20em] w-full py-4 hover:bg-goldpale transition-colors"
          >
            <WhatsappLogo size={20} />
            Contacter sur WhatsApp
          </a>

        </div>

        <div className="min-h-[300px] md:min-h-[500px] h-full order-1 md:order-2 z-0 relative">
          <MapContainer 
            center={[31.7917, -7.0926]} 
            zoom={6} 
            scrollWheelZoom={false} 
            style={{ height: '100%', width: '100%', background: '#0a0a0a' }}
            zoomControl={false}
          >
            <TileLayer
              attribution=''
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            {locations.map((loc, idx) => (
              <CircleMarker 
                key={idx} 
                center={loc.c} 
                radius={8} 
                color="#C9A84C" 
                fillOpacity={0.8}
                weight={2}
              >
                <Popup className="bg-ink border-gold/20 text-ghost font-sans">
                  <b className="text-gold">{loc.n}</b><br/>
                  <span className="text-[#888888]">{loc.a}</span>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      </section>

      <div className="bg-offblack py-5 border-t border-gold/10 overflow-hidden w-full relative">
        <div className="flex w-max animate-[marquee_22s_linear_infinite]">
          <span className="font-sans font-medium text-[11px] text-[#888888] uppercase tracking-[0.25em] px-8 whitespace-nowrap">
            Casablanca · Rabat · Marrakech · Fès · Tous les aéroports du Maroc · Service Nationwide · 
            Casablanca · Rabat · Marrakech · Fès · Tous les aéroports du Maroc · Service Nationwide · 
            Casablanca · Rabat · Marrakech · Fès · Tous les aéroports du Maroc · Service Nationwide
          </span>
        </div>
      </div>
    </>
  );
}
