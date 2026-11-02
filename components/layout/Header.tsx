'use client';
import { useEffect } from 'react';
import { useMotionValue, useTransform, motion } from 'framer-motion';
import { List } from '@phosphor-icons/react';
import MobileDrawer from './MobileDrawer';
import { useState } from 'react';
import Link from 'next/link';

export default function Header() {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const scrollY = useMotionValue(0);
  
  const bgOpacity = useTransform(scrollY, [0, 50], [0, 0.8]);
  const borderColor = useTransform(scrollY, [0, 50], ['rgba(201,168,76,0)', 'rgba(201,168,76,0.20)']);

  useEffect(() => {
    const update = () => scrollY.set(window.scrollY);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, [scrollY]);

  return (
    <>
      <motion.header 
        style={{ 
          backgroundColor: useTransform(bgOpacity, o => `rgba(10, 10, 10, ${o})`), 
          borderColor,
          backdropFilter: useTransform(bgOpacity, o => o > 0 ? 'blur(10px)' : 'none')
        }}
        className="fixed top-0 left-0 right-0 z-[100] h-[70px] md:h-[80px] border-b flex items-center justify-between px-4 md:px-8"
      >
        <div className="w-[60px]" />
        
        <Link href="/" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          <img src="/images/apexia logo.png" alt="Apexia Transport" className="h-[28px] md:h-[36px] object-contain filter invert brightness-0" />
        </Link>

        <button 
          onClick={() => setDrawerOpen(true)}
          className="p-2 border border-transparent hover:border-gold/20 rounded-full transition-colors group"
        >
          <List size={24} className="text-white group-hover:text-gold transition-colors" />
        </button>
      </motion.header>

      <MobileDrawer isOpen={isDrawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
