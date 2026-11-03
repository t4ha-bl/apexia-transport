'use client';
import { useState, useEffect } from 'react';
import { fetchDocument, setDocument } from '@/lib/firebaseUtils';
import { PageHeader, useToast, inputClass, labelClass, primaryBtn } from '@/components/admin/ui';
import { FloppyDisk } from '@phosphor-icons/react';

type SavingKey = 'contact' | 'legal' | null;

export default function AdminSettings() {
  const toast = useToast();
  const [contactInfo, setContactInfo] = useState({
    phoneOffice: '', emailBooking: '', phoneEmergency: '', whatsappUrl: ''
  });

  const [legalTexts, setLegalTexts] = useState({
    privacy: '', terms: '', slavery: '',
    privacyEn: '', termsEn: '', slaveryEn: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<SavingKey>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const contactDoc = await fetchDocument('settings', 'contact');
        if (contactDoc) setContactInfo(prev => ({ ...prev, ...(contactDoc as any) }));

        const legalDoc = await fetchDocument('settings', 'legal');
        if (legalDoc) setLegalTexts(prev => ({ ...prev, ...(legalDoc as any) }));
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
      await setDocument('settings', key, data);
      toast('success', okMessage);
    } catch (err) {
      console.error(err);
      toast('error', "Échec de l'enregistrement.");
    } finally {
      setSaving(null);
    }
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
    <div className="max-w-[900px]">
      <PageHeader
        eyebrow="Configuration"
        title="Paramètres"
        subtitle="Coordonnées affichées sur le site et textes légaux."
      />

      <section className="bg-ink border border-white/10 rounded-[2px] mb-8">
        <div className="flex flex-wrap justify-between items-center gap-3 px-6 md:px-8 py-5 border-b border-white/10">
          <h2 className="font-display text-[26px] text-ghost">Contact & Agences</h2>
          <SaveButton k="contact" onClick={() => save('contact', contactInfo, 'Contact sauvegardé.')} />
        </div>
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClass}>Téléphone Bureau</label>
            <input type="text" value={contactInfo.phoneOffice} onChange={e => setContactInfo({ ...contactInfo, phoneOffice: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Email Booking</label>
            <input type="text" value={contactInfo.emailBooking} onChange={e => setContactInfo({ ...contactInfo, emailBooking: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Numéro Urgence</label>
            <input type="text" value={contactInfo.phoneEmergency} onChange={e => setContactInfo({ ...contactInfo, phoneEmergency: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Lien WhatsApp</label>
            <input type="text" value={contactInfo.whatsappUrl} onChange={e => setContactInfo({ ...contactInfo, whatsappUrl: e.target.value })} className={inputClass} />
          </div>
        </div>
      </section>

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
