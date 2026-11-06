'use client';
import Link from 'next/link';
import { FacebookLogo, InstagramLogo, LinkedinLogo, TiktokLogo, YoutubeLogo, TwitterLogo } from '@phosphor-icons/react';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useContact } from '@/lib/useContact';

export default function Footer() {
  const { t } = useTranslation();
  const contact = useContact();

  return (
    <footer className="bg-offblack border-t border-gold/15 pt-20 pb-12 px-8 md:px-16 w-full max-w-[1400px] mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1.5fr] gap-12">
        {/* Col 1 */}
        <div>
          <img src="/images/apexia logo.png" alt="Apexia Transport" className="h-[36px] object-contain filter invert brightness-0 mb-6" />
          <p className="font-display text-[17px] leading-snug text-soft max-w-[34ch] mt-4">
            {t('footer_tagline')}
          </p>
          <div className="flex gap-4 mt-8 flex-wrap">
            <a href="https://www.facebook.com/apexiatransport" target="_blank" rel="noreferrer" className="w-[36px] h-[36px] rounded-[2px] border border-gold/20 flex items-center justify-center text-ghost hover:bg-gold/10 hover:border-gold transition-colors block"><FacebookLogo size={18} weight="fill" /></a>
            <a href="https://www.instagram.com/apexiatransport" target="_blank" rel="noreferrer" className="w-[36px] h-[36px] rounded-[2px] border border-gold/20 flex items-center justify-center text-ghost hover:bg-gold/10 hover:border-gold transition-colors block"><InstagramLogo size={18} weight="fill" /></a>
            <a href="https://www.linkedin.com/company/apexia-transport" target="_blank" rel="noreferrer" className="w-[36px] h-[36px] rounded-[2px] border border-gold/20 flex items-center justify-center text-ghost hover:bg-gold/10 hover:border-gold transition-colors block"><LinkedinLogo size={18} weight="fill" /></a>
            <a href="https://www.tiktok.com/@apexia.transport" target="_blank" rel="noreferrer" className="w-[36px] h-[36px] rounded-[2px] border border-gold/20 flex items-center justify-center text-ghost hover:bg-gold/10 hover:border-gold transition-colors block"><TiktokLogo size={18} weight="fill" /></a>
            <a href="https://www.youtube.com/@ApexiaTransport" target="_blank" rel="noreferrer" className="w-[36px] h-[36px] rounded-[2px] border border-gold/20 flex items-center justify-center text-ghost hover:bg-gold/10 hover:border-gold transition-colors block"><YoutubeLogo size={18} weight="fill" /></a>
            <a href="https://www.twitter.com/ApexiaTransport" target="_blank" rel="noreferrer" className="w-[36px] h-[36px] rounded-[2px] border border-gold/20 flex items-center justify-center text-ghost hover:bg-gold/10 hover:border-gold transition-colors block"><TwitterLogo size={18} weight="fill" /></a>
          </div>
        </div>

        {/* Col 2 */}
        <div>
          <span className="font-sans font-medium text-[11px] text-muted tracking-label uppercase block mb-3">{t('footer_nav_label')}</span>
          <div className="w-12 h-px bg-gold mb-4" />
          <div className="flex flex-col gap-2">
            <a href="/" className="font-sans text-[14px] text-muted hover:text-gold transition-colors py-2">{t('nav_home')}</a>
            <a href="/#services" className="font-sans text-[14px] text-muted hover:text-gold transition-colors py-2">{t('nav_services')}</a>
            <a href="/#fleet" className="font-sans text-[14px] text-muted hover:text-gold transition-colors py-2">{t('nav_fleet')}</a>
            <a href="/#benefits" className="font-sans text-[14px] text-muted hover:text-gold transition-colors py-2">{t('nav_benefits')}</a>
            <a href="/#offices" className="font-sans text-[14px] text-muted hover:text-gold transition-colors py-2">{t('nav_offices')}</a>
          </div>
        </div>

        {/* Col 3 */}
        <div>
          <span className="font-sans font-medium text-[11px] text-muted tracking-label uppercase block mb-3">{t('footer_legal_label')}</span>
          <div className="w-12 h-px bg-gold mb-4" />
          <div className="flex flex-col gap-2">
            <Link href="/politique-de-confidentialite" className="font-sans text-[14px] text-muted hover:text-gold transition-colors py-2">{t('page_privacy')}</Link>
            <Link href="/conditions-generales" className="font-sans text-[14px] text-muted hover:text-gold transition-colors py-2">{t('page_cgv')}</Link>
            <Link href="/declaration-de-conformite-au-modern-slavery" className="font-sans text-[14px] text-muted hover:text-gold transition-colors py-2">{t('page_slavery')}</Link>
            <Link href="/admin" className="font-sans text-[14px] text-muted hover:text-gold transition-colors py-2">{t('admin_link')}</Link>
          </div>
        </div>

        {/* Col 4 */}
        <div>
          <span className="font-sans font-medium text-[11px] text-muted tracking-label uppercase block mb-3">{t('footer_contact_label')}</span>
          <div className="w-12 h-px bg-gold mb-4" />
          <div className="flex flex-col gap-2">
            <div className="py-2">
              <span className="font-sans text-[14px] text-ghost block">{contact.phoneOffice}</span>
              <span className="font-sans text-[12px] text-muted">{contact.officeHours}</span>
            </div>
            <div className="py-2">
              <span className="font-sans text-[14px] text-ghost block">{contact.phoneEmergency}</span>
              <span className="font-sans text-[12px] text-muted">{contact.emergencyHours}</span>
            </div>
            <div className="py-2">
              <a href={`mailto:${contact.emailContact}`} className="font-sans text-[14px] text-ghost block hover:text-gold transition-colors">{contact.emailContact}</a>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-16 pt-8 border-t border-gold/10 flex justify-between flex-wrap gap-4">
        <span className="font-sans text-[12px] text-muted">{t('footer_copy').replace(/\d{4}/, String(new Date().getFullYear()))}</span>
        <span className="font-sans text-[12px] text-muted tabular-nums">{t('footer_legal_ids')}</span>
      </div>
    </footer>
  )
}
