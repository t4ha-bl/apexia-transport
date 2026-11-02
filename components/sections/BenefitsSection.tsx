'use client';

import { useTranslation } from '@/lib/i18n/useTranslation';
import * as PhosphorIcons from '@phosphor-icons/react';

const benefitsList = [
  { t: "Wi-Fi Gratuit", d: "Connexion internet rapide et sécurisée à bord", icon: "WifiHigh" },
  { t: "Assistance Bagages", d: "Le chauffeur aide à porter, charger et décharger", icon: "Bag" },
  { t: "Confort Haut de Gamme", d: "Véhicules spacieux, climatisés, silencieux, impeccables", icon: "Armchair" },
  { t: "Chargeur à Bord", d: "USB ou sans fil pour tous vos appareils", icon: "BatteryCharging" },
  { t: "Chauffeur Professionnel", d: "Tenue élégante, discrétion absolue, ponctualité garantie", icon: "UserCircle" },
  { t: "Kit de Courtoisie", d: "Eau fraîche, serviette désinfectante, serviette en papier", icon: "Gift" }
];

export default function BenefitsSection() {
  const { t } = useTranslation();

  return (
    <section id="benefits" className="py-32 bg-offblack max-w-[1400px] mx-auto px-6 md:px-16 w-full relative z-10">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-16 mb-16 w-full">
        <div>
          <span className="font-sans font-medium text-[11px] text-muted tracking-label uppercase block mb-2">
            {t('benefits_label')}
          </span>
          <div className="w-[80px] h-[1px] bg-gold mb-6" />
          <h2 className="font-display text-[38px] md:text-[52px] leading-tight text-ghost">
            L'Excellence,<br/>Sans Compromis
          </h2>
        </div>
        <div className="self-end hidden md:block">
          <p className="font-sans text-[16px] text-[#888888] max-w-[44ch]">
            Chaque détail est pensé pour que votre trajet soit une expérience à part entière.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 divide-y divide-gold/10 md:divide-y-0">
        <div className="flex flex-col divide-y divide-gold/10">
          {benefitsList.slice(0, 3).map((b, i) => {
            const Icon = (PhosphorIcons as any)[b.icon];
            return (
              <div key={i} className="flex flex-row items-start py-8 group transition-colors">
                <Icon size={32} className="text-gold flex-shrink-0 mr-6 mt-1 group-hover:scale-110 group-hover:text-goldpale transition-all duration-300" weight="light" />
                <div className="flex flex-col">
                  <h3 className="font-sans font-semibold text-[16px] text-ghost">{b.t}</h3>
                  <p className="font-sans text-[14px] text-[#888888] leading-relaxed mt-1">{b.d}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex flex-col divide-y divide-gold/10">
          {benefitsList.slice(3, 6).map((b, i) => {
            const Icon = (PhosphorIcons as any)[b.icon];
            return (
              <div key={i} className="flex flex-row items-start py-8 group transition-colors">
                <Icon size={32} className="text-gold flex-shrink-0 mr-6 mt-1 group-hover:scale-110 group-hover:text-goldpale transition-all duration-300" weight="light" />
                <div className="flex flex-col">
                  <h3 className="font-sans font-semibold text-[16px] text-ghost">{b.t}</h3>
                  <p className="font-sans text-[14px] text-[#888888] leading-relaxed mt-1">{b.d}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
