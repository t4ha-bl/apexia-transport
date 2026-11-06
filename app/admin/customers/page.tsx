'use client';
import { useMemo, useState } from 'react';
import { setDocument } from '@/lib/firebaseUtils';
import { Customer } from '@/lib/customers';
import { formatMAD } from '@/lib/bookings';
import { PageHeader, Modal, useToast, inputClass, labelClass, primaryBtn, ghostBtn } from '@/components/admin/ui';
import ReservationForm from '@/components/admin/ReservationForm';
import { useAdminData } from '@/components/admin/useAdminData';
import { useAuth } from '@/lib/AuthContext';
import { fetchCollection } from '@/lib/firebaseUtils';
import { BillingDoc } from '@/lib/billing';
import { exportCustomer, eraseCustomer } from '@/lib/privacy';
import { Review } from '@/lib/reviewTemplates';
import { ConfirmDialog } from '@/components/admin/ui';
import { Reservation } from '@/lib/store/types';
import { MagnifyingGlass, Crown, WhatsappLogo, Plus, Phone } from '@phosphor-icons/react';

type Sort = 'recent' | 'spent' | 'count';

const STATUS_LABEL: Record<Reservation['status'], string> = { pending: 'En attente', confirmed: 'Confirmé', cancelled: 'Annulé' };
const fmtDay = (d?: string) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');

