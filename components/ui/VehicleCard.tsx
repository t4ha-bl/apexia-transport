'use client';
import { memo } from 'react';
import { Vehicle } from '@/lib/store/types';
import { useStore } from '@/lib/store/dataStore';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { pick } from '@/lib/i18n/localized';

// The car is the moment here: it sits still on its dark stage, and the card only
// answers a hover with a brighter hairline (no tilt, no zoom).
function VehicleCardComponent({ vehicle }: { vehicle: Vehicle }) {
  const openBooking = useStore(state => state.openBooking);
  const { t, lang } = useTranslation();
  const name = pick(lang, vehicle.name, vehicle.nameEn);
  const category = pick(lang, vehicle.category, vehicle.categoryEn);

  return (
    <div className="bg-ink border border-gold/10 overflow-hidden rounded-[2px] transition-colors duration-200 ease-brand hover:border-gold/30 w-full h-full flex flex-col group">
      <div className="h-[180px] md:h-[220px] bg-[#0d0d0d] p-4 relative overflow-hidden">
        <img
          src={vehicle.image}
          alt={name}
          loading="lazy"
          className="object-contain w-full h-full"
        />
      </div>

      <div className="p-6 border-t border-gold/10 flex-grow flex flex-col">
        <span className="font-sans font-medium text-[11px] text-muted uppercase tracking-[0.2em]">
          {category}
        </span>
        <h3 className="font-sans font-medium text-[18px] text-ghost mt-1">
          {name}
        </h3>
        <div className="w-12 h-px bg-gold/60 mt-4" />

        <button
          onClick={() => openBooking(undefined, vehicle.id)}
          className="mt-4 font-sans font-medium text-[13px] text-ghost text-left w-max inline-flex items-center gap-2 hover:text-soft transition-colors duration-150 ease-brand"
        >
          {t('fleet_cta')}
          <span aria-hidden="true" className="transition-transform duration-200 ease-brand group-hover:translate-x-1">→</span>
        </button>
      </div>
    </div>
  );
}

export const VehicleCard = memo(VehicleCardComponent);
