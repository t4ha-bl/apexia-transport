export interface Country {
  iso: string;
  dial: string;
  fr: string;
  en: string;
}

// Morocco first: it is the default selection in the booking form.
export const COUNTRIES: Country[] = [
  { iso: 'MA', dial: '+212', fr: 'Maroc', en: 'Morocco' },
  { iso: 'FR', dial: '+33', fr: 'France', en: 'France' },
  { iso: 'ES', dial: '+34', fr: 'Espagne', en: 'Spain' },
  { iso: 'DZ', dial: '+213', fr: 'Algérie', en: 'Algeria' },
  { iso: 'TN', dial: '+216', fr: 'Tunisie', en: 'Tunisia' },
  { iso: 'EG', dial: '+20', fr: 'Égypte', en: 'Egypt' },
  { iso: 'AE', dial: '+971', fr: 'Émirats arabes unis', en: 'United Arab Emirates' },
  { iso: 'SA', dial: '+966', fr: 'Arabie saoudite', en: 'Saudi Arabia' },
  { iso: 'QA', dial: '+974', fr: 'Qatar', en: 'Qatar' },
  { iso: 'KW', dial: '+965', fr: 'Koweït', en: 'Kuwait' },
  { iso: 'BH', dial: '+973', fr: 'Bahreïn', en: 'Bahrain' },
  { iso: 'OM', dial: '+968', fr: 'Oman', en: 'Oman' },
  { iso: 'JO', dial: '+962', fr: 'Jordanie', en: 'Jordan' },
  { iso: 'LB', dial: '+961', fr: 'Liban', en: 'Lebanon' },
  { iso: 'IQ', dial: '+964', fr: 'Irak', en: 'Iraq' },
  { iso: 'IR', dial: '+98', fr: 'Iran', en: 'Iran' },
  { iso: 'IL', dial: '+972', fr: 'Israël', en: 'Israel' },
  { iso: 'TR', dial: '+90', fr: 'Turquie', en: 'Turkey' },
  { iso: 'MR', dial: '+222', fr: 'Mauritanie', en: 'Mauritania' },
  { iso: 'SN', dial: '+221', fr: 'Sénégal', en: 'Senegal' },
  { iso: 'ML', dial: '+223', fr: 'Mali', en: 'Mali' },
  { iso: 'CI', dial: '+225', fr: "Côte d'Ivoire", en: 'Ivory Coast' },
  { iso: 'GH', dial: '+233', fr: 'Ghana', en: 'Ghana' },
  { iso: 'NG', dial: '+234', fr: 'Nigeria', en: 'Nigeria' },
  { iso: 'CM', dial: '+237', fr: 'Cameroun', en: 'Cameroon' },
  { iso: 'GA', dial: '+241', fr: 'Gabon', en: 'Gabon' },
  { iso: 'CD', dial: '+243', fr: 'RD Congo', en: 'DR Congo' },
  { iso: 'KE', dial: '+254', fr: 'Kenya', en: 'Kenya' },
  { iso: 'ZA', dial: '+27', fr: 'Afrique du Sud', en: 'South Africa' },
  { iso: 'GB', dial: '+44', fr: 'Royaume-Uni', en: 'United Kingdom' },
  { iso: 'IE', dial: '+353', fr: 'Irlande', en: 'Ireland' },
  { iso: 'DE', dial: '+49', fr: 'Allemagne', en: 'Germany' },
  { iso: 'IT', dial: '+39', fr: 'Italie', en: 'Italy' },
  { iso: 'PT', dial: '+351', fr: 'Portugal', en: 'Portugal' },
  { iso: 'BE', dial: '+32', fr: 'Belgique', en: 'Belgium' },
  { iso: 'NL', dial: '+31', fr: 'Pays-Bas', en: 'Netherlands' },
  { iso: 'LU', dial: '+352', fr: 'Luxembourg', en: 'Luxembourg' },
  { iso: 'CH', dial: '+41', fr: 'Suisse', en: 'Switzerland' },
  { iso: 'AT', dial: '+43', fr: 'Autriche', en: 'Austria' },
  { iso: 'SE', dial: '+46', fr: 'Suède', en: 'Sweden' },
  { iso: 'NO', dial: '+47', fr: 'Norvège', en: 'Norway' },
  { iso: 'DK', dial: '+45', fr: 'Danemark', en: 'Denmark' },
  { iso: 'FI', dial: '+358', fr: 'Finlande', en: 'Finland' },
  { iso: 'PL', dial: '+48', fr: 'Pologne', en: 'Poland' },
  { iso: 'GR', dial: '+30', fr: 'Grèce', en: 'Greece' },
  { iso: 'RU', dial: '+7', fr: 'Russie', en: 'Russia' },
  { iso: 'UA', dial: '+380', fr: 'Ukraine', en: 'Ukraine' },
  { iso: 'US', dial: '+1', fr: 'États-Unis', en: 'United States' },
  { iso: 'CA', dial: '+1', fr: 'Canada', en: 'Canada' },
  { iso: 'MX', dial: '+52', fr: 'Mexique', en: 'Mexico' },
  { iso: 'BR', dial: '+55', fr: 'Brésil', en: 'Brazil' },
  { iso: 'AR', dial: '+54', fr: 'Argentine', en: 'Argentina' },
  { iso: 'IN', dial: '+91', fr: 'Inde', en: 'India' },
  { iso: 'PK', dial: '+92', fr: 'Pakistan', en: 'Pakistan' },
  { iso: 'CN', dial: '+86', fr: 'Chine', en: 'China' },
  { iso: 'JP', dial: '+81', fr: 'Japon', en: 'Japan' },
  { iso: 'KR', dial: '+82', fr: 'Corée du Sud', en: 'South Korea' },
  { iso: 'SG', dial: '+65', fr: 'Singapour', en: 'Singapore' },
  { iso: 'MY', dial: '+60', fr: 'Malaisie', en: 'Malaysia' },
  { iso: 'ID', dial: '+62', fr: 'Indonésie', en: 'Indonesia' },
  { iso: 'TH', dial: '+66', fr: 'Thaïlande', en: 'Thailand' },
  { iso: 'AU', dial: '+61', fr: 'Australie', en: 'Australia' },
  { iso: 'NZ', dial: '+64', fr: 'Nouvelle-Zélande', en: 'New Zealand' },
];

export const DEFAULT_COUNTRY = COUNTRIES[0];

/**
 * Split a stored phone ("+33 612345678") back into country + national number.
 * Numbers without a "+" (older reservations) are treated as Moroccan.
 */
export function parsePhone(phone: string): { country: Country; national: string } {
  const value = (phone || '').trim();
  if (!value.startsWith('+')) return { country: DEFAULT_COUNTRY, national: value };
  const digits = value.replace(/\D/g, '');
  const match = [...COUNTRIES]
    .sort((a, b) => b.dial.length - a.dial.length)
    .find(c => digits.startsWith(c.dial.slice(1)));
  if (!match) return { country: DEFAULT_COUNTRY, national: value };
  return { country: match, national: digits.slice(match.dial.length - 1) };
}

/** Build the number stored on the reservation: dial code + national digits, no leading 0. */
export function buildPhone(country: Country, national: string): string {
  const digits = national.replace(/\D/g, '').replace(/^0+/, '');
  return `${country.dial} ${digits}`;
}
