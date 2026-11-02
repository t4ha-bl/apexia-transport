'use client';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useStore } from '@/lib/store/dataStore';

export default function SlaveryPage() {
  const { legalTexts } = useStore();

  return (
    <>
      <Header />
      <main className="min-h-screen bg-offblack pt-[140px] pb-32">
        <div className="max-w-[800px] mx-auto px-6 md:px-16">
          <span className="font-sans font-medium text-[11px] text-gold tracking-label uppercase block mb-4">Informations Légales</span>
          <h1 className="font-display text-[42px] leading-tight text-ghost mb-12">Déclaration de Conformité au Modern Slavery Act</h1>
          <div className="font-sans text-[15px] text-[#aaaaaa] whitespace-pre-wrap leading-relaxed">
            {legalTexts.slavery}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
