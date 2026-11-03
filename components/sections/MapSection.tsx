'use client';

import { useTranslation } from '@/lib/i18n/useTranslation';
import { MapPin, PhoneCall, Headset, Envelope, WhatsappLogo } from '@phosphor-icons/react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import moroccoMap from '@/lib/data/moroccoMap.json';

const MapContainer = dynamic(
  () => import('react-leaflet').then(mod => mod.MapContainer),
  { ssr: false }
);
const CircleMarker = dynamic(
  () => import('react-leaflet').then(mod => mod.CircleMarker),
  { ssr: false }
);
const Tooltip = dynamic(
  () => import('react-leaflet').then(mod => mod.Tooltip),
  { ssr: false }
);
const GeoJSON = dynamic(
  () => import('react-leaflet').then(mod => mod.GeoJSON),
  { ssr: false }
);

// Natural Earth outlines (public domain). Morocco is drawn as one country,
// southern provinces included; neighbouring countries are shown dimmed.
const features = (moroccoMap as any).features as any[];
const moroccoShape = { type: 'FeatureCollection', features: features.filter(f => f.properties.kind === 'morocco') } as any;
const neighborShapes = { type: 'FeatureCollection', features: features.filter(f => f.properties.kind === 'neighbor') } as any;

export default function MapSection() {
  const { t } = useTranslation();
  
  const locations = [
    { c: [33.9716, -6.8498] as [number, number], n: "Rabat", d: 'top' as const, a: "Rue Jbel Moussa, Imm 22, Agdal" },
    { c: [33.5731, -7.5898] as [number, number], n: "Casablanca", d: 'left' as const, a: "Angle Rue Mohamed Smiha et Pierre Parent\nEspace Paquet, Étg 1, Bur 123" },
    { c: [34.0209, -5.0071] as [number, number], n: "Fès", d: 'right' as const, a: "Lot Mamounia, N°12" }
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
            {t('offices_h2')}
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
                <span className="font-sans text-[12px] text-[#888888]">{t('offices_hours_weekdays')}</span>
              </div>
            </div>
            <div className="flex flex-row gap-3 py-3 items-start">
              <PhoneCall size={16} className="text-gold mt-0.5 shrink-0" />
              <div className="flex flex-col">
                <span className="font-sans text-[14px] text-ghost">+212 6 63 53 00 46</span>
                <span className="font-sans text-[12px] text-[#888888]">{t('offices_hours_saturday')}</span>
              </div>
            </div>
            <div className="flex flex-row gap-3 py-3 items-start">
              <Headset size={16} className="text-gold mt-0.5 shrink-0" />
              <div className="flex flex-col">
                <span className="font-sans text-[14px] text-ghost">+212 6 64 55 22 11</span>
                <span className="font-sans text-[12px] text-[#888888]">{t('offices_hours_always')}</span>
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
            {t('offices_whatsapp')}
          </a>

        </div>

        <div className="min-h-[300px] md:min-h-[500px] h-full order-1 md:order-2 z-0 relative">
          <MapContainer
            bounds={[[20.5, -17.5], [36.3, -0.8]]}
            boundsOptions={{ padding: [10, 10] }}
            zoomSnap={0.25}
            dragging={false}
            scrollWheelZoom={false}
            touchZoom={false}
            doubleClickZoom={false}
            boxZoom={false}
            keyboard={false}
            style={{ height: '100%', width: '100%', background: '#070707' }}
            zoomControl={false}
            attributionControl={false}
            className="apexia-map"
          >
            {/* Custom outline map instead of raster tiles, so Morocco is shown whole
                (tile providers bake their own borders and labels into the images). */}
            <GeoJSON
              data={neighborShapes}
              style={() => ({ color: '#222222', weight: 1, fillColor: '#101010', fillOpacity: 1 })}
              interactive={false}
            />
            <GeoJSON
              data={moroccoShape}
              style={() => ({ color: '#6b6b6b', weight: 1.5, fillColor: '#1c1c1c', fillOpacity: 1 })}
              interactive={false}
            />
            {locations.map((loc, idx) => (
              <CircleMarker 
                key={idx} 
                center={loc.c} 
                radius={8} 
                color="#C9A84C" 
                fillOpacity={0.8}
                weight={2}
                interactive={false}
              >
                <Tooltip permanent direction={loc.d} offset={loc.d === 'top' ? [0, -6] : loc.d === 'left' ? [-6, 0] : [6, 0]} className="apexia-map-label">{loc.n}</Tooltip>
              </CircleMarker>
            ))}
          </MapContainer>
          {/* Transparent shield: the map is display-only, so nothing under it can be dragged,
              zoomed or clicked (it also lets touch scrolling pass straight over the map on phones). */}
          <div className="absolute inset-0 z-[1000]" aria-hidden="true" />

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
