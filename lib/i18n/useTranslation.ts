import { useStore } from '../store/dataStore';
import { fr } from './fr';
import { en } from './en';

const dicts = { fr, en };

type Key = keyof typeof fr;

interface Translate {
  (key: 'hero_h1'): string[];
  (key: Exclude<Key, 'hero_h1'>): string;
}

export function useTranslation() {
  const lang = useStore((state) => state.lang);
  const t = ((key: Key) => dicts[lang][key] || key) as Translate;
  return { t, lang };
}
