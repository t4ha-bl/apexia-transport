'use client';
import { useState } from 'react';
import { CircleNotch } from '@phosphor-icons/react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useStore } from '@/lib/store/dataStore';
import { pick } from '@/lib/i18n/localized';

export default function Step4DateTime({ onSubmit, onBack, formData }: any) {
  const { t, lang } = useTranslation();
  const services = useStore(s => s.services);
  const vehicles = useStore(s => s.vehicles);
  
  const [data, setData] = useState({
    date: formData.date || '',
    time: formData.time || '',
    pickup: formData.pickup || '',
    destination: formData.destination || '',
    message: formData.message || '',
    passengers: formData.passengers ? String(formData.passengers) : '1',
    luggage: formData.luggage != null ? String(formData.luggage) : '',
    flightNumber: formData.flightNumber || ''
  });
  const [errors, setErrors] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    let errs: any = {};
    if (!data.date) errs.date = t('booking_required');
    if (!data.time) errs.time = t('booking_required');
    if (!data.pickup) errs.pickup = t('booking_required');
    if (!data.destination) errs.destination = t('booking_required');
    const pax = Number(data.passengers);
    if (!Number.isInteger(pax) || pax < 1 || pax > 60) errs.passengers = t('booking_required');
    if (data.luggage !== '' && (!Number.isInteger(Number(data.luggage)) || Number(data.luggage) < 0 || Number(data.luggage) > 60)) errs.luggage = t('booking_required');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleConfirm = () => {
    if (!validate()) return;
    setLoading(true);
    const { passengers, luggage, flightNumber, ...rest } = data;
    setTimeout(() => {
      onSubmit({
        ...rest,
        passengers: Number(passengers),
        ...(luggage !== '' ? { luggage: Number(luggage) } : {}),
        ...(flightNumber.trim() ? { flightNumber: flightNumber.trim().toUpperCase().slice(0, 20) } : {}),
      });
    }, 1200);
  };

  const svc = services.find(s => s.id === formData.service);
  const veh = vehicles.find(v => v.id === formData.vehicle);
  const svcName = svc ? pick(lang, svc.title, svc.titleEn) : formData.service;
  const vehName = veh ? pick(lang, veh.name, veh.nameEn) : formData.vehicle;

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-5 p-6">
        
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="font-sans font-medium text-[11px] text-muted uppercase tracking-[0.15em]">{t('booking_label_date')} *</label>
            <input type="date" min={new Date().toISOString().split('T')[0]} value={data.date} onChange={e => setData(d => ({...d, date: e.target.value}))} className={`bg-offblack border ${errors.date ? 'border-red-400/60' : 'border-gold/15 focus:border-gold'} h-[48px] px-4 font-sans text-[15px] text-ghost outline-none transition-colors [color-scheme:dark]`} />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-sans font-medium text-[11px] text-muted uppercase tracking-[0.15em]">{t('booking_label_time')} *</label>
            <input type="time" value={data.time} onChange={e => setData(d => ({...d, time: e.target.value}))} className={`bg-offblack border ${errors.time ? 'border-red-400/60' : 'border-gold/15 focus:border-gold'} h-[48px] px-4 font-sans text-[15px] text-ghost outline-none transition-colors [color-scheme:dark]`} />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-sans font-medium text-[11px] text-muted uppercase tracking-[0.15em]">{t('booking_label_pickup')} *</label>
          <input type="text" placeholder={t('booking_ph_place')} value={data.pickup} onChange={e => setData(d => ({...d, pickup: e.target.value}))} className={`bg-offblack border ${errors.pickup ? 'border-red-400/60' : 'border-gold/15 focus:border-gold'} h-[48px] px-4 font-sans text-[15px] text-ghost outline-none transition-colors`} />
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-sans font-medium text-[11px] text-muted uppercase tracking-[0.15em]">{t('booking_label_destination')} *</label>
          <input type="text" placeholder={t('booking_ph_place')} value={data.destination} onChange={e => setData(d => ({...d, destination: e.target.value}))} className={`bg-offblack border ${errors.destination ? 'border-red-400/60' : 'border-gold/15 focus:border-gold'} h-[48px] px-4 font-sans text-[15px] text-ghost outline-none transition-colors`} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="flex flex-col gap-2">
            <label className="font-sans font-medium text-[11px] text-muted uppercase tracking-[0.15em]">{t('booking_label_passengers')} *</label>
            <input type="number" inputMode="numeric" min={1} max={60} value={data.passengers} onChange={e => setData(d => ({...d, passengers: e.target.value}))} className={`bg-offblack border ${errors.passengers ? 'border-red-400/60' : 'border-gold/15 focus:border-gold'} h-[48px] px-4 font-sans text-[15px] text-ghost outline-none transition-colors`} />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-sans font-medium text-[11px] text-muted uppercase tracking-[0.15em]">{t('booking_label_luggage')}</label>
            <input type="number" inputMode="numeric" min={0} max={60} placeholder="0" value={data.luggage} onChange={e => setData(d => ({...d, luggage: e.target.value}))} className={`bg-offblack border ${errors.luggage ? 'border-red-400/60' : 'border-gold/15 focus:border-gold'} h-[48px] px-4 font-sans text-[15px] text-ghost placeholder-[#666666] outline-none transition-colors`} />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-sans font-medium text-[11px] text-muted uppercase tracking-[0.15em]">{t('booking_label_flight')}</label>
            <input type="text" maxLength={20} placeholder="AT205" value={data.flightNumber} onChange={e => setData(d => ({...d, flightNumber: e.target.value}))} className="bg-offblack border border-gold/15 focus:border-gold h-[48px] px-4 font-sans text-[15px] text-ghost placeholder-[#666666] outline-none transition-colors uppercase" />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="font-sans font-medium text-[11px] text-muted uppercase tracking-[0.15em]">{t('booking_label_message')}</label>
          <textarea placeholder={t('booking_ph_message')} value={data.message} onChange={e => setData(d => ({...d, message: e.target.value}))} className="bg-offblack border border-gold/15 focus:border-gold h-[90px] p-4 font-sans text-[15px] text-ghost outline-none transition-colors resize-none" />
        </div>

        <div className="bg-[#0d0d0d] p-4 border border-gold/10 mt-2">
          <div className="font-sans font-medium text-[12px] text-muted uppercase tracking-[0.15em] mb-3">{t('booking_summary')}</div>
          <div className="flex flex-col gap-1 font-sans text-[14px] text-soft">
            <div><span className="text-muted">{t('booking_summary_service')}</span> {svcName}</div>
            <div><span className="text-muted">{t('booking_summary_vehicle')}</span> {vehName}</div>
          </div>
        </div>

      </div>

      <div className="p-6 border-t border-gold/10 flex flex-col gap-4">
        <button 
          disabled={loading}
          onClick={handleConfirm}
          className="flex items-center justify-center gap-2 w-full bg-gold border border-gold text-offblack font-sans font-medium text-[13px] uppercase tracking-[0.20em] h-[52px] hover:bg-goldpale transition-colors disabled:opacity-80"
        >
          {loading ? (
            <><CircleNotch size={18} className="animate-spin" /> {t('booking_processing')}</>
          ) : (
            t('booking_confirm_btn')
          )}
        </button>
        <button 
          disabled={loading}
          onClick={onBack}
          className="w-full bg-transparent text-muted font-sans font-medium text-[13px] uppercase tracking-[0.20em] py-2 hover:text-ghost transition-colors disabled:opacity-50"
        >
          {t('booking_back')}
        </button>
      </div>
    </div>
  );
}
