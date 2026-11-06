'use client';

import { motion } from 'framer-motion';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useStore } from '@/lib/store/dataStore';
import SpotlightCard from '../ui/SpotlightCard';
import DynamicIcon from '../ui/DynamicIcon';

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } }
};

export default function ServicesSection() {
  const { t, lang } = useTranslation();
  const services = useStore(state => state.services);
  const openBooking = useStore(state => state.openBooking);

  const getColSpan = (index: number) => {
    if (index === 0) return 'md:col-span-2 p-10';
    if (index === 3) return 'md:col-span-2 p-10';
    if (index === 4) return 'md:col-span-2 p-10';
    if (index === 6) return 'md:col-span-3 p-10';
    return 'md:col-span-1 p-8';
  };

  return (
    <section id="services" className="py-32 bg-offblack max-w-[1400px] mx-auto px-6 md:px-16 w-full">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-16 mb-20 w-full">
        <div>
          <span className="font-sans font-medium text-[11px] text-muted tracking-label uppercase block">
            {t('services_label')}
          </span>
          <div className="w-12 h-px bg-gold mt-3 mb-6" />
          <h2 className="font-display text-[38px] md:text-[52px] leading-tight text-ghost" dangerouslySetInnerHTML={{ __html: t('services_h2') }} />
        </div>
        <div className="self-end hidden md:block">
          <p className="font-sans text-[16px] text-muted max-w-[48ch]">
            {t('services_sub')}
          </p>
        </div>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {services.map((service, index) => {
          const colSpanClass = getColSpan(index);
          const paddingClass = colSpanClass.includes('p-10') ? 'p-10' : 'p-8';
          const gridClass = colSpanClass.split(' ')[0];
          
          return (
            <motion.div key={service.id} variants={itemVariants} className={gridClass}>
              <SpotlightCard className={`h-full flex flex-col ${paddingClass}`}>
                <div className="absolute top-4 right-4 font-display text-[96px] text-gold opacity-[0.06] leading-none pointer-events-none">
                  {service.number}
                </div>
                
                <DynamicIcon name={service.icon} size={28} className="text-gold" weight="regular" />
                
                <h3 className="font-sans font-medium text-[18px] text-ghost mt-5 relative z-10">
                  {lang === 'en' && service.titleEn ? service.titleEn : service.title}
                </h3>
                <p className="font-display text-[20px] text-soft mt-1 relative z-10">{lang === 'en' && service.priceEn ? service.priceEn : service.price}</p>
                
                <p className="font-sans text-[14px] text-muted leading-relaxed mt-3 max-w-[52ch] flex-grow relative z-10">
                  {lang === 'en' && service.descriptionEn ? service.descriptionEn : service.description}
                </p>
                
                <button 
                  onClick={() => openBooking(service.id)}
                  className="mt-6 font-sans font-medium text-[13px] text-ghost/70 hover:text-ghost text-left transition-colors duration-150 ease-brand relative z-10 w-max flex items-center gap-2"
                >
                  {t('nav_reserve')} <span aria-hidden="true" className="transition-transform duration-200 ease-brand group-hover:translate-x-1">→</span>
                </button>
              </SpotlightCard>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
