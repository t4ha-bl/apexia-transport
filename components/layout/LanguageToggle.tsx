'use client';
import { useStore } from '@/lib/store/dataStore';

export default function LanguageToggle() {
  const { lang, setLang } = useStore();
  
  return (
    <div className="flex items-center space-x-2">
      <button 
        onClick={() => setLang('fr')}
        className={`px-3 py-1 rounded-full text-xs font-sans tracking-wide transition-all ${lang === 'fr' ? 'bg-gold text-offblack border border-gold' : 'border border-gold text-ghost'}`}
      >
        FR
      </button>
      <button 
        onClick={() => setLang('en')}
        className={`px-3 py-1 rounded-full text-xs font-sans tracking-wide transition-all ${lang === 'en' ? 'bg-gold text-offblack border border-gold' : 'border border-gold text-ghost'}`}
      >
        EN
      </button>
    </div>
  );
}
