'use client';
import { useState } from 'react';
import { useStore } from '@/lib/store/dataStore';
import DynamicIcon from '../ui/DynamicIcon';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { pick } from '@/lib/i18n/localized';

export default function Step1Service({ onNext, initialSvc }: { onNext: (d: any) => void, initialSvc?: string }) {
  const { t, lang } = useTranslation();
  const services = useStore(state => state.services);
  const [selected, setSelected] = useState(initialSvc || '');

  return (
    <div className="flex flex-col">
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto">
        {services.map(svc => {
          const isSelected = selected === svc.id;
          return (
            <div 
              key={svc.id} 
              onClick={() => setSelected(svc.id)}
              className={`flex flex-row gap-3 items-start p-4 border rounded-[2px] cursor-pointer transition-[background-color,border-color,transform] duration-200 ease-brand active:scale-[0.98] ${isSelected ? 'border-gold bg-gold/5' : 'bg-[#1a1a1a] border-gold/10 hover:border-gold/30'}`}
            >
              <DynamicIcon name={svc.icon} size={20} className="text-gold shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <span className="font-sans font-medium text-[13px] text-ghost">{pick(lang, svc.title, svc.titleEn)}</span>
                <span className="font-sans text-[11px] text-gold mt-0.5">{pick(lang, svc.price, svc.priceEn)}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="p-6 border-t border-gold/10 flex justify-end">
        <button 
          disabled={!selected}
          onClick={() => onNext({ service: selected })}
          className={`bg-transparent border border-gold text-gold font-sans font-medium text-[13px] uppercase tracking-[0.20em] px-8 py-3 transition-colors ${!selected ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gold hover:text-offblack active:scale-95'}`}
        >
          {t('booking_next')}
        </button>
      </div>
    </div>
  );
}
