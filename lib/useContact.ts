import { useMemo } from 'react';
import { useStore } from './store/dataStore';
import { resolveContact } from './contact';
import { pick } from './i18n/localized';

// Contact details for the public site: Paramètres values (live), defaults for any gap,
// opening hours in the visitor's language.
export function useContact() {
  const contactInfo = useStore(s => s.contactInfo);
  const lang = useStore(s => s.lang);
  return useMemo(() => {
    const c = resolveContact(contactInfo);
    return {
      ...c,
      officeHours: pick(lang, c.phoneOfficeHours, c.phoneOfficeHoursEn),
      secondaryHours: pick(lang, c.phoneSecondaryHours, c.phoneSecondaryHoursEn),
      emergencyHours: pick(lang, c.phoneEmergencyHours, c.phoneEmergencyHoursEn),
    };
  }, [contactInfo, lang]);
}
