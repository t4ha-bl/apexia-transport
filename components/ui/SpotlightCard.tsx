'use client';
import { useRef, useState } from 'react';
import { motion, useMotionValue, useMotionTemplate } from 'framer-motion';

export default function SpotlightCard({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!cardRef.current) return;
    const { left, top } = cardRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={`group relative overflow-hidden bg-ink border border-transparent rounded-[2px] transition-colors duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-gold/30 ${className}`}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-[2px] opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`radial-gradient(400px circle at ${mouseX}px ${mouseY}px, rgba(201,168,76,0.15), transparent 40%)`,
        }}
      />
      {children}
    </div>
  );
}
