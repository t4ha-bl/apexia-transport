'use client';
import { useState } from 'react';
import { useStore } from '@/lib/store/dataStore';
import { CheckCircle } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { pick } from '@/lib/i18n/localized';

export default function Step2Vehicle({ onNext, onBack, initialVeh }: { onNext: (d: any) => void, onBack: () => void, initialVeh?: string }) {
  const { t, lang } = useTranslation();
  const vehicles = useStore(state => state.vehicles);
  const [selected, setSelected] = useState(initialVeh || '');

  return (
    <div className="flex flex-col">
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[440px] overflow-y-auto scrollbar-thin scrollbar-thumb-gold/40">
        {vehicles.map(veh => {
          const isSelected = selected === veh.id;
          return (
            <div 
              key={veh.id}
              onClick={() => setSelected(veh.id)}
              className={`relative flex flex-col bg-[#1a1a1a] border cursor-pointer transition-[background-color,border-color,transform] duration-200 ease-brand active:scale-[0.98] ${isSelected ? 'border-gold bg-gold/5' : 'border-gold/10 hover:border-gold/30'}`}
            >
              <div className="h-[110px] bg-[#0d0d0d] p-2">
                <img src={veh.image} alt={pick(lang, veh.name, veh.nameEn)} className="w-full h-full object-contain" />
              </div>
              <div className="p-3 border-t border-gold/10 flex flex-col">
                <span className="font-sans font-medium text-[9px] text-gold uppercase tracking-[0.20em]">{pick(lang, veh.category, veh.categoryEn)}</span>
                <span className="font-sans font-medium text-[13px] text-ghost mt-0.5">{pick(lang, veh.name, veh.nameEn)}</span>
              </div>
              {isSelected && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-2 right-2">
                  <CheckCircle size={18} className="text-gold" weight="fill" />
                </motion.div>
              )}
            </div>
          );
        })}
      </div>
      <div className="p-6 border-t border-gold/10 flex justify-between">
        <button 
          onClick={onBack}
          className="bg-transparent border border-ghost/30 text-ghost font-sans font-medium text-[13px] uppercase tracking-[0.20em] px-6 py-3 hover:border-ghost transition-colors"
        >
          {t('booking_back')}
        </button>
        <button 
          disabled={!selected}
          onClick={() => onNext({ vehicle: selected })}
          className={`bg-transparent border border-gold text-gold font-sans font-medium text-[13px] uppercase tracking-[0.20em] px-8 py-3 transition-colors ${!selected ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gold hover:text-offblack active:scale-95'}`}
        >
          {t('booking_next')}
        </button>
      </div>
    </div>
  );
}
