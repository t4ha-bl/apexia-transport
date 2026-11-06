'use client';
import { useEffect, useState } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { DRIVER_STATUSES, DriverStatus, Job } from '@/lib/jobs';
import { Phone, WhatsappLogo, NavigationArrow, Users, Suitcase, AirplaneTilt, Car, ChatText, CheckCircle } from '@phosphor-icons/react';

// Public page opened by the driver from the secret link. Shows only what is needed
// to do the job and lets the driver report progress.
export default function MissionPage({ params }: { params: { token: string } }) {
  const [job, setJob] = useState<Job | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'invalid'>('loading');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!/^[A-Za-z0-9]{30,64}$/.test(params.token)) { setState('invalid'); return; }
    return onSnapshot(
      doc(db, 'jobs', params.token),
      snap => {
        if (!snap.exists()) { setState('invalid'); return; }
        setJob({ id: snap.id, ...(snap.data() as Omit<Job, 'id'>) });
        setState('ok');
      },
      () => setState('invalid') // expired or not allowed
    );
  }, [params.token]);

  const setStatus = async (s: DriverStatus) => {
    if (!job || saving) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'jobs', job.id), { driverStatus: s, driverStatusAt: new Date().toISOString() });
    } catch {
      alert("Impossible d'enregistrer le statut. Vérifiez votre connexion.");
    } finally {
      setSaving(false);
    }
  };

  if (state !== 'ok' || !job) {
    return (
      <main className="min-h-screen bg-offblack flex items-center justify-center p-6 text-center">
        {state === 'loading'
          ? <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          : <div>
              <div className="font-display text-[28px] text-ghost">Lien invalide ou expiré</div>
              <p className="font-sans text-[14px] text-muted mt-3">Demandez un nouveau lien à l&apos;équipe Apexia.</p>
            </div>}
      </main>
    );
  }

  const digits = job.customerPhone.replace(/\D/g, '');
  const tel = job.customerPhone.trim().startsWith('+') ? `+${digits}` : job.customerPhone.replace(/\s/g, '');
  const wa = job.customerPhone.trim().startsWith('+') ? digits : digits.startsWith('0') ? `212${digits.slice(1)}` : digits;
  const maps = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(job.pickup)}&destination=${encodeURIComponent(job.destination)}`;
  const dateText = new Date(`${job.date}T00:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const currentIdx = DRIVER_STATUSES.findIndex(s => s.id === job.driverStatus);
  const next = DRIVER_STATUSES[currentIdx + 1];

  const btn = 'flex items-center justify-center gap-2 border border-white/20 text-ghost font-sans text-[14px] py-3 rounded-[2px] active:scale-[0.98] transition';

  return (
    <main className="min-h-screen bg-offblack text-ghost">
      <div className="max-w-[560px] mx-auto px-5 py-6 flex flex-col gap-5">
        <header className="flex items-center justify-between">
          <div>
            <div className="font-display text-[20px] tracking-logo uppercase leading-none">APEXIA</div>
            <div className="font-sans text-[10px] text-muted tracking-label uppercase mt-1">Mission chauffeur</div>
          </div>
          <span className="font-sans text-[12px] text-muted">{job.ref}</span>
        </header>

        {job.bookingStatus === 'cancelled' && (
          <div className="p-4 border border-red-500/40 bg-red-500/10 rounded-[2px] font-sans text-[15px] text-red-300 text-center">
            Cette mission a été annulée.
          </div>
        )}

        <section className="bg-ink border border-white/10 rounded-[2px] p-5">
          <div className="font-sans text-[12px] text-muted capitalize-first">{dateText}</div>
          <div className="font-display text-[48px] leading-none mt-1">{job.time}</div>
          <div className="font-sans text-[13px] text-muted mt-2">{job.service}{job.driverName ? ` · ${job.driverName}` : ''}</div>
        </section>

        <section className="bg-ink border border-white/10 rounded-[2px] p-5 flex flex-col gap-3">
          <div>
            <div className="font-sans text-[12px] text-muted">Prise en charge</div>
            <div className="font-sans text-[16px] mt-1">{job.pickup}</div>
          </div>
          <div>
            <div className="font-sans text-[12px] text-muted">Destination</div>
            <div className="font-sans text-[16px] mt-1">{job.destination}</div>
          </div>
          <a href={maps} target="_blank" rel="noreferrer" className={btn}><NavigationArrow size={18} /> Itinéraire</a>
        </section>

        <section className="bg-ink border border-white/10 rounded-[2px] p-5 flex flex-col gap-3">
          <div className="font-sans text-[12px] text-muted">Client</div>
          <div className="font-sans text-[18px]">{job.customerName}</div>
          {job.signName && <div className="font-sans text-[13px] text-muted">Pancarte : <span className="text-ghost font-medium">{job.signName}</span></div>}
          <div className="grid grid-cols-2 gap-3">
            <a href={`tel:${tel}`} className={btn}><Phone size={18} /> Appeler</a>
            <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" className={btn}><WhatsappLogo size={18} /> WhatsApp</a>
          </div>
        </section>

        <section className="bg-ink border border-white/10 rounded-[2px] p-5 grid grid-cols-2 gap-4 font-sans text-[14px]">
          {job.vehicle && <div className="col-span-2 flex items-center gap-2"><Car size={16} className="text-muted" /> {job.vehicle}</div>}
          {job.passengers != null && <div className="flex items-center gap-2"><Users size={16} className="text-muted" /> {job.passengers} passager(s)</div>}
          {job.luggage != null && <div className="flex items-center gap-2"><Suitcase size={16} className="text-muted" /> {job.luggage} bagage(s)</div>}
          {job.flightNumber && <div className="col-span-2 flex items-center gap-2"><AirplaneTilt size={16} className="text-muted" /> Vol {job.flightNumber}</div>}
          {job.message && <div className="col-span-2 flex items-start gap-2 text-muted"><ChatText size={16} className="mt-0.5 shrink-0" /> <span className="text-ghost whitespace-pre-wrap">{job.message}</span></div>}
        </section>

        <section className="bg-ink border border-white/10 rounded-[2px] p-5 flex flex-col gap-4">
          <div className="font-sans text-[12px] text-muted">Avancement</div>
          <ol className="flex flex-col gap-2">
            {DRIVER_STATUSES.map((s, i) => (
              <li key={s.id} className={`flex items-center gap-3 font-sans text-[14px] ${i <= currentIdx ? 'text-ghost' : 'text-muted/50'}`}>
                <CheckCircle size={18} weight={i <= currentIdx ? 'fill' : 'regular'} />
                {s.label}
                {i === currentIdx && <span className="ml-auto font-sans text-[12px] text-muted">{new Date(job.driverStatusAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>}
              </li>
            ))}
          </ol>
          {next ? (
            <button onClick={() => setStatus(next.id)} disabled={saving}
              className="w-full bg-ghost text-offblack font-sans font-semibold text-[15px] py-4 rounded-[2px] active:scale-[0.98] transition disabled:opacity-50">
              {saving ? '…' : next.label}
            </button>
          ) : (
            <div className="text-center font-sans text-[14px] text-green-400">Mission terminée. Merci !</div>
          )}
          {currentIdx > 0 && (
            <button onClick={() => setStatus(DRIVER_STATUSES[currentIdx - 1].id)} disabled={saving} className="font-sans text-[12px] text-muted underline">
              Annuler la dernière étape
            </button>
          )}
        </section>
      </div>
    </main>
  );
}
