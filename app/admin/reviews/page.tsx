'use client';
import { useEffect, useMemo, useState } from 'react';
import { Star, WhatsappLogo, LinkSimple, GearSix, CheckCircle, EnvelopeSimple, ArrowCounterClockwise, Warning } from '@phosphor-icons/react';
import { PageHeader, Modal, useToast, inputClass, labelClass, primaryBtn, ghostBtn } from '@/components/admin/ui';
import { useAdminData } from '@/components/admin/useAdminData';
import { useAuth } from '@/lib/AuthContext';
import { subscribeDocument, setDocument } from '@/lib/firebaseUtils';
import { phoneKey } from '@/lib/customers';
import { Reservation } from '@/lib/store/types';
import { awaitingReview, createReviewRequest, isSubmitted, markFollowedUp, reviewUrl, subscribeReviews } from '@/lib/reviews';
import { firstNameOf, isValidEmail, Review, ReviewSettings, reviewMessage, withReviewDefaults } from '@/lib/reviewTemplates';

const fmtDate = (d?: string) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
const fmtTs = (ts: any) => {
  const d = ts?.toDate ? ts.toDate() : ts ? new Date(ts) : null;
  return d && !isNaN(d.getTime()) ? d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '';
};

function Stars({ n, size = 14 }: { n: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${n} sur 5`}>
      {[1, 2, 3, 4, 5].map(i => <Star key={i} size={size} weight={i <= n ? 'fill' : 'regular'} className={i <= n ? 'text-ghost' : 'text-white/20'} />)}
    </span>
  );
}

function Tile({ label, value, sub, warn }: { label: string; value: React.ReactNode; sub?: string; warn?: boolean }) {
  return (
    <div className={`p-5 bg-ink border rounded-[2px] ${warn ? 'border-red-400/40' : 'border-white/10'}`}>
      <div className="font-sans text-[12px] text-muted">{label}</div>
      <div className="font-sans font-medium text-[28px] leading-none mt-3 text-ghost">{value}</div>
      {sub && <div className="font-sans text-[12px] text-muted mt-2">{sub}</div>}
    </div>
  );
}

type Filter = 'all' | 'followup' | 'waiting';

export default function AdminReviews() {
  const toast = useToast();
  const { can } = useAuth();
  const isOwner = can('settings');
  const { reservations, services, loading } = useAdminData(msg => toast('error', msg));
  const [reviews, setReviews] = useState<Review[]>([]);
  const [settings, setSettings] = useState<ReviewSettings>(withReviewDefaults(null));
  const [editing, setEditing] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    const u1 = subscribeReviews(500, setReviews, err => { console.error(err); toast('error', 'Impossible de charger les avis.'); });
    const u2 = subscribeDocument('settings', 'reviews', row => setSettings(withReviewDefaults(row)), console.error);
    return () => { u1(); u2(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const byId = useMemo(() => new Map(reservations.map(r => [r.id, r])), [reservations]);
  const serviceTitle = (r: Reservation) => {
    const s = services.find(x => x.id === r.service);
    return (r.lang === 'en' && s?.titleEn) || s?.title || r.service;
  };
  const queue = useMemo(() => awaitingReview(reservations), [reservations]);

  const answered = reviews.filter(isSubmitted);
  const avg = answered.length ? answered.reduce((s, r) => s + (r.rating || 0), 0) / answered.length : 0;
  const toFollow = answered.filter(r => (r.rating || 0) <= 3 && !r.followUpDone);
  const waiting = reviews.filter(r => !isSubmitted(r));
  const dist = [5, 4, 3, 2, 1].map(n => ({ n, count: answered.filter(r => r.rating === n).length }));
  const maxDist = Math.max(1, ...dist.map(d => d.count));

  const shown = filter === 'followup' ? toFollow : filter === 'waiting' ? waiting : reviews;

  // Opened before any await so the browser does not block the WhatsApp tab
  const openWhatsApp = (phone: string, text: string) => {
    const url = `https://wa.me/${phoneKey(phone)}?text=${encodeURIComponent(text)}`;
    const w = window.open(url, '_blank', 'noopener');
    if (!w) window.location.href = url;
  };
  const messageFor = (r: Reservation, token: string) =>
    reviewMessage(settings, r.lang === 'en' ? 'en' : 'fr', { prenom: firstNameOf(r.fullName), ref: r.ref || '', lien: reviewUrl(token) });

  const sendWhatsApp = async (r: Reservation) => {
    const tab = window.open('about:blank', '_blank');
    setBusy(r.id);
    try {
      const token = await createReviewRequest(r, serviceTitle(r), 'whatsapp');
      const url = `https://wa.me/${phoneKey(r.phone)}?text=${encodeURIComponent(messageFor(r, token))}`;
      if (tab) { tab.opener = null; tab.location.href = url; } else window.location.href = url;
      toast('success', `Demande d'avis créée pour ${r.ref}.`);
    } catch (err) {
      console.error(err); tab?.close();
      toast('error', "Impossible de créer la demande d'avis.");
    } finally { setBusy(null); }
  };

  const copyLink = async (r: Reservation) => {
    setBusy(r.id);
    try {
      const token = await createReviewRequest(r, serviceTitle(r), 'link');
      await navigator.clipboard.writeText(messageFor(r, token)).catch(() => {});
      toast('success', 'Message copié : collez-le dans SMS, WhatsApp ou e-mail.');
    } catch (err) { console.error(err); toast('error', "Impossible de créer la demande d'avis."); }
    finally { setBusy(null); }
  };

  const resend = (rv: Review) => {
    const r = byId.get(rv.reservationId);
    if (!r?.phone) { toast('error', 'Numéro du client introuvable.'); return; }
    openWhatsApp(r.phone, messageFor(r, rv.id));
  };

  const contact = (rv: Review) => {
    const r = byId.get(rv.reservationId);
    if (!r?.phone) { toast('error', 'Numéro du client introuvable.'); return; }
    openWhatsApp(r.phone, rv.lang === 'en'
      ? `Hello ${rv.firstName}, thank you for your feedback on your ride ${rv.ref}. We are sorry it did not fully meet your expectations. Could you tell us more?`
      : `Bonjour ${rv.firstName}, merci pour votre retour sur votre course ${rv.ref}. Nous sommes désolés qu'elle n'ait pas été à la hauteur. Pouvez-vous nous en dire plus ?`);
  };

  const followUp = async (rv: Review, done: boolean) => {
    try { await markFollowedUp(rv, done); }
    catch (err) { console.error(err); toast('error', "Échec de l'enregistrement."); }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Avis clients"
        subtitle="Demandez un avis après chaque course, suivez les notes et rappelez les clients déçus."
        action={isOwner ? <button onClick={() => setEditing(true)} className={`${ghostBtn} inline-flex items-center gap-2`}><GearSix size={16} /> Réglages</button> : undefined}
      />

      {isOwner && !settings.googleUrl && (
        <div className="mb-6 p-4 border border-white/15 bg-ink rounded-[2px] flex items-start gap-3">
          <Warning size={18} className="text-ghost mt-0.5 shrink-0" />
          <div className="font-sans text-[13px] text-muted">
            Ajoutez votre lien d&apos;avis Google dans <button onClick={() => setEditing(true)} className="text-ghost underline">Réglages</button> pour que les clients puissent aussi noter Apexia sur Google.
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Tile label="Note moyenne" value={answered.length ? <span className="inline-flex items-center gap-2">{avg.toFixed(1).replace('.', ',')}<Star size={22} weight="fill" /></span> : '—'} sub={answered.length ? `sur ${answered.length} avis` : 'Aucun avis pour le moment'} />
        <Tile label="Avis reçus" value={answered.length} sub={`${reviews.length} demande(s) envoyée(s)`} />
        <Tile label="Taux de réponse" value={reviews.length ? `${Math.round((answered.length / reviews.length) * 100)} %` : '—'} sub={`${waiting.length} sans réponse`} />
        <Tile label="À rappeler" value={toFollow.length} sub="Notes de 1 à 3 non traitées" warn={toFollow.length > 0} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6 mb-10">
        {/* Queue */}
        <section className="bg-ink border border-white/10 rounded-[2px] min-w-0">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-sans font-medium text-[14px] text-ghost">Courses terminées à qui demander un avis</h2>
              <p className="font-sans text-[12px] text-muted mt-0.5">14 derniers jours · courses confirmées{settings.autoEmail ? ' · les clients avec e-mail le reçoivent automatiquement le lendemain' : ''}</p>
            </div>
            <span className="font-sans text-[12px] text-muted">{loading ? '…' : queue.length}</span>
          </div>
          {loading ? (
            <div className="p-8 text-center font-sans text-[13px] text-muted">Chargement…</div>
          ) : !queue.length ? (
            <div className="p-8 text-center font-sans text-[13px] text-muted">Rien à envoyer. Toutes les courses récentes ont reçu leur demande.</div>
          ) : (
            <ul className="divide-y divide-white/5 max-h-[420px] overflow-y-auto">
              {queue.map(r => (
                <li key={r.id} className="px-5 py-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-sans text-[13px] text-ghost truncate">{r.fullName} <span className="text-muted">· {r.ref}</span></div>
                    <div className="font-sans text-[12px] text-muted truncate">
                      {fmtDate(r.date)} · {serviceTitle(r)}
                      {isValidEmail(r.email) && settings.autoEmail && <span className="inline-flex items-center gap-1 ml-2"><EnvelopeSimple size={11} /> e-mail auto</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button disabled={busy === r.id} onClick={() => sendWhatsApp(r)} className={`${primaryBtn} !px-3 !py-2 inline-flex items-center gap-1.5 text-[12px]`}><WhatsappLogo size={15} /> WhatsApp</button>
                    <button disabled={busy === r.id} onClick={() => copyLink(r)} title="Créer le lien et copier le message" className={`${ghostBtn} !px-3 !py-2 inline-flex items-center gap-1.5 text-[12px]`}><LinkSimple size={15} /> Copier</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Distribution */}
        <section className="bg-ink border border-white/10 rounded-[2px] p-5">
          <h2 className="font-sans font-medium text-[14px] text-ghost mb-4">Répartition des notes</h2>
          <div className="flex flex-col gap-2.5">
            {dist.map(d => (
              <div key={d.n} className="flex items-center gap-3 font-sans text-[12px]">
                <span className="w-8 text-muted inline-flex items-center gap-1">{d.n}<Star size={11} weight="fill" /></span>
                <div className="flex-1 h-2.5 bg-white/5 rounded-[1px] overflow-hidden">
                  <div className="h-full bg-soft" style={{ width: `${(d.count / maxDist) * 100}%` }} />
                </div>
                <span className="w-6 text-right text-ghost">{d.count}</span>
              </div>
            ))}
          </div>
          {settings.googleUrl && (
            <a href={settings.googleUrl} target="_blank" rel="noopener noreferrer" className="block mt-6 font-sans text-[12px] text-muted hover:text-ghost underline">Voir la page d&apos;avis Google</a>
          )}
        </section>
      </div>

      {/* Reviews */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {([['all', `Toutes (${reviews.length})`], ['followup', `À rappeler (${toFollow.length})`], ['waiting', `Sans réponse (${waiting.length})`]] as [Filter, string][]).map(([id, label]) => (
          <button key={id} onClick={() => setFilter(id)}
            className={`px-4 py-2 font-sans text-[12px] border rounded-[2px] transition-colors ${filter === id ? 'border-white text-ghost bg-white/5' : 'border-white/10 text-muted hover:text-ghost'}`}>
            {label}
          </button>
        ))}
      </div>

      {!shown.length ? (
        <div className="p-10 text-center bg-ink border border-white/10 rounded-[2px] font-sans text-[13px] text-muted">
          {filter === 'followup' ? 'Aucun client à rappeler.' : filter === 'waiting' ? 'Aucune demande en attente.' : "Aucune demande d'avis pour le moment."}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {shown.map(rv => {
            const done = isSubmitted(rv);
            const low = done && (rv.rating || 0) <= 3;
            const expired = !done && rv.expiresAtMs < Date.now();
            return (
              <article key={rv.id} className={`bg-ink border rounded-[2px] p-5 ${low && !rv.followUpDone ? 'border-red-400/40' : 'border-white/10'}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      {done ? <Stars n={rv.rating || 0} size={16} /> : <span className="font-sans text-[12px] text-muted">{expired ? 'Expirée' : 'En attente de réponse'}</span>}
                      <span className="font-sans text-[13px] text-ghost">{rv.firstName || 'Client'}</span>
                      <span className="font-sans text-[12px] text-muted">{rv.ref} · {fmtDate(rv.date)} · {rv.service}</span>
                    </div>
                    {done && rv.comment && <p className="font-sans text-[14px] text-ghost/90 mt-3 leading-relaxed whitespace-pre-line break-words">« {rv.comment} »</p>}
                    <div className="font-sans text-[12px] text-muted mt-2">
                      Envoyée {fmtTs(rv.createdAt)} par {rv.channel === 'email' ? 'e-mail' : rv.channel === 'whatsapp' ? 'WhatsApp' : 'lien'}
                      {done && rv.submittedAt ? ` · répondu le ${fmtTs(rv.submittedAt)}` : ''}
                      {rv.followUpDone ? ` · client recontacté${rv.followUpBy ? ` (${rv.followUpBy})` : ''}` : ''}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!done && !expired && can('reviews') && (
                      <button onClick={() => resend(rv)} className={`${ghostBtn} !px-3 !py-2 inline-flex items-center gap-1.5 text-[12px]`}><ArrowCounterClockwise size={14} /> Relancer</button>
                    )}
                    {low && can('reviews') && (
                      <>
                        <button onClick={() => contact(rv)} className={`${ghostBtn} !px-3 !py-2 inline-flex items-center gap-1.5 text-[12px]`}><WhatsappLogo size={14} /> Contacter</button>
                        {rv.followUpDone
                          ? <button onClick={() => followUp(rv, false)} className={`${ghostBtn} !px-3 !py-2 text-[12px]`}>Rouvrir</button>
                          : <button onClick={() => followUp(rv, true)} className={`${primaryBtn} !px-3 !py-2 inline-flex items-center gap-1.5 text-[12px]`}><CheckCircle size={14} /> Traité</button>}
                      </>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {isOwner && <SettingsModal open={editing} settings={settings} onClose={() => setEditing(false)} />}
    </div>
  );
}

function SettingsModal({ open, settings, onClose }: { open: boolean; settings: ReviewSettings; onClose: () => void }) {
  const toast = useToast();
  const [f, setF] = useState(settings);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (open) setF(settings); }, [open, settings]);

  const save = async () => {
    const url = f.googleUrl.trim();
    if (url && !/^https:\/\/\S+$/.test(url)) { toast('error', 'Le lien Google doit commencer par https://'); return; }
    for (const m of [f.messageFr, f.messageEn]) {
      if (!m.includes('{lien}')) { toast('error', 'Chaque message doit contenir {lien}.'); return; }
    }
    setSaving(true);
    try {
      await setDocument('settings', 'reviews', {
        googleUrl: url, autoEmail: f.autoEmail,
        messageFr: f.messageFr.trim().slice(0, 1000), messageEn: f.messageEn.trim().slice(0, 1000),
      });
      toast('success', 'Réglages des avis enregistrés.');
      onClose();
    } catch (err) { console.error(err); toast('error', "Échec de l'enregistrement."); }
    finally { setSaving(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="Réglages des avis" maxWidth="max-w-[680px]">
      <div className="flex flex-col gap-6">
        <div>
          <label className={labelClass}>Lien d&apos;avis Google</label>
          <input className={inputClass} placeholder="https://g.page/r/…/review" value={f.googleUrl} onChange={e => setF({ ...f, googleUrl: e.target.value })} />
          <p className="font-sans text-[12px] text-muted mt-2 leading-relaxed">
            Dans votre fiche Google Business Profile : « Demander des avis » puis copiez le lien. Il est proposé à tous les clients après leur note,
            quelle qu&apos;elle soit (Google interdit de ne l&apos;envoyer qu&apos;aux clients satisfaits).
          </p>
        </div>
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" className="mt-1 accent-white" checked={f.autoEmail} onChange={e => setF({ ...f, autoEmail: e.target.checked })} />
          <span className="font-sans text-[13px] text-ghost">
            Envoyer automatiquement la demande par e-mail
            <span className="block text-[12px] text-muted mt-1">Chaque jour, aux clients qui ont donné leur e-mail, après la fin de leur course. Les autres apparaissent dans la liste pour un envoi WhatsApp en un clic.</span>
          </span>
        </label>
        <div>
          <label className={labelClass}>Message (français)</label>
          <textarea className={`${inputClass} h-28 resize-y`} value={f.messageFr} onChange={e => setF({ ...f, messageFr: e.target.value })} />
        </div>
        <div>
          <label className={labelClass}>Message (anglais)</label>
          <textarea className={`${inputClass} h-28 resize-y`} value={f.messageEn} onChange={e => setF({ ...f, messageEn: e.target.value })} />
          <p className="font-sans text-[12px] text-muted mt-2">Variables : {'{prenom}'} prénom du client, {'{ref}'} référence, {'{lien}'} lien d&apos;avis (obligatoire).</p>
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className={ghostBtn}>Annuler</button>
          <button onClick={save} disabled={saving} className={primaryBtn}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
        </div>
      </div>
    </Modal>
  );
}
