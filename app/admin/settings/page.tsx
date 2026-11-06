'use client';
import { useState, useEffect } from 'react';
import { fetchDocument, setDocument } from '@/lib/firebaseUtils';
import { PageHeader, useToast, inputClass, labelClass, primaryBtn } from '@/components/admin/ui';
import { FloppyDisk, X } from '@phosphor-icons/react';
import { resolveContact, whatsappDisplay, ResolvedContact } from '@/lib/contact';
import { CompanyInfo, DEFAULT_COMPANY } from '@/lib/billing';
import RetentionTool from '@/components/admin/RetentionTool';
import AppearanceSetting from '@/components/admin/AppearanceSetting';
import AccountSetting from '@/components/admin/AccountSetting';
import { useAuth } from '@/lib/AuthContext';

type SavingKey = 'contact' | 'legal' | 'company' | null;

const COMPANY_FIELDS: { key: Exclude<keyof CompanyInfo, 'defaultVatRate'>; label: string; wide?: boolean; area?: boolean }[] = [
  { key: 'legalName', label: 'Raison sociale' },
  { key: 'email', label: 'E-mail' },
  { key: 'address', label: 'Adresse', wide: true, area: true },
  { key: 'phone', label: 'Téléphone' },
  { key: 'ice', label: 'ICE' },
  { key: 'if', label: 'Identifiant fiscal (IF)' },
  { key: 'rc', label: 'Registre de commerce (RC)' },
  { key: 'cnss', label: 'CNSS' },
  { key: 'patente', label: 'Patente / TP' },
  { key: 'bank', label: 'Banque' },
  { key: 'rib', label: 'RIB' },
  { key: 'paymentTerms', label: 'Conditions de paiement (factures)', wide: true },
  { key: 'footer', label: 'Mention de bas de page (optionnel)', wide: true },
];

// Contact fields shown in the form (offices are edited separately as text)
const CONTACT_FIELDS: { key: keyof Omit<ResolvedContact, 'offices' | 'whatsappUrl'>; label: string; half?: boolean }[] = [
  { key: 'phoneOffice', label: 'Téléphone bureau' },
  { key: 'phoneOfficeHours', label: 'Horaires bureau (FR)', half: true },
  { key: 'phoneOfficeHoursEn', label: 'Horaires bureau (EN)', half: true },
  { key: 'phoneSecondary', label: 'Téléphone secondaire' },
  { key: 'phoneSecondaryHours', label: 'Horaires secondaire (FR)', half: true },
  { key: 'phoneSecondaryHoursEn', label: 'Horaires secondaire (EN)', half: true },
  { key: 'phoneEmergency', label: "Numéro d'assistance 24/7" },
  { key: 'phoneEmergencyHours', label: 'Horaires assistance (FR)', half: true },
  { key: 'phoneEmergencyHoursEn', label: 'Horaires assistance (EN)', half: true },
  { key: 'emailContact', label: 'E-mail contact' },
  { key: 'emailBooking', label: 'E-mail réservations (reçoit aussi les alertes)' },
  { key: 'emailReclamation', label: 'E-mail réclamations' },
];

type OfficeForm = { city: string; address: string; lat: string; lng: string };

// Paramètres: everyone gets their account (sign-out) and the appearance; the website
// settings below are for the owner only (firestore.rules enforces the same).
export default function AdminSettings() {
  const { can } = useAuth();
  const isOwner = can('settings');
  return (
    <div className="max-w-[900px]">
      <PageHeader
        eyebrow="Configuration"
        title="Paramètres"
        subtitle={isOwner ? 'Votre compte, l’apparence du tableau de bord, les coordonnées du site et les textes légaux.' : 'Votre compte et l’apparence du tableau de bord.'}
      />
      <AccountSetting />
      <AppearanceSetting />
      {isOwner && <SiteSettings />}
    </div>
  );
}

