'use client';

import { useTranslation } from '@/lib/i18n/useTranslation';
import { useContact } from '@/lib/useContact';
import { whatsappHref } from '@/lib/contact';
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
  const contact = useContact();

  // Offices come from Paramètres; label sides keep the three default cities readable
  const LABEL_SIDES = ['top', 'left', 'right'] as const;
  const locations = contact.offices
    .filter(o => Number.isFinite(o.lat) && Number.isFinite(o.lng))
    .map((o, i) => ({ c: [o.lat, o.lng] as [number, number], n: o.city, d: LABEL_SIDES[i] ?? ('right' as const) }));
  const phones = [
    { icon: PhoneCall, number: contact.phoneOffice, hours: contact.officeHours },
    { icon: PhoneCall, number: contact.phoneSecondary, hours: contact.secondaryHours },
    { icon: Headset, number: contact.phoneEmergency, hours: contact.emergencyHours },
  ];

  return (
    <>
      <section id="offices" className="bg-ink border-y border-gold/10 grid grid-cols-1 md:grid-cols-[2fr_3fr] w-full">
        <div className="p-12 md:p-16 bg-ink flex flex-col justify-center order-2 md:order-1">
          <span className="font-sans font-medium text-[11px] text-muted tracking-label uppercase block">
            {t('offices_label')}
          </span>
          <div className="w-12 h-px bg-gold mt-3 mb-6" />
          <h2 className="font-display text-[38px] md:text-[44px] leading-tight text-ghost mb-8">
            {t('offices_h2')}
          </h2>

          <div className="flex flex-col divide-y divide-gold/5">
            {contact.offices.map((o, i) => (
              <div key={`${o.city}-${i}`} className="py-6 flex flex-col">
                <div className="flex flex-row items-start gap-3">
                  <MapPin size={18} className="text-gold mt-1 shrink-0" weight="fill" />
                  <div className="flex flex-col gap-1">
                    <span className="font-sans font-medium text-[15px] text-ghost">{o.city}</span>
                    <span className="font-sans text-[14px] text-muted leading-relaxed whitespace-pre-line">{o.address}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col divide-y divide-gold/5">
            {phones.filter(p => p.number).map((p, i) => (
              <a key={i} href={`tel:${p.number.replace(/[^\d+]/g, '')}`} className="flex flex-row gap-3 py-3 items-start group">
                <p.icon size={16} className="text-gold mt-0.5 shrink-0" />
                <div className="flex flex-col">
                  <span className="font-sans text-[14px] text-ghost group-hover:text-gold transition-colors">{p.number}</span>
                  {p.hours && <span className="font-sans text-[12px] text-muted">{p.hours}</span>}
                </div>
              </a>
            ))}
            {[contact.emailContact, contact.emailBooking].filter(Boolean).map(email => (
              <a key={email} href={`mailto:${email}`} className="flex flex-row gap-3 py-3 items-start group">
                <Envelope size={16} className="text-gold mt-0.5 shrink-0" />
                <span className="font-sans text-[14px] text-ghost group-hover:text-gold transition-colors">{email}</span>
              </a>
            ))}
          </div>

          <a
            href={whatsappHref(contact)}
            rel="noreferrer"
            target="_blank"
            className="mt-6 flex flex-row items-center justify-center gap-2 bg-gold text-offblack font-sans font-medium text-[13px] uppercase tracking-[0.2em] w-full py-4 hover:bg-goldpale active:scale-[0.98] transition-[background-color,transform] duration-150 ease-brand"
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
                color="#f4f4f4"
                fillColor="#f4f4f4"
                fillOpacity={0.9}
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

      <div className="bg-offblack py-5 border-t border-gold/10 w-full px-6">
        <p className="font-sans font-medium text-[11px] text-muted uppercase tracking-[0.2em] text-center leading-relaxed">
          {t('offices_strip')}
        </p>
      </div>
    </>
  );
}
