import { ContactInfo, Office } from './store/types';

// Current values, used whenever a field is empty in Paramètres or Firestore has not
// loaded yet, so the site never shows blank contact details.
export const DEFAULT_CONTACT: Required<Omit<ContactInfo, 'offices'>> & { offices: Office[] } = {
  phoneOffice: '+212 5 20 72 18 33',
  phoneOfficeHours: 'Lun–Ven, 09h00–16h00',
  phoneOfficeHoursEn: 'Mon–Fri, 9am–4pm',
  phoneSecondary: '+212 6 63 53 00 46',
  phoneSecondaryHours: 'Lun–Sam, 09h00–18h00',
  phoneSecondaryHoursEn: 'Mon–Sat, 9am–6pm',
  phoneEmergency: '+212 6 64 55 22 11',
  phoneEmergencyHours: 'Assistance 24h/24, 7j/7',
  phoneEmergencyHoursEn: '24/7 assistance',
  emailContact: 'contact@apexiatransport.com',
  emailBooking: 'booking@apexiatransport.com',
  emailReclamation: 'reclamation@apexiatransport.com',
  whatsappUrl: 'https://wa.me/212664552211',
  offices: [
    { city: 'Rabat', address: 'Rue Jbel Moussa, Imm 22, Agdal', lat: 33.9716, lng: -6.8498 },
    { city: 'Casablanca', address: 'Angle Rue Mohamed Smiha et Pierre Parent\nEspace Paquet, Étg 1, Bur 123', lat: 33.5731, lng: -7.5898 },
    { city: 'Fès', address: 'Lot Mamounia, N°12', lat: 34.0209, lng: -5.0071 },
  ],
};

export type ResolvedContact = typeof DEFAULT_CONTACT;

// Settings values with the defaults filling any gap
export function resolveContact(c?: Partial<ContactInfo> | null): ResolvedContact {
  const out = { ...DEFAULT_CONTACT } as ResolvedContact;
  if (!c) return out;
  (Object.keys(DEFAULT_CONTACT) as (keyof ResolvedContact)[]).forEach(k => {
    if (k === 'offices') return;
    const v = (c as any)[k];
    if (typeof v === 'string' && v.trim()) (out as any)[k] = v.trim();
  });
  // English hours left empty: keep the default English text only while the French text
  // is also the default; if the French hours were changed, show those instead of stale English.
  ([['phoneOfficeHours', 'phoneOfficeHoursEn'], ['phoneSecondaryHours', 'phoneSecondaryHoursEn'], ['phoneEmergencyHours', 'phoneEmergencyHoursEn']] as const)
    .forEach(([fr, en]) => {
      const enGiven = typeof (c as any)[en] === 'string' && (c as any)[en].trim();
      if (!enGiven && out[fr] !== DEFAULT_CONTACT[fr]) out[en] = out[fr];
    });
  const offices = (c.offices || []).filter(o => o && o.city?.trim());
  if (offices.length) out.offices = offices;
  return out;
}

// Digits of the WhatsApp number, whether stored as "https://wa.me/2126..." or "+212 6 ..."
export const whatsappDigits = (c: ResolvedContact) => c.whatsappUrl.replace(/\D/g, '');

export function whatsappHref(c: ResolvedContact, text?: string) {
  return `https://wa.me/${whatsappDigits(c)}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

// "+212 6 64 55 22 11" style display for Moroccan numbers, "+<digits>" otherwise
export function whatsappDisplay(c: ResolvedContact) {
  const d = whatsappDigits(c);
  const m = d.match(/^212(\d)(\d{2})(\d{2})(\d{2})(\d{2})$/);
  return m ? `+212 ${m[1]} ${m[2]} ${m[3]} ${m[4]} ${m[5]}` : `+${d}`;
}