function SiteSettings() {
  const toast = useToast();
  const [contactInfo, setContactInfo] = useState<ResolvedContact>(resolveContact(null));
  const [whatsapp, setWhatsapp] = useState('');
  const [offices, setOffices] = useState<OfficeForm[]>([]);

  const [legalTexts, setLegalTexts] = useState({
    privacy: '', terms: '', slavery: '',
    privacyEn: '', termsEn: '', slaveryEn: ''
  });

  const [company, setCompany] = useState<CompanyInfo>(DEFAULT_COMPANY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<SavingKey>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const resolved = resolveContact((await fetchDocument('settings', 'contact')) as any);
        setContactInfo(resolved);
        setWhatsapp(whatsappDisplay(resolved));
        setOffices(resolved.offices.map(o => ({ city: o.city, address: o.address, lat: String(o.lat), lng: String(o.lng) })));

        const legalDoc = await fetchDocument('settings', 'legal');
        if (legalDoc) setLegalTexts(prev => ({ ...prev, ...(legalDoc as any) }));

        // Company details for invoices live in the admin-only `config` collection
        const companyDoc = await fetchDocument('config', 'company');
        if (companyDoc) setCompany({ ...DEFAULT_COMPANY, ...(companyDoc as any) });
      } catch (err) {
        console.error(err);
        toast('error', 'Impossible de charger les paramètres.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async (key: Exclude<SavingKey, null>, data: object, okMessage: string) => {
    setSaving(key);
    try {
      await setDocument(key === 'company' ? 'config' : 'settings', key, data);
      toast('success', okMessage);
    } catch (err) {
      console.error(err);
      toast('error', "Échec de l'enregistrement.");
    } finally {
      setSaving(null);
    }
  };

  const saveContact = () => {
    const digits = whatsapp.replace(/\D/g, '');
    if (digits.length < 8) { toast('error', 'Numéro WhatsApp invalide (incluez l’indicatif, ex : +212 6…).'); return; }
    const badEmail = (['emailContact', 'emailBooking', 'emailReclamation'] as const)
      .find(k => contactInfo[k] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactInfo[k]));
    if (badEmail) { toast('error', 'Une adresse e-mail est invalide.'); return; }
    const parsedOffices = offices.filter(o => o.city.trim()).map(o => ({
      city: o.city.trim(), address: o.address.trim(), lat: Number(o.lat), lng: Number(o.lng),
    }));
    if (parsedOffices.some(o => !(o.lat >= 20 && o.lat <= 37 && o.lng >= -18 && o.lng <= 0))) {
      toast('error', 'Coordonnées GPS invalides (le Maroc est entre 20 et 37 de latitude, -18 et 0 de longitude).');
      return;
    }
    const data: Record<string, unknown> = { whatsappUrl: `https://wa.me/${digits}`, offices: parsedOffices };
    CONTACT_FIELDS.forEach(f => { data[f.key] = (contactInfo[f.key] || '').trim(); });
    save('contact', data, 'Contact sauvegardé : le site est mis à jour.');
  };

  if (loading) {
    return <div className="py-16 text-center font-sans text-[14px] text-muted">Chargement des paramètres…</div>;
  }

  const SaveButton = ({ k, onClick }: { k: Exclude<SavingKey, null>; onClick: () => void }) => (
    <button onClick={onClick} disabled={saving !== null} className={primaryBtn}>
      <FloppyDisk size={14} /> {saving === k ? 'Enregistrement…' : 'Sauvegarder'}
    </button>
  );

  return (
    <div>
      <section className="bg-ink border border-white/10 rounded-[2px] mb-8">
        <div className="flex flex-wrap justify-between items-center gap-3 px-6 md:px-8 py-5 border-b border-white/10">
          <h2 className="font-display text-[26px] text-ghost">Contact & Agences</h2>
          <SaveButton k="contact" onClick={saveContact} />
        </div>
        <div className="p-6 md:p-8 flex flex-col gap-8">
          <p className="font-sans text-[12px] text-muted -mb-4">Affiché dans le pied de page, la section « Nos bureaux », le menu et les boutons WhatsApp du site.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {CONTACT_FIELDS.map(f => (
              <div key={f.key} className={f.half ? '' : 'md:col-span-2'}>
                <label className={labelClass}>{f.label}</label>
                <input type="text" value={contactInfo[f.key] || ''} onChange={e => setContactInfo({ ...contactInfo, [f.key]: e.target.value })} className={inputClass} />
              </div>
            ))}
            <div className="md:col-span-2">
              <label className={labelClass}>Numéro WhatsApp (avec indicatif)</label>
              <input type="text" value={whatsapp} placeholder="+212 6 64 55 22 11" onChange={e => setWhatsapp(e.target.value)} className={inputClass} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-[20px] text-ghost">Bureaux</h3>
              <button type="button" onClick={() => setOffices([...offices, { city: '', address: '', lat: '', lng: '' }])}
                className="font-sans text-[12px] px-2 py-1 border border-dashed border-white/20 text-muted hover:text-ghost hover:border-white/40 rounded-[2px]">
                + Ajouter un bureau
              </button>
            </div>
            <p className="font-sans text-[12px] text-muted mb-4">Latitude / longitude : clic droit sur le lieu dans Google Maps, puis copiez les deux nombres.</p>
            <div className="flex flex-col gap-4">
              {offices.map((o, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-[1fr_2fr_110px_110px_auto] gap-3 items-start p-4 bg-offblack border border-white/10 rounded-[2px]">
                  <input className={inputClass} placeholder="Ville" value={o.city} onChange={e => setOffices(offices.map((x, j) => (j === i ? { ...x, city: e.target.value } : x)))} />
                  <textarea className={`${inputClass} h-[76px] resize-y`} placeholder="Adresse" value={o.address} onChange={e => setOffices(offices.map((x, j) => (j === i ? { ...x, address: e.target.value } : x)))} />
                  <input className={inputClass} placeholder="Lat" value={o.lat} onChange={e => setOffices(offices.map((x, j) => (j === i ? { ...x, lat: e.target.value } : x)))} />
                  <input className={inputClass} placeholder="Lng" value={o.lng} onChange={e => setOffices(offices.map((x, j) => (j === i ? { ...x, lng: e.target.value } : x)))} />
                  <button type="button" onClick={() => setOffices(offices.filter((_, j) => j !== i))}
                    className="h-[46px] px-3 border border-white/10 text-muted hover:text-red-400 rounded-[2px]" aria-label="Retirer"><X size={14} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-ink border border-white/10 rounded-[2px] mb-8">
        <div className="flex flex-wrap justify-between items-center gap-3 px-6 md:px-8 py-5 border-b border-white/10">
          <h2 className="font-display text-[26px] text-ghost">Société & facturation</h2>
          <SaveButton k="company" onClick={() => {
            if (!(company.defaultVatRate >= 0 && company.defaultVatRate <= 100)) { toast('error', 'Taux de TVA invalide.'); return; }
            save('company', company, 'Informations société sauvegardées.');
          }} />
        </div>
        <div className="p-6 md:p-8 flex flex-col gap-6">
          <p className="font-sans text-[12px] text-muted -mb-2">Imprimé sur les devis et factures. Non visible sur le site public.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {COMPANY_FIELDS.map(f => (
              <div key={f.key} className={f.wide ? 'md:col-span-2' : ''}>
                <label className={labelClass}>{f.label}</label>
                {f.area
                  ? <textarea className={`${inputClass} h-20 resize-y`} value={company[f.key]} onChange={e => setCompany({ ...company, [f.key]: e.target.value })} />
                  : <input className={inputClass} value={company[f.key]} onChange={e => setCompany({ ...company, [f.key]: e.target.value })} />}
              </div>
            ))}
            <div>
              <label className={labelClass}>Taux de TVA par défaut (%)</label>
              <input type="number" min={0} max={100} step="0.5" className={inputClass} value={company.defaultVatRate} onChange={e => setCompany({ ...company, defaultVatRate: Number(e.target.value) })} />
              <p className="font-sans text-[12px] text-amber-200/80 mt-2">À confirmer avec votre comptable pour le transport touristique.</p>
            </div>
          </div>
        </div>
      </section>

      <RetentionTool />

      <section className="bg-ink border border-white/10 rounded-[2px]">
        <div className="flex flex-wrap justify-between items-center gap-3 px-6 md:px-8 py-5 border-b border-white/10">
          <h2 className="font-display text-[26px] text-ghost">Textes légaux</h2>
          <SaveButton k="legal" onClick={() => save('legal', legalTexts, 'Textes légaux sauvegardés.')} />
        </div>
        <div className="p-6 md:p-8 flex flex-col gap-6">
          <p className="font-sans text-[12px] text-muted -mb-2">
            Le texte anglais s&apos;affiche quand le site est en anglais. S&apos;il est vide, le texte français est utilisé.
          </p>
          <div>
            <label className={labelClass}>Politique de Confidentialité (FR)</label>
            <textarea value={legalTexts.privacy} onChange={e => setLegalTexts({ ...legalTexts, privacy: e.target.value })} className={`${inputClass} h-40 resize-y`} />
          </div>
          <div>
            <label className={labelClass}>Privacy Policy (EN)</label>
            <textarea value={legalTexts.privacyEn} onChange={e => setLegalTexts({ ...legalTexts, privacyEn: e.target.value })} className={`${inputClass} h-40 resize-y`} />
          </div>
          <div>
            <label className={labelClass}>Conditions Générales (CGV) (FR)</label>
            <textarea value={legalTexts.terms} onChange={e => setLegalTexts({ ...legalTexts, terms: e.target.value })} className={`${inputClass} h-40 resize-y`} />
          </div>
          <div>
            <label className={labelClass}>General Terms & Conditions (EN)</label>
            <textarea value={legalTexts.termsEn} onChange={e => setLegalTexts({ ...legalTexts, termsEn: e.target.value })} className={`${inputClass} h-40 resize-y`} />
          </div>
          <div>
            <label className={labelClass}>Déclaration Modern Slavery (FR)</label>
            <textarea value={legalTexts.slavery} onChange={e => setLegalTexts({ ...legalTexts, slavery: e.target.value })} className={`${inputClass} h-40 resize-y`} />
          </div>
          <div>
            <label className={labelClass}>Modern Slavery Statement (EN)</label>
            <textarea value={legalTexts.slaveryEn} onChange={e => setLegalTexts({ ...legalTexts, slaveryEn: e.target.value })} className={`${inputClass} h-40 resize-y`} />
          </div>
        </div>
      </section>
    </div>
  );
}
