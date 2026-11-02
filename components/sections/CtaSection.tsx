'use client';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { WhatsappLogo } from '@phosphor-icons/react';
import { useStore } from '@/lib/store/dataStore';

export default function CtaSection() {
  const { t } = useTranslation();
  const openBooking = useStore(state => state.openBooking);

  return (
    <section className="bg-ink py-24 border-y border-gold/10 w-full mb-0">
      <div className="max-w-[1400px] mx-auto px-6 md:px-16 grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-16 items-center">
        <div>
          <div className="w-[80px] h-[1px] bg-gold mb-6" />
          <h2 className="font-display text-[38px] md:text-[52px] leading-tight text-ghost">
            {t('cta_h2')}
          </h2>
          <p className="font-sans text-[16px] text-[#888888] max-w-[52ch] mt-4">
            {t('cta_sub')}
          </p>
        </div>

        <div className="flex flex-col gap-4 md:items-end">
          <button 
            onClick={() => openBooking()} 
            className="w-full md:w-auto text-center bg-transparent border border-gold text-gold font-sans font-medium text-[13px] uppercase tracking-[0.20em] px-10 py-4 hover:bg-gold hover:text-offblack transition-all"
          >
            {t('cta_btn1')}
          </button>
          
          <a href="https://wa.me/212664552211" target="_blank" className="w-full md:w-auto flex items-center justify-center gap-2 bg-transparent border border-ghost/30 text-ghost font-sans font-medium text-[13px] uppercase tracking-[0.20em] px-10 py-4 hover:border-ghost transition-colors">
            <WhatsappLogo size={20} />
            {t('cta_btn2')}
          </a>

          <span className="font-sans text-[11px] text-[#555555] mt-2">
            {t('cta_response')}
          </span>
        </div>
      </div>
    </section>
  );
}
