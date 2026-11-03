// Picks the English value when the site is in English and one has been entered
// in the admin; otherwise falls back to the French (default) value.
export const pick = (lang: 'fr' | 'en', fr?: string, en?: string) =>
  lang === 'en' && en && en.trim() ? en : fr || '';
