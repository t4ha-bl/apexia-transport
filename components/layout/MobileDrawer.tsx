'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { X, WhatsappLogo, GearSix } from '@phosphor-icons/react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import LanguageToggle from './LanguageToggle';
import Link from 'next/link';

const drawerVariants = {
  closed: { x: '100%', opacity: 0 },
  open: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 80, damping: 20, staggerChildren: 0.05, delayChildren: 0.1 } }
};

const navItemVariants = {
  closed: { x: 20, opacity: 0 },
  open: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 100, damping: 20 } }
};

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const { t } = useTranslation();

  const handleNav = (selector: string) => {
    onClose();
    setTimeout(() => {
      if (selector === 'top') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const el = document.querySelector(selector);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150]"
          />
          <motion.div 
            variants={drawerVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="fixed top-0 right-0 bottom-0 w-[100vw] md:w-[380px] bg-offblack/80 backdrop-blur-xl border-l border-gold/15 p-8 z-[200] flex flex-col"
          >
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center mx-auto">
                <img src="/images/apexia logo.png" alt="Apexia Transport" className="h-[24px] object-contain filter invert brightness-0" />
              </div>
              <button onClick={onClose} className="absolute right-8 top-8 p-1">
                <X size={24} className="text-white hover:text-gold transition-colors" />
              </button>
            </div>

            <div className="h-[1px] bg-gold w-full opacity-30 mb-6" />
            <div className="flex items-center justify-between mb-6">
              <span className="font-sans text-[11px] text-muted tracking-label uppercase">Langue</span>
              <LanguageToggle />
            </div>
            <div className="h-[1px] bg-gold w-full opacity-30 mb-6" />

            <nav className="flex flex-col gap-2">
              <motion.button variants={navItemVariants} onClick={() => handleNav('top')} className="text-left py-3 font-sans text-[18px] text-ghost hover:text-gold transition-colors">{t('back_home')}</motion.button>
              <motion.button variants={navItemVariants} onClick={() => handleNav('#services')} className="text-left py-3 font-sans text-[18px] text-ghost hover:text-gold transition-colors">{t('nav_services')}</motion.button>
              <motion.button variants={navItemVariants} onClick={() => handleNav('#fleet')} className="text-left py-3 font-sans text-[18px] text-ghost hover:text-gold transition-colors">{t('nav_fleet')}</motion.button>
              <motion.button variants={navItemVariants} onClick={() => handleNav('#benefits')} className="text-left py-3 font-sans text-[18px] text-ghost hover:text-gold transition-colors">{t('nav_benefits')}</motion.button>
              <motion.button variants={navItemVariants} onClick={() => handleNav('#partners')} className="text-left py-3 font-sans text-[18px] text-ghost hover:text-gold transition-colors">{t('nav_partners')}</motion.button>
              <motion.button variants={navItemVariants} onClick={() => handleNav('#offices')} className="text-left py-3 font-sans text-[18px] text-ghost hover:text-gold transition-colors">{t('nav_offices')}</motion.button>
            </nav>

            <div className="h-[1px] bg-gold w-full opacity-30 my-6" />

            <div className="flex flex-col gap-4">
              <button 
                onClick={() => { onClose(); }}
                className="w-full bg-transparent border border-gold text-gold font-sans font-medium text-[12px] uppercase tracking-[0.20em] py-4 hover:bg-gold hover:text-offblack transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
              >
                {t('nav_reserve')}
              </button>
              
              <a href="https://wa.me/212664552211" target="_blank" className="flex items-center justify-center gap-2 w-full py-4 text-ghost hover:text-gold transition-colors">
                <WhatsappLogo size={20} />
                <span className="font-sans text-[14px] tracking-wide">+212 6 64 55 22 11</span>
              </a>
            </div>

            <div className="mt-auto pt-6 border-t border-gold/10 flex items-center justify-center">
              <Link href="/admin" onClick={onClose} className="flex items-center gap-2 text-[#444444] hover:text-gold transition-colors">
                <GearSix size={16} />
                <span className="font-sans text-[12px]">Administration</span>
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
