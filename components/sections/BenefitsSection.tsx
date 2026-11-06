'use client';

import { useTranslation } from '@/lib/i18n/useTranslation';
import { WifiHigh, Bag, Armchair, BatteryCharging, UserCircle, Gift } from '@phosphor-icons/react';

// Imported one by one (not the whole icon library) to keep the page light
const benefitsList = [
  { n: 1, icon: WifiHigh },
  { n: 2, icon: Bag },
  { n: 3, icon: Armchair },
  { n: 4, icon: BatteryCharging },
  { n: 5, icon: UserCircle },
  { n: 6, icon: Gift }
] as const;

export default function BenefitsSection() {
  const { t } = useTranslation();

  const renderBenefit = (b: (typeof benefitsList)[number]) => {
    const Icon = b.icon;
    return (
      <div key={b.n} className="flex flex-row items-start py-8">
        <Icon size={32} className="text-gold flex-shrink-0 mr-6 mt-1" weight="light" />
        <div className="flex flex-col">
          <h3 className="font-sans font-medium text-[16px] text-ghost">{t(`benefit${b.n}_t` as any)}</h3>
          <p className="font-sans text-[14px] text-muted leading-relaxed mt-1">{t(`benefit${b.n}_d` as any)}</p>
        </div>
      </div>
    );
  };

  return (
    <section id="benefits" className="py-32 bg-offblack max-w-[1400px] mx-auto px-6 md:px-16 w-full relative z-10">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-16 mb-16 w-full">
        <div>
          <span className="font-sans font-medium text-[11px] text-muted tracking-label uppercase block">
            {t('benefits_label')}
          </span>
          <div className="w-12 h-px bg-gold mt-3 mb-6" />
          <h2 className="font-display text-[38px] md:text-[52px] leading-tight text-ghost" dangerouslySetInnerHTML={{ __html: t('benefits_h2') }} />
        </div>
        <div className="self-end hidden md:block">
          <p className="font-sans text-[16px] text-muted max-w-[44ch]">
            {t('benefits_sub')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 divide-y divide-gold/10 md:divide-y-0">
        <div className="flex flex-col divide-y divide-gold/10">
          {benefitsList.slice(0, 3).map(renderBenefit)}
        </div>
        <div className="flex flex-col divide-y divide-gold/10">
          {benefitsList.slice(3, 6).map(renderBenefit)}
        </div>
      </div>
    </section>
  );
}
