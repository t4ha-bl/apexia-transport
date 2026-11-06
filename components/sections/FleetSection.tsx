'use client';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useStore } from '@/lib/store/dataStore';
import { VehicleCard } from '../ui/VehicleCard';

export default function FleetSection() {
  const { t } = useTranslation();
  const vehicles = useStore(state => state.vehicles);

  return (
    <section id="fleet" className="py-32 bg-offblack w-full overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-6 md:px-16 text-center mb-16">
        <span className="font-sans font-medium text-[11px] text-muted tracking-label uppercase block">
          {t('fleet_label')}
        </span>
        <div className="w-12 h-px bg-gold mt-3 mb-6 mx-auto" />
        <h2 className="font-display text-[38px] md:text-[52px] leading-tight text-ghost" dangerouslySetInnerHTML={{ __html: t('fleet_h2') }} />
        <p className="font-sans text-[16px] text-muted max-w-[52ch] mx-auto mt-4">
          {t('fleet_sub')}
        </p>
      </div>

      <div className="max-w-[1400px] mx-auto px-0 md:px-16">
        {/* Desktop: strict 3-col CSS Grid */}
        <div className="hidden md:grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          {vehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>

        {/* Mobile: horizontal swipe carousel */}
        <div
          className="flex md:hidden overflow-x-auto"
          style={{
            flexWrap: 'nowrap',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
            paddingLeft: '24px',
            paddingRight: '24px',
            gap: '16px',
          }}
        >
          {vehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              style={{
                flex: '0 0 82vw',
                maxWidth: '82vw',
                scrollSnapAlign: 'center',
              }}
            >
              <VehicleCard vehicle={vehicle} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
