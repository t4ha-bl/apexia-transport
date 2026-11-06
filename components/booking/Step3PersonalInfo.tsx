'use client';
import { useState } from 'react';
import { WarningCircle, CaretDown } from '@phosphor-icons/react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { isValidEmail } from '@/lib/reviewTemplates';
import { COUNTRIES, DEFAULT_COUNTRY, Country, parsePhone, buildPhone } from '@/lib/data/countries';

export default function Step3PersonalInfo({ onNext, onBack, initialData }: any) {
  const { t, lang } = useTranslation();
  const initialPhone = parsePhone(initialData.phone || '');
  const [country, setCountry] = useState<Country>(initialPhone.country);
  const [data, setData] = useState({
    fullName: initialData.fullName || '',
    phone: initialPhone.national,
    address: initialData.address || '',
    email: initialData.email || ''
  });
  const [errors, setErrors] = useState<any>({});

  const validate = () => {
    let errs: any = {};
    const digits = data.phone.replace(/\D/g, '').replace(/^0+/, '');
    if (data.fullName.length < 2) errs.fullName = t('booking_err_name');
    if (digits.length < 6 || digits.length > 12) errs.phone = t('booking_err_phone');
    const email = data.email.trim();
    if (email && !isValidEmail(email)) errs.email = t('booking_err_email');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    // Stored with the country code so the number can be dialled / WhatsApp'd as is
    onNext({ fullName: data.fullName, address: data.address, phone: buildPhone(country, data.phone), email: data.email.trim() || undefined });
  };

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-5 p-6">
        <div className="flex flex-col gap-2">
          <label className="font-sans font-medium text-[11px] text-muted uppercase tracking-[0.15em]">{t('booking_label_name')} *</label>
          <input 
            type="text" 
            placeholder={t('booking_ph_name')}
            value={data.fullName}
            onChange={e => setData(d => ({...d, fullName: e.target.value}))}
            className={`bg-offblack border ${errors.fullName ? 'border-red-400/60' : 'border-gold/15 focus:border-gold'} h-[48px] px-4 font-sans text-[15px] text-ghost placeholder-[#666666] outline-none transition-colors`}
          />
          {errors.fullName && <div className="flex items-center gap-1 mt-1 text-red-400/80"><WarningCircle size={14}/><span className="font-sans text-[12px]">{errors.fullName}</span></div>}
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-sans font-medium text-[11px] text-muted uppercase tracking-[0.15em]">{t('booking_label_phone')} *</label>
          <div className="flex flex-row">
            {/* Country code picker: a native select laid invisibly over a compact label */}
            <div className="relative bg-[#1a1a1a] border border-gold/15 border-r-0 pl-3 pr-2 h-[48px] flex items-center gap-1 hover:bg-[#222222] transition-colors">
              <span className="font-sans text-[14px] text-ghost whitespace-nowrap">{country.iso} {country.dial}</span>
              <CaretDown size={12} className="text-muted" />
              <select
                aria-label={t('booking_country_label')}
                value={country.iso}
                onChange={e => setCountry(COUNTRIES.find(c => c.iso === e.target.value) || DEFAULT_COUNTRY)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              >
                {COUNTRIES.map(c => (
                  <option key={c.iso} value={c.iso}>{lang === 'en' ? c.en : c.fr} ({c.dial})</option>
                ))}
              </select>
            </div>
            <input 
              type="tel" 
              placeholder="6 XX XX XX XX"
              value={data.phone}
              onChange={e => setData(d => ({...d, phone: e.target.value}))}
              className={`flex-1 bg-offblack border ${errors.phone ? 'border-red-400/60' : 'border-gold/15 focus:border-gold'} border-l-0 h-[48px] px-4 font-sans text-[15px] text-ghost placeholder-[#666666] outline-none transition-colors`}
            />
          </div>
          {errors.phone && <div className="flex items-center gap-1 mt-1 text-red-400/80"><WarningCircle size={14}/><span className="font-sans text-[12px]">{errors.phone}</span></div>}
        </div>


        <div className="flex flex-col gap-2">
          <label className="font-sans font-medium text-[11px] text-muted uppercase tracking-[0.15em]">{t('booking_label_email')}</label>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder={t('booking_ph_email')}
            value={data.email}
            onChange={e => setData(d => ({...d, email: e.target.value}))}
            className={`bg-offblack border ${errors.email ? 'border-red-400/60' : 'border-gold/15 focus:border-gold'} h-[48px] px-4 font-sans text-[15px] text-ghost placeholder-[#666666] outline-none transition-colors`}
          />
          {errors.email && <div className="flex items-center gap-1 mt-1 text-red-400/80"><WarningCircle size={14}/><span className="font-sans text-[12px]">{errors.email}</span></div>}
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-sans font-medium text-[11px] text-muted uppercase tracking-[0.15em]">
            {t('booking_label_address')}
          </label>
          <input
            type="text"
            placeholder={t('booking_ph_address')}
            value={data.address}
            onChange={e => setData(d => ({...d, address: e.target.value}))}
            className={`bg-offblack border border-gold/15 focus:border-gold h-[48px] px-4 font-sans text-[15px] text-ghost placeholder-[#666666] outline-none transition-colors`}
          />
        </div>
      </div>

      <div className="p-6 border-t border-gold/10 flex justify-between">
        <button 
          onClick={onBack}
          className="bg-transparent border border-ghost/30 text-ghost font-sans font-medium text-[13px] uppercase tracking-[0.20em] px-6 py-3 hover:border-ghost transition-colors"
        >
          {t('booking_back')}
        </button>
        <button 
          onClick={submit}
          className="bg-transparent border border-gold text-gold font-sans font-medium text-[13px] uppercase tracking-[0.20em] px-8 py-3 hover:bg-gold hover:text-offblack active:scale-[0.98] transition-colors"
        >
          {t('booking_next')}
        </button>
      </div>
    </div>
  );
}
