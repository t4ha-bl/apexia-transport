'use client';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function BrandStorySection() {
  const { t } = useTranslation();
  
  return (
    <section className="bg-offblack py-32 relative z-20">
      <div className="max-w-[1400px] mx-auto px-6 md:px-16 grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-16 md:gap-24 w-full">
        <div>
          <span className="font-sans font-medium text-[11px] text-muted tracking-label uppercase block mb-2">
            {t('story_label')}
          </span>
          <div className="w-[80px] h-[1px] bg-gold mb-6" />

          <h2 className="font-display italic text-[38px] md:text-[52px] leading-tight text-ghost mb-8" dangerouslySetInnerHTML={{ __html: t('story_h2') }} />

          <p className="font-sans text-[16px] text-[#aaaaaa] max-w-[60ch] leading-relaxed mb-6">
            {t('story_p1')}
          </p>
          <p className="font-sans text-[16px] text-[#aaaaaa] max-w-[60ch] leading-relaxed mb-12">
            {t('story_p2')}
          </p>

          <div className="grid grid-cols-3 gap-0 border-r border-[#C9A84C]/20">
             <div className="pr-4 border-r border-[#C9A84C]/20 text-left">
               <div className="font-display text-[32px] sm:text-[48px] text-gold leading-none mb-2">{t('story_stat1_val')}</div>
               <div className="font-sans text-[10px] sm:text-[12px] uppercase tracking-[0.20em] text-muted">{t('story_stat1_label')}</div>
             </div>
             <div className="px-4 border-r border-[#C9A84C]/20 text-center">
               <div className="font-display text-[32px] sm:text-[48px] text-gold leading-none mb-2">{t('story_stat2_val')}</div>
               <div className="font-sans text-[10px] sm:text-[12px] uppercase tracking-[0.20em] text-muted">{t('story_stat2_label')}</div>
             </div>
             <div className="pl-4 text-right">
               <div className="font-display text-[32px] sm:text-[48px] text-gold leading-none mb-2">{t('story_stat3_val')}</div>
               <div className="font-sans text-[10px] sm:text-[12px] uppercase tracking-[0.20em] text-muted">{t('story_stat3_label')}</div>
             </div>
          </div>
        </div>

        <div className="relative aspect-[3/4] md:aspect-[4/5] w-full max-w-[500px] mx-auto md:ml-auto md:mr-0 z-0">
          <img 
            src="/images/our story 2.jpeg" 
            alt="Apexia Transport Story"
            loading="lazy"
            className="w-full h-full object-cover rounded-[2px]"
          />
           <div className="absolute top-[20px] -right-[20px] -bottom-[20px] left-[20px] border border-gold/30 z-0" />
        </div>
      </div>
    </section>
  );
}
