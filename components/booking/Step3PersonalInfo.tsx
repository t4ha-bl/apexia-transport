'use client';
import { useState } from 'react';
import { WarningCircle } from '@phosphor-icons/react';
import { useTranslation } from '@/lib/i18n/useTranslation';

export default function Step3PersonalInfo({ onNext, onBack, initialData }: any) {
  const { t } = useTranslation();
  const [data, setData] = useState({
    fullName: initialData.fullName || '',
    phone: initialData.phone || '',
    address: initialData.address || ''
  });
  const [errors, setErrors] = useState<any>({});

  const validate = () => {
    let errs: any = {};
    if (data.fullName.length < 2) errs.fullName = "Nom invalide";
    if (data.phone.length < 5) errs.phone = "Téléphone invalide";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-5 p-6">
        <div className="flex flex-col gap-2">
          <label className="font-sans font-medium text-[11px] text-[#888888] uppercase tracking-[0.15em]">{t('booking_label_name')} *</label>
          <input 
            type="text" 
            placeholder="Jean Dupont"
            value={data.fullName}
            onChange={e => setData(d => ({...d, fullName: e.target.value}))}
            className={`bg-offblack border ${errors.fullName ? 'border-red-400/60' : 'border-gold/15 focus:border-gold'} h-[48px] px-4 font-sans text-[15px] text-ghost placeholder-[#444444] outline-none transition-colors`}
          />
          {errors.fullName && <div className="flex items-center gap-1 mt-1 text-red-400/80"><WarningCircle size={14}/><span className="font-sans text-[12px]">{errors.fullName}</span></div>}
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-sans font-medium text-[11px] text-[#888888] uppercase tracking-[0.15em]">{t('booking_label_phone')} *</label>
          <div className="flex flex-row">
            <div className="bg-[#1a1a1a] border border-gold/15 border-r-0 px-3 h-[48px] flex items-center">
              <span className="font-sans text-[14px] text-[#888888]">+212</span>
            </div>
            <input 
              type="tel" 
              placeholder="6 XX XX XX XX"
              value={data.phone}
              onChange={e => setData(d => ({...d, phone: e.target.value}))}
              className={`flex-1 bg-offblack border ${errors.phone ? 'border-red-400/60' : 'border-gold/15 focus:border-gold'} border-l-0 h-[48px] px-4 font-sans text-[15px] text-ghost placeholder-[#444444] outline-none transition-colors`}
            />
          </div>
          {errors.phone && <div className="flex items-center gap-1 mt-1 text-red-400/80"><WarningCircle size={14}/><span className="font-sans text-[12px]">{errors.phone}</span></div>}
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-sans font-medium text-[11px] text-[#888888] uppercase tracking-[0.15em]">
            Adresse <span className="text-[#555555] normal-case tracking-normal ml-2">(optionnel)</span>
          </label>
          <input 
            type="text" 
            placeholder="Votre adresse ou hôtel"
            value={data.address}
            onChange={e => setData(d => ({...d, address: e.target.value}))}
            className={`bg-offblack border border-gold/15 focus:border-gold h-[48px] px-4 font-sans text-[15px] text-ghost placeholder-[#444444] outline-none transition-colors`}
          />
        </div>
      </div>

      <div className="p-6 border-t border-gold/10 flex justify-between">
        <button 
          onClick={onBack}
          className="bg-transparent border border-ghost/30 text-ghost font-sans font-medium text-[13px] uppercase tracking-[0.20em] px-6 py-3 hover:border-ghost transition-colors"
        >
          ← Retour
        </button>
        <button 
          onClick={() => validate() && onNext(data)}
          className="bg-transparent border border-gold text-gold font-sans font-medium text-[13px] uppercase tracking-[0.20em] px-8 py-3 hover:bg-gold hover:text-offblack active:scale-95 transition-colors"
        >
          Suivant →
        </button>
      </div>
    </div>
  );
}
