'use client';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { WhatsappLogo } from '@phosphor-icons/react';
import { useStore } from '@/lib/store/dataStore';
import { useContact } from '@/lib/useContact';
import { whatsappHref } from '@/lib/contact';

export default function CtaSection() {
  const { t } = useTranslation();
  const openBooking = useStore(state => state.openBooking);
  const contact = useContact();

  return (
    <section className="bg-ink py-24 border-y border-gold/10 w-full mb-0">
      <div className="max-w-[1400px] mx-auto px-6 md:px-16 grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-16 items-center">
        <div>
          <div className="w-12 h-px bg-gold mb-6" />
          <h2 className="font-display text-[38px] md:text-[52px] leading-tight text-ghost">
            {t('cta_h2')}
          </h2>
          <p className="font-sans text-[16px] text-muted max-w-[52ch] mt-4">
            {t('cta_sub')}
          </p>
        </div>

        <div className="flex flex-col gap-4 md:items-end">
          <button 
            onClick={() => openBooking()} 
            className="w-full md:w-auto text-center bg-transparent border border-gold text-gold font-sans font-medium text-[13px] uppercase tracking-[0.2em] px-10 py-4 hover:bg-gold hover:text-offblack active:scale-[0.98] transition-[background-color,color,transform] duration-200 ease-brand"
          >
            {t('cta_btn1')}
          </button>
          
          <a href={whatsappHref(contact)} target="_blank" rel="noreferrer" className="w-full md:w-auto flex items-center justify-center gap-2 bg-transparent border border-ghost/30 text-ghost font-sans font-medium text-[13px] uppercase tracking-[0.2em] px-10 py-4 hover:border-ghost active:scale-[0.98] transition-[border-color,transform] duration-200 ease-brand">
            <WhatsappLogo size={20} />
            {t('cta_btn2')}
          </a>

          <span className="font-sans text-[12px] text-muted mt-2">
            {t('cta_response')}
          </span>
        </div>
      </div>
    </section>
  );
}
