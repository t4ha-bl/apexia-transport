import { useStore } from '../store/dataStore';
import { fr } from './fr';
import { en } from './en';

const dicts = { fr, en };

export function useTranslation() {
  const lang = useStore((state) => state.lang);
  const t = (key: keyof typeof fr) => {
    return dicts[lang][key] || key;
  };
  return { t, lang };
}