export default function AdminCustomers() {
  const toast = useToast();
  const { reservations, customers, services, vehicles, drivers, units, jobsByReservation, loading } = useAdminData(msg => toast('error', msg));
  const { can } = useAuth();
  const canEdit = can('customers.write');
  const canPrivacy = can('privacy');
  const [toErase, setToErase] = useState<Customer | null>(null);

  const doExport = async (c: Customer) => {
    try {
      const invoices = (await fetchCollection('documents')) as BillingDoc[];
      const reviews = (await fetchCollection('reviews')) as Review[];
      exportCustomer(c, invoices, reviews);
      toast('success', 'Fichier de données téléchargé.');
    } catch (err) { console.error(err); toast('error', "Échec de l'export."); }
  };

  const doErase = async () => {
    if (!toErase) return;
    const c = toErase; setToErase(null);
    try {
      const n = await eraseCustomer(c, jobsByReservation);
      setOpenKey(null);
      toast('success', `Données effacées (${n} réservation(s) anonymisée(s)).`);
    } catch (err) { console.error(err); toast('error', "Échec de l'effacement."); }
  };
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<Sort>('recent');
  const [vipOnly, setVipOnly] = useState(false);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [profile, setProfile] = useState({ vip: false, company: '', email: '', tags: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [newBookingFor, setNewBookingFor] = useState<Customer | null>(null);

  const serviceName = (id: string) => services.find(s => s.id === id)?.title || id;

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = customers.filter(c => {
      if (vipOnly && !c.profile?.vip) return false;
      if (!q) return true;
      return [c.name, c.phone, c.key, c.profile?.company, c.profile?.email, ...(c.profile?.tags || [])]
        .some(v => (v || '').toLowerCase().includes(q));
    });
    const activity = (c: Customer) => c.nextTrip || c.lastTrip || c.bookings[0]?.date || '';
    return list.sort((a, b) =>
      sort === 'spent' ? b.totalSpent - a.totalSpent
        : sort === 'count' ? b.activeCount - a.activeCount
          : activity(b).localeCompare(activity(a)));
  }, [customers, search, sort, vipOnly]);

  const open = visible.find(c => c.key === openKey) || customers.find(c => c.key === openKey) || null;

  const openCustomer = (c: Customer) => {
    setOpenKey(c.key);
    setProfile({
      vip: !!c.profile?.vip, company: c.profile?.company || '', email: c.profile?.email || '',
      tags: (c.profile?.tags || []).join(', '), notes: c.profile?.notes || '',
    });
  };

  const saveProfile = async () => {
    if (!open) return;
    if (profile.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim())) { toast('error', 'E-mail invalide.'); return; }
    setSaving(true);
    try {
      await setDocument('customers', open.key, {
        vip: profile.vip,
        company: profile.company.trim(),
        email: profile.email.trim(),
        tags: profile.tags.split(',').map(t => t.trim()).filter(Boolean).slice(0, 20),
        notes: profile.notes.trim(),
      });
      toast('success', 'Fiche client enregistrée.');
    } catch (err) { console.error(err); toast('error', "Échec de l'enregistrement."); }
    finally { setSaving(false); }
  };

  const vipCount = customers.filter(c => c.profile?.vip).length;
  const repeatCount = customers.filter(c => c.activeCount > 1).length;
  const segBtn = (active: boolean) => `px-4 py-2 font-sans text-[12px] border-r border-white/10 last:border-r-0 transition-colors ${active ? 'bg-ghost text-offblack font-medium' : 'text-muted hover:text-ghost hover:bg-white/5'}`;

  return (
    <div>
      <PageHeader eyebrow="Relation client" title="Clients" subtitle="Construit automatiquement à partir des réservations (regroupées par numéro de téléphone)." />

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[['Clients', customers.length], ['Clients fidèles (2+ réservations)', repeatCount], ['VIP', vipCount]].map(([label, value]) => (
          <div key={label as string} className="p-5 bg-ink border border-white/10 rounded-[2px]">
            <div className="font-sans text-[12px] text-muted">{label}</div>
            <div className="font-display text-[36px] leading-none mt-3 text-ghost">{value}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-[240px]">
          <MagnifyingGlass size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nom, téléphone, société, e-mail, tag…" className={`${inputClass} pl-11`} />
        </div>
        <div className="inline-flex border border-white/10 rounded-[2px] overflow-hidden">
          <button onClick={() => setSort('recent')} className={segBtn(sort === 'recent')}>Récents</button>
          <button onClick={() => setSort('spent')} className={segBtn(sort === 'spent')}>Chiffre d&apos;affaires</button>
          <button onClick={() => setSort('count')} className={segBtn(sort === 'count')}>Nb de courses</button>
        </div>
        <label className="flex items-center gap-2 font-sans text-[12px] text-muted cursor-pointer">
          <input type="checkbox" className="accent-white" checked={vipOnly} onChange={e => setVipOnly(e.target.checked)} /> VIP uniquement
        </label>
      </div>

      {loading ? (
        <div className="py-16 text-center font-sans text-[14px] text-muted">Chargement…</div>
      ) : visible.length === 0 ? (
        <div className="py-16 text-center bg-ink border border-white/10 rounded-[2px] font-sans text-[14px] text-muted">Aucun client trouvé.</div>
      ) : (
        <div className="bg-ink border border-white/10 rounded-[2px] divide-y divide-white/5">
          {visible.map(c => (
            <button key={c.key} onClick={() => openCustomer(c)} className="w-full text-left px-5 py-4 grid grid-cols-2 md:grid-cols-[2fr_1.3fr_0.8fr_1fr_1fr_1fr] gap-3 items-center hover:bg-white/[0.03] transition-colors">
              <div className="min-w-0 col-span-2 md:col-span-1">
                <div className="font-sans text-[14px] text-ghost flex items-center gap-2">
                  <span className="truncate">{c.name}</span>
                  {c.profile?.vip && <Crown size={15} weight="fill" className="text-amber-300 shrink-0" />}
                </div>
                {c.profile?.company && <div className="font-sans text-[12px] text-muted truncate">{c.profile.company}</div>}
              </div>
              <div className="font-sans text-[13px] text-muted truncate">{c.phone}</div>
              <div className="font-sans text-[13px] text-ghost">{c.activeCount} course{c.activeCount > 1 ? 's' : ''}</div>
              <div className="font-sans text-[13px] text-ghost">{c.totalSpent ? formatMAD(c.totalSpent) : '—'}</div>
              <div className="font-sans text-[12px] text-muted">Dernière : {fmtDay(c.lastTrip)}</div>
              <div className={`font-sans text-[12px] ${c.nextTrip ? 'text-green-400' : 'text-muted'}`}>Prochaine : {fmtDay(c.nextTrip)}</div>
            </button>
          ))}
        </div>
      )}

      {/* Customer sheet */}
      <Modal open={!!open} onClose={() => setOpenKey(null)} title={open ? open.name : ''} maxWidth="max-w-[820px]">
        {open && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1.5 font-sans text-[14px] text-ghost"><Phone size={15} /> {open.phone}</span>
              <span className="font-sans text-[13px] text-muted">· {open.activeCount} course(s) · {open.totalSpent ? formatMAD(open.totalSpent) : '0 MAD'} confirmés</span>
              <div className="flex gap-2 ml-auto">
                <a href={`https://wa.me/${open.key}`} target="_blank" rel="noreferrer" className={`${ghostBtn} !px-3 !py-2`}><WhatsappLogo size={15} /> WhatsApp</a>
                <button onClick={() => setNewBookingFor(open)} className={`${primaryBtn} !px-3 !py-2 ${canEdit ? '' : 'hidden'}`}><Plus size={14} weight="bold" /> Nouvelle réservation</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center gap-3 font-sans text-[14px] text-ghost cursor-pointer md:col-span-2">
                <input type="checkbox" className="w-4 h-4 accent-white" checked={profile.vip} onChange={e => setProfile({ ...profile, vip: e.target.checked })} />
                <Crown size={16} weight="fill" className="text-amber-300" /> Client VIP
              </label>
              <div><label className={labelClass}>Société</label><input className={inputClass} value={profile.company} onChange={e => setProfile({ ...profile, company: e.target.value })} /></div>
              <div><label className={labelClass}>E-mail</label><input className={inputClass} value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} /></div>
              <div className="md:col-span-2"><label className={labelClass}>Tags (séparés par des virgules)</label><input className={inputClass} placeholder="hôtel, corporate, anglophone" value={profile.tags} onChange={e => setProfile({ ...profile, tags: e.target.value })} /></div>
              <div className="md:col-span-2"><label className={labelClass}>Préférences & notes</label><textarea className={`${inputClass} h-24 resize-y`} placeholder="Eau gazeuse, siège enfant, toujours la Classe S…" value={profile.notes} onChange={e => setProfile({ ...profile, notes: e.target.value })} /></div>
            </div>
            <div className="flex justify-end">
              <button onClick={saveProfile} disabled={saving || !canEdit} className={`${primaryBtn} ${canEdit ? '' : 'hidden'}`}>{saving ? 'Enregistrement…' : 'Enregistrer la fiche'}</button>
            </div>

            <div>
              <h4 className="font-display text-[20px] text-ghost mb-3">Historique</h4>
              <div className="border border-white/10 rounded-[2px] divide-y divide-white/5">
                {open.bookings.map(r => (
                  <div key={r.id} className="px-4 py-3 grid grid-cols-2 md:grid-cols-[1fr_1fr_2fr_auto_auto] gap-2 items-center font-sans text-[13px]">
                    <span className="text-ghost">{r.ref || r.id}</span>
                    <span className="text-muted">{fmtDay(r.date)} {r.time}</span>
                    <span className="text-muted truncate">{serviceName(r.service)} · {r.pickup} → {r.destination}</span>
                    <span className="text-ghost">{typeof r.price === 'number' ? formatMAD(r.price) : '—'}</span>
                    <span className={r.status === 'confirmed' ? 'text-green-400' : r.status === 'cancelled' ? 'text-red-400' : 'text-ghost'}>{STATUS_LABEL[r.status]}</span>
                  </div>
                ))}
              </div>
            </div>

            {canPrivacy && (
              <div className="border-t border-white/10 pt-5">
                <h4 className="font-display text-[20px] text-ghost mb-1">Données personnelles</h4>
                <p className="font-sans text-[12px] text-muted mb-4">Droits d&apos;accès et d&apos;effacement (loi 09-08). Chaque action est enregistrée dans le journal.</p>
                <div className="flex flex-wrap gap-3">
                  <button onClick={() => doExport(open)} className={ghostBtn}>Exporter les données</button>
                  <button onClick={() => setToErase(open)} className="inline-flex items-center gap-2 border border-red-500/30 text-red-400 font-sans text-[12px] px-5 py-2.5 rounded-[2px] hover:bg-red-500/10">Effacer les données</button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!toErase}
        title="Effacer les données du client"
        confirmLabel="Effacer définitivement"
        message={`Le nom, le téléphone, les adresses, messages et notes de ${toErase?.name || ''} seront effacés de ses ${toErase?.bookings.length || 0} réservation(s), et sa fiche client supprimée. Les dates, services et montants restent (anonymes) pour vos statistiques. Les factures déjà émises sont conservées, comme l'exige la loi comptable. Action irréversible.`}
        onConfirm={doErase}
        onCancel={() => setToErase(null)}
      />

      <ReservationForm
        open={!!newBookingFor}
        reservation={null}
        prefill={newBookingFor ? { fullName: newBookingFor.name, phone: newBookingFor.phone } : undefined}
        services={services}
        vehicles={vehicles}
        drivers={drivers}
        units={units}
        allReservations={reservations}
        onClose={() => setNewBookingFor(null)}
      />
    </div>
  );
}
