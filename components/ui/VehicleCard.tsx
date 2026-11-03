'use client';
import { memo } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Vehicle } from '@/lib/store/types';
import { useStore } from '@/lib/store/dataStore';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { pick } from '@/lib/i18n/localized';

function VehicleCardComponent({ vehicle }: { vehicle: Vehicle }) {
  const openBooking = useStore(state => state.openBooking);
  const { t, lang } = useTranslation();
  const name = pick(lang, vehicle.name, vehicle.nameEn);
  const category = pick(lang, vehicle.category, vehicle.categoryEn);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useTransform(mouseY, [-0.5, 0.5], [6, -6]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-6, 6]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    mouseX.set((x / rect.width) - 0.5);
    mouseY.set((y / rect.height) - 0.5);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transformStyle: 'preserve-3d', perspective: '1000px', rotateX, rotateY }}
      className="bg-ink border border-gold/10 overflow-hidden rounded-[2px] transition-colors duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-gold/30 w-full h-full flex flex-col group"
    >
      <div className="h-[180px] md:h-[220px] bg-[#0d0d0d] p-4 relative overflow-hidden">
        <img 
          src={vehicle.image} 
          alt={name}
          loading="lazy"
          className="object-contain w-full h-full group-hover:scale-[1.04] transition-transform duration-600 ease-[cubic-bezier(0.16,1,0.3,1)]"
        />
      </div>

      <div className="p-6 border-t border-gold/10 flex-grow flex flex-col">
        <span className="font-sans font-medium text-[10px] text-gold uppercase tracking-[0.25em]">
          {category}
        </span>
        <h3 className="font-sans font-semibold text-[18px] text-ghost mt-1">
          {name}
        </h3>
        <div className="w-[40px] h-[1px] bg-gold mt-3" />
        
        <button 
          onClick={() => openBooking(undefined, vehicle.id)}
          className="mt-4 font-sans font-medium text-[13px] text-gold text-left group-hover:translate-x-1 transition-transform w-max"
        >
          {t('fleet_cta')} →
        </button>
      </div>
    </motion.div>
  );
}

export const VehicleCard = memo(VehicleCardComponent);
