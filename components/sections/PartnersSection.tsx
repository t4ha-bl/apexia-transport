'use client';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useStore } from '@/lib/store/dataStore';

export default function PartnersSection() {
  const { t } = useTranslation();
  const partners = useStore((state) => state.partners);

  return (
    <section className="bg-ink py-6 border-y border-gold/10 overflow-hidden" id="partners">
      <div className="text-center mb-6">
        <span className="font-sans font-medium text-[11px] text-muted tracking-label uppercase">
          {t('partners_label')}
        </span>
      </div>

      <div className="flex w-max animate-marquee mt-6">
        {/* Quadruple array for seamless looping on wide screens */}
        {[...partners, ...partners, ...partners, ...partners].map((partner, i) => (
          <div key={i} className="flex items-center">
            <img 
              src={partner.logo} 
              alt={partner.name} 
              className="h-[60px] md:h-[90px] object-contain mx-12 transition-transform"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
