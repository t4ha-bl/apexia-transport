'use client';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useStore } from '@/lib/store/dataStore';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { pick } from '@/lib/i18n/localized';

export default function PrivacyPage() {
  const { legalTexts } = useStore();
  const { t, lang } = useTranslation();

  return (
    <>
      <Header />
      <main className="min-h-screen bg-offblack pt-[140px] pb-32">
        <div className="max-w-[800px] mx-auto px-6 md:px-16">
          <span className="font-sans font-medium text-[11px] text-gold tracking-label uppercase block mb-4">{t('legal_label')}</span>
          <h1 className="font-display text-[42px] leading-tight text-ghost mb-12">{t('page_privacy')}</h1>
          <div className="font-sans text-[15px] text-soft whitespace-pre-wrap leading-relaxed">
            {pick(lang, legalTexts.privacy, legalTexts.privacyEn)}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
