'use client';

import { useEffect } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { CheckCircle, ArrowDown } from '@phosphor-icons/react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useStore } from '@/lib/store/dataStore';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 20 } }
};

export default function HeroSection() {
  const { t } = useTranslation();
  const { openBooking } = useStore();
  const backgroundY = useMotionValue(0);
  const parallaxTransform = useTransform(backgroundY, [0, 1000], ['0%', '-15%']);

  useEffect(() => {
    const handleScroll = () => backgroundY.set(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [backgroundY]);

  return (
    <section className="relative min-h-[100dvh] w-full max-w-full overflow-hidden bg-offblack flex flex-col justify-center">
      <motion.div 
        className="absolute inset-x-0 -top-0 -bottom-[15%] z-0"
        style={{ y: parallaxTransform }}
      >
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
      </motion.div>

      <div className="relative z-10 w-full grid grid-cols-1 md:grid-cols-[55%_45%]">
        <div className="px-4 pl-8 md:pl-[8vw] lg:pl-[10vw] py-32 md:py-0 min-h-[100dvh] flex flex-col justify-center">
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <motion.div variants={itemVariants}>
              <span className="font-sans font-medium text-[11px] text-gold tracking-label uppercase block">
                {t('hero_label')}
              </span>
              <div className="w-[60px] h-[1px] bg-gold mt-2 mb-6" />
            </motion.div>

            <motion.h1 variants={itemVariants} className="font-display font-light text-[48px] md:text-[72px] leading-none tracking-tight text-ghost flex flex-col">
              <span>{t('hero_h1')[0]}</span>
              <span>{t('hero_h1')[1]}</span>
              <span className="italic text-gold">{t('hero_h1')[2]}</span>
            </motion.h1>

            <motion.p variants={itemVariants} className="font-sans text-[17px] text-[#aaaaaa] max-w-[48ch] mt-6">
              {t('hero_sub')}
            </motion.p>

            <motion.div variants={itemVariants} className="flex flex-row gap-6 mt-4">
              <div className="flex items-center gap-2 font-sans text-[13px] text-[#888888]">
                <CheckCircle size={14} className="text-gold" />
                <span>{t('hero_badge1')}</span>
              </div>
              <div className="flex items-center gap-2 font-sans text-[13px] text-[#888888]">
                <CheckCircle size={14} className="text-gold" />
                <span>{t('hero_badge2')}</span>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 mt-10">
              <button 
                onClick={() => openBooking()} 
                style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
                className="bg-transparent border border-gold text-gold font-sans font-medium text-[13px] uppercase tracking-[0.20em] px-8 py-4 hover:bg-gold hover:text-offblack active:scale-95 transition-all duration-400"
              >
                {t('hero_cta1')}
              </button>
              <button 
                onClick={() => { const el = document.getElementById('services'); if(el) el.scrollIntoView({behavior: 'smooth'}) }}
                style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
                className="bg-transparent border border-ghost/30 text-ghost font-sans font-medium text-[13px] uppercase tracking-[0.20em] px-8 py-4 hover:border-ghost transition-all"
              >
                {t('hero_cta2')}
              </button>
            </motion.div>
          </motion.div>
        </div>
        <div className="hidden md:block" />
      </div>

      <div className="absolute bottom-8 left-[8vw] z-10 opacity-60 animate-[bounce_2s_infinite]">
        <ArrowDown size={20} className="text-gold" />
      </div>
    </section>
  );
}
