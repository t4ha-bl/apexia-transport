'use client';

import { motion } from 'framer-motion';
import { ArrowDown } from '@phosphor-icons/react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useStore } from '@/lib/store/dataStore';

const EASE = [0.22, 1, 0.36, 1] as const;

// One short entrance for the hero copy: a fade and a small rise, lightly staggered
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

export default function HeroSection() {
  const { t } = useTranslation();
  const { openBooking } = useStore();

  return (
    <section className="relative min-h-[100dvh] w-full max-w-full overflow-hidden bg-offblack flex flex-col justify-center">
      {/* The photograph is the moment of the page: it stays still */}
      <div className="absolute inset-0 z-0">
        <picture>
          <source media="(max-width: 768px)" srcSet="/images/mobile background 1.jpeg" />
          <img
            src="/images/desktop background.jpeg"
            alt="Luxury Transport"
            loading="eager"
            className="w-full h-full object-cover object-center"
          />
        </picture>
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to right, rgba(10,10,10,0.96) 0%, rgba(10,10,10,0.75) 50%, rgba(10,10,10,0.35) 100%)' }}
        />
      </div>

      <div className="relative z-10 w-full grid grid-cols-1 md:grid-cols-[55%_45%]">
        <div className="px-6 md:pl-[8vw] lg:pl-[10vw] py-32 md:py-0 min-h-[100dvh] flex flex-col justify-center">
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <motion.div variants={itemVariants}>
              <span className="font-sans font-medium text-[11px] text-gold tracking-label uppercase block">
                {t('hero_label')}
              </span>
              <div className="w-12 h-px bg-gold mt-3 mb-6" />
            </motion.div>

            <motion.h1 variants={itemVariants} className="font-display font-light text-[48px] md:text-[72px] leading-none tracking-tight text-ghost flex flex-col">
              <span className="whitespace-nowrap">{t('hero_h1')[0]} {t('hero_h1')[1]}</span>
              <span className="italic text-gold">{t('hero_h1')[2]}</span>
            </motion.h1>

            <motion.p variants={itemVariants} className="font-sans text-[17px] leading-relaxed text-soft max-w-[48ch] mt-6">
              {t('hero_sub')}
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 mt-10">
              <button
                onClick={() => openBooking()}
                className="bg-transparent border border-gold text-gold font-sans font-medium text-[13px] uppercase tracking-[0.2em] px-8 py-4 hover:bg-gold hover:text-offblack active:scale-[0.98] transition-[background-color,color,transform] duration-200 ease-brand"
              >
                {t('hero_cta1')}
              </button>
              <button
                onClick={() => { const el = document.getElementById('services'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }}
                className="bg-transparent border border-ghost/30 text-ghost font-sans font-medium text-[13px] uppercase tracking-[0.2em] px-8 py-4 hover:border-ghost active:scale-[0.98] transition-[border-color,transform] duration-200 ease-brand"
              >
                {t('hero_cta2')}
              </button>
            </motion.div>
          </motion.div>
        </div>
        <div className="hidden md:block" />
      </div>

      <div className="absolute bottom-8 left-6 md:left-[8vw] lg:left-[10vw] z-10 opacity-60" aria-hidden="true">
        <ArrowDown size={20} className="text-gold" />
      </div>
    </section>
  );
}
