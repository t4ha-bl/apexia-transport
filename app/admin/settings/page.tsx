'use client';
import { useState, useEffect } from 'react';
import { fetchDocument, setDocument } from '@/lib/firebaseUtils';

export default function AdminSettings() {
  const [contactInfo, setContactInfo] = useState({
    phoneOffice: '', emailBooking: '', phoneEmergency: '', whatsappUrl: ''
  });
  
  const [legalTexts, setLegalTexts] = useState({
    privacy: '', terms: '', slavery: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const contactDoc = await fetchDocument('settings', 'contact');
        if (contactDoc) setContactInfo(contactDoc as any);

        const legalDoc = await fetchDocument('settings', 'legal');
        if (legalDoc) setLegalTexts(legalDoc as any);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSaveContact = async () => {
    setSaving(true);
    try {
      await setDocument('settings', 'contact', contactInfo);
      alert('Contact sauvegardé');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLegal = async () => {
    setSaving(true);
    try {
      await setDocument('settings', 'legal', legalTexts);
      alert('Textes légaux sauvegardés');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
     return <div className="p-8 text-muted">Chargement des paramètres...</div>;
  }

  return (
    <div className="max-w-[800px]">
      <h1 className="font-display text-[32px] text-ghost mb-8">Paramètres Généraux</h1>
      
      <div className="bg-ink border border-gold/15 rounded-[2px] p-8 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-sans font-semibold text-[16px] text-ghost">Contact & Agences</h2>
          <button onClick={handleSaveContact} disabled={saving} className="text-[12px] bg-ghost text-offblack px-4 py-1.5 rounded hover:bg-goldpale transition-colors">
            {saving ? '...' : 'Sauvegarder'}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-[11px] text-[#888] uppercase tracking-wide">Téléphone Bureau</label>
            <input type="text" value={contactInfo.phoneOffice} onChange={e => setContactInfo({...contactInfo, phoneOffice: e.target.value})} className="bg-[#151515] border border-gold/10 p-3 text-[14px] text-ghost outline-none focus:border-gold" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[11px] text-[#888] uppercase tracking-wide">Email Booking</label>
            <input type="text" value={contactInfo.emailBooking} onChange={e => setContactInfo({...contactInfo, emailBooking: e.target.value})} className="bg-[#151515] border border-gold/10 p-3 text-[14px] text-ghost outline-none focus:border-gold" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[11px] text-[#888] uppercase tracking-wide">Numéro Urgence</label>
            <input type="text" value={contactInfo.phoneEmergency} onChange={e => setContactInfo({...contactInfo, phoneEmergency: e.target.value})} className="bg-[#151515] border border-gold/10 p-3 text-[14px] text-ghost outline-none focus:border-gold" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[11px] text-[#888] uppercase tracking-wide">Lien WhatsApp</label>
            <input type="text" value={contactInfo.whatsappUrl} onChange={e => setContactInfo({...contactInfo, whatsappUrl: e.target.value})} className="bg-[#151515] border border-gold/10 p-3 text-[14px] text-ghost outline-none focus:border-gold" />
          </div>
        </div>
      </div>

      <div className="bg-ink border border-gold/15 rounded-[2px] p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-sans font-semibold text-[16px] text-ghost">Textes Légaux</h2>
          <button onClick={handleSaveLegal} disabled={saving} className="text-[12px] bg-ghost text-offblack px-4 py-1.5 rounded hover:bg-goldpale transition-colors">
            {saving ? '...' : 'Sauvegarder'}
          </button>
        </div>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-[11px] text-[#888] uppercase tracking-wide">Politique de Confidentialité</label>
            <textarea value={legalTexts.privacy} onChange={e => setLegalTexts({...legalTexts, privacy: e.target.value})} className="bg-[#151515] border border-gold/10 p-4 text-[14px] text-ghost h-32 outline-none focus:border-gold resize-none" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[11px] text-[#888] uppercase tracking-wide">Conditions Générales (CGV)</label>
            <textarea value={legalTexts.terms} onChange={e => setLegalTexts({...legalTexts, terms: e.target.value})} className="bg-[#151515] border border-gold/10 p-4 text-[14px] text-ghost h-32 outline-none focus:border-gold resize-none" />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[11px] text-[#888] uppercase tracking-wide">Déclaration Modern Slavery</label>
            <textarea value={legalTexts.slavery} onChange={e => setLegalTexts({...legalTexts, slavery: e.target.value})} className="bg-[#151515] border border-gold/10 p-4 text-[14px] text-ghost h-32 outline-none focus:border-gold resize-none" />
          </div>
        </div>
      </div>

    </div>
  );
}
