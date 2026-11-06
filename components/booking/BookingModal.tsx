'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/lib/store/dataStore';
import { X, CheckCircle, WhatsappLogo } from '@phosphor-icons/react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import Step1Service from './Step1Service';
import Step2Vehicle from './Step2Vehicle';
import Step3PersonalInfo from './Step3PersonalInfo';
import Step4DateTime from './Step4DateTime';
import { Reservation } from '@/lib/store/types';
import { newBookingRef } from '@/lib/bookings';
import { useContact } from '@/lib/useContact';
import { whatsappHref } from '@/lib/contact';

export default function BookingModal() {
  const { t, lang } = useTranslation();
  const contact = useContact();
  const { isBookingOpen, closeBooking, preSelectedService, preSelectedVehicle, addReservation } = useStore();
  const [step, setStep] = useState(1);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [reservationId, setReservationId] = useState('');

  const [formData, setFormData] = useState<Partial<Reservation>>({
    service: preSelectedService || '',
    vehicle: preSelectedVehicle || '',
    fullName: '',
    phone: '',
    address: '',
    date: '',
    time: '',
    pickup: '',
    destination: '',
    message: ''
  });

  useEffect(() => {
    if (isBookingOpen) {
      if (preSelectedService) setFormData(prev => ({ ...prev, service: preSelectedService }));
      if (preSelectedVehicle) setFormData(prev => ({ ...prev, vehicle: preSelectedVehicle }));
      if (preSelectedService && !preSelectedVehicle) setStep(2);
      else if (preSelectedVehicle) setStep(3);
      else setStep(1);
    } else {
      setTimeout(() => {
        setStep(1);
        setIsConfirmed(false);
        setFormData({
          service: '', vehicle: '', fullName: '', phone: '', address: '',
          date: '', time: '', pickup: '', destination: '', message: ''
        });
      }, 300);
    }
  }, [isBookingOpen, preSelectedService, preSelectedVehicle]);

  useEffect(() => {
    if (isBookingOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isBookingOpen]);

  const handleNext = (data: Partial<Reservation>) => {
    setFormData(prev => ({ ...prev, ...data }));
    setStep(s => s + 1);
  };

  const handleBack = () => setStep(s => s - 1);

  const handleSubmit = (data: Partial<Reservation>) => {
    const finalData = { ...formData, ...data };
    const newId = newBookingRef();
    
    addReservation({
      ...(finalData as Reservation),
      id: newId,
      lang,
      status: 'pending',
      createdAt: new Date().toISOString()
    });
    
    setReservationId(newId);
    setIsConfirmed(true);
  };

  const titles = [
    t('booking_step1_title'),
    t('booking_step2_title'),
    t('booking_step3_title'),
    t('booking_step4_title')
  ];

  return (
    <AnimatePresence>
      {isBookingOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-black/90 z-[200]" 
            onClick={closeBooking}
          />

          <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-0 md:p-4 pointer-events-none">
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="bg-ink border border-gold/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] w-full max-w-[640px] max-h-[92vh] overflow-y-auto rounded-t-[16px] md:rounded-[2px] pointer-events-auto flex flex-col"
            >
              {!isConfirmed ? (
                <>
                  <div className="h-[2px] bg-gold/10 w-full relative">
                    <motion.div 
                      className="absolute left-0 top-0 bottom-0 bg-gold"
                      initial={{ width: 0 }}
                      animate={{ width: `${(step / 4) * 100}%` }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>

                  <div className="px-8 pt-6 pb-2 flex justify-between items-start">
                    <div>
                      <h2 className="font-display text-[30px] text-ghost">{titles[step - 1]}</h2>
                      <p className="font-sans text-[13px] text-muted mt-1">{t('booking_step_label')} {step} {t('booking_step_of')} 4</p>
                    </div>
                    <button onClick={closeBooking} aria-label="Close" className="p-1 opacity-70 hover:opacity-100 transition-opacity duration-150 ease-brand">
                      <X size={20} className="text-muted hover:text-ghost" />
                    </button>
                  </div>

                  <div className="flex-1">
                    {step === 1 && <Step1Service onNext={handleNext} initialSvc={formData.service} />}
                    {step === 2 && <Step2Vehicle onNext={handleNext} onBack={handleBack} initialVeh={formData.vehicle} />}
                    {step === 3 && <Step3PersonalInfo onNext={handleNext} onBack={handleBack} initialData={formData} />}
                    {step === 4 && <Step4DateTime onSubmit={handleSubmit} onBack={handleBack} formData={formData} />}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center text-center p-10 gap-6">
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
                    <CheckCircle size={64} className="text-gold" weight="light" />
                  </motion.div>
                  
                  <div>
                    <h3 className="font-display text-[34px] text-ghost">{t('booking_confirm_title')}</h3>
                    <p className="font-sans text-[15px] text-muted max-w-[42ch] mx-auto mt-2">
                      {t('booking_confirm_sub')}
                    </p>
                  </div>

                  <div className="bg-[#0d0d0d] px-6 py-3 border border-gold/15 mt-2">
                    <span className="font-sans font-medium text-[14px] text-gold">{t('booking_ref_label')} {reservationId}</span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 mt-4 w-full justify-center">
                    <button onClick={closeBooking} className="bg-transparent border border-ghost/30 text-ghost font-sans font-medium text-[13px] uppercase tracking-[0.20em] px-8 py-3 hover:border-ghost transition-colors">
                      {t('booking_close')}
                    </button>
                    <a href={whatsappHref(contact, `${t('booking_whatsapp_msg')} ${reservationId}`)} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 bg-gold border border-gold text-offblack font-sans font-medium text-[13px] uppercase tracking-[0.20em] px-8 py-3 hover:bg-goldpale transition-colors">
                      <WhatsappLogo size={18} />
                      WhatsApp
                    </a>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
