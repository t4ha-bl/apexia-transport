'use client';
import { useState, useMemo } from 'react';
import { updateDocument, removeDocument } from '@/lib/firebaseUtils';
import { Reservation } from '@/lib/store/types';
import { PageHeader, ConfirmDialog, useToast, inputClass, primaryBtn } from '@/components/admin/ui';
import ReservationForm from '@/components/admin/ReservationForm';
import { useAdminData } from '@/components/admin/useAdminData';
import { useAuth } from '@/lib/AuthContext';
import { bookingDuration, formatMAD, sourceLabel } from '@/lib/bookings';
import {
  CheckCircle, XCircle, Clock, Copy, WhatsappLogo, Trash, MagnifyingGlass,
  CalendarBlank, MapPin, Car, Briefcase, ChatText, User, ArrowRight, House, Phone,
  Plus, PencilSimple, Users, Suitcase, AirplaneTilt, NotePencil, SteeringWheel, IdentificationCard, Crown, LinkSimple, FileText, Receipt, EnvelopeSimple, Star
} from '@phosphor-icons/react';
import Link from 'next/link';
import { unitName } from '@/lib/fleet';
import { phoneKey } from '@/lib/customers';
import { driverStatusLabel } from '@/lib/jobs';
import JobLinkDialog from '@/components/admin/JobLinkDialog';

type Status = Reservation['status'];
type Filter = 'all' | Status;

const STATUS: Record<Status, { label: string; icon: typeof Clock; badge: string }> = {
  pending:   { label: 'En attente', icon: Clock,       badge: 'bg-white/10 text-ghost border-white/20' },
  confirmed: { label: 'Confirmé',   icon: CheckCircle, badge: 'bg-green-500/10 text-green-400 border-green-500/25' },
  cancelled: { label: 'Annulé',     icon: XCircle,     badge: 'bg-red-500/10 text-red-400 border-red-500/25' },
};

const prettify = (slug?: string) =>
  (slug || '—').replace(/[-_]+/g, ' ').replace(/^\w/, c => c.toUpperCase());

const formatDate = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso.length <= 10 ? iso + 'T00:00:00' : iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
};

const formatCreated = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('fr-FR') + ' à ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
};

// International digits of the customer's phone (handles old numbers typed without a code)
const whatsappNumber = phoneKey;

const whatsappLink = (r: Reservation, serviceName: string, extra: { driver?: string; vehicle?: string } = {}) => {
  const ref = r.ref || r.id;
  const when = `${formatDate(r.date)} à ${r.time}`;
  // Extra confirmation details, only when they are known
  const details = [
    typeof r.price === 'number' ? `Tarif : ${formatMAD(r.price)}` : '',
    extra.driver ? `Chauffeur : ${extra.driver}` : '',
    extra.vehicle ? `Véhicule : ${extra.vehicle}` : '',
  ].filter(Boolean).join('\n');
  const text =
    r.status === 'confirmed'
      ? `Bonjour ${r.fullName}, votre réservation ${ref} (${serviceName}) du ${when} est confirmée.${details ? `\n${details}` : ''}\nÀ très bientôt, Apexia Transport.`
      : r.status === 'cancelled'
      ? `Bonjour ${r.fullName}, votre réservation ${ref} du ${when} a été annulée. N'hésitez pas à nous contacter pour toute question. Apexia Transport.`
      : `Bonjour ${r.fullName}, nous avons bien reçu votre demande de réservation ${ref} (${serviceName}) pour le ${when}. Nous revenons vers vous très vite. Apexia Transport.`;
  return `https://wa.me/${whatsappNumber(r.phone)}?text=${encodeURIComponent(text)}`;
};

function Info({ icon: Icon, label, children }: { icon: typeof User; label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2 font-sans text-[12px] text-muted mb-2">
        <Icon size={14} /> {label}
      </div>
      <div className="font-sans text-[14px] text-ghost space-y-1">{children}</div>
    </div>
  );
}

export default function AdminReservations() {
  const toast = useToast();
  // Live data (new bookings from the website show up without refreshing)
  const { reservations, services, vehicles, drivers, units, customers, jobsByReservation, loading } = useAdminData(msg => toast('error', msg));
  const [jobFor, setJobFor] = useState<Reservation | null>(null);
  // What this person's role may do here (the security rules enforce the same)
  const { can } = useAuth();
  const canWrite = can('reservations.write');
  const canDelete = can('reservations.delete');
  const canBill = can('billing');
  const customerOf = useMemo(() => new Map(customers.map(c => [c.key, c])), [customers]);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [toDelete, setToDelete] = useState<Reservation | null>(null);
  // Booking form: open with a reservation to edit it, or with null for a new manual booking
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Reservation | null>(null);
  const openForm = (r: Reservation | null) => { setEditing(r); setFormOpen(true); };

  const driverName = (id?: string | null) => (id ? drivers.find(d => d.id === id)?.name || 'Chauffeur supprimé' : '');
  const unitLabel = (id?: string | null) => { if (!id) return ''; const u = units.find(x => x.id === id); return u ? unitName(u) : 'Véhicule supprimé'; };

  const serviceName = (id: string) => services.find(s => s.id === id)?.title || prettify(id);
  const vehicleName = (id: string) => vehicles.find(v => v.id === id)?.name || prettify(id);

  const counts = useMemo(() => ({
    all: reservations.length,
    pending: reservations.filter(r => r.status === 'pending').length,
    confirmed: reservations.filter(r => r.status === 'confirmed').length,
    cancelled: reservations.filter(r => r.status === 'cancelled').length,
  }), [reservations]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reservations.filter(r => {
      if (filter !== 'all' && r.status !== filter) return false;
      if (!q) return true;
      return [r.fullName, r.phone, r.email, r.ref, r.pickup, r.destination, r.address, r.message, r.notes, r.flightNumber, r.signName, serviceName(r.service), vehicleName(r.vehicle)]
        .some(v => (v || '').toLowerCase().includes(q));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservations, filter, search, services, vehicles]);

  const handleUpdateStatus = async (r: Reservation, status: Status) => {
    if (r.status === status) return;
    try {
      await updateDocument('reservations', r.id, { status }, r.ref);
      toast('success', `Statut mis à jour : ${STATUS[status].label}`);
    } catch (err) {
      console.error('Failed to update', err);
      toast('error', 'Échec de la mise à jour du statut.');
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    const r = toDelete;
    setToDelete(null);
    try {
      await removeDocument('reservations', r.id, r.ref);
      toast('success', 'Réservation supprimée.');
    } catch (err) {
      console.error('Failed to delete', err);
      toast('error', 'Échec de la suppression.');
    }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast('success', 'Copié dans le presse-papiers.'));
  };

  const tiles: { key: Filter; label: string; value: number; tone: string }[] = [
    { key: 'all',       label: 'Total',      value: counts.all,       tone: 'text-ghost' },
    { key: 'pending',   label: 'En attente', value: counts.pending,   tone: 'text-ghost' },
    { key: 'confirmed', label: 'Confirmées', value: counts.confirmed, tone: 'text-green-400' },
    { key: 'cancelled', label: 'Annulées',   value: counts.cancelled, tone: 'text-red-400' },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Tableau de bord"
        title="Réservations"
        subtitle="Demandes du site et réservations saisies par l'équipe, mises à jour en direct."
        action={canWrite ? (
          <button onClick={() => openForm(null)} className={primaryBtn}>
            <Plus size={14} weight="bold" /> Nouvelle réservation
          </button>
        ) : undefined}
      />

      {/* Summary tiles (also act as filters) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {tiles.map(t => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`text-left p-5 bg-ink border rounded-[2px] transition-colors ${filter === t.key ? 'border-white/40' : 'border-white/10 hover:border-white/25'}`}
          >
            <div className="font-sans text-[12px] text-muted">{t.label}</div>
            <div className={`font-display text-[40px] leading-none mt-3 ${t.tone}`}>{t.value}</div>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <MagnifyingGlass size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un client, téléphone, référence, trajet…"
          className={`${inputClass} pl-11`}
        />
      </div>

      {loading ? (
        <div className="py-16 text-center font-sans text-[14px] text-muted">Chargement des réservations…</div>
      ) : visible.length === 0 ? (
        <div className="py-16 text-center bg-ink border border-white/10 rounded-[2px] font-sans text-[14px] text-muted">
          {reservations.length === 0 ? 'Aucune réservation pour le moment.' : 'Aucune réservation ne correspond à votre recherche.'}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {visible.map(r => {
            const st = STATUS[r.status] || STATUS.pending;
            const StIcon = st.icon;
            return (
              <article key={r.id} className="bg-ink border border-white/10 rounded-[2px] hover:border-white/20 transition-colors">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-white/10">
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="font-display text-[24px] text-ghost leading-none">{r.ref || r.id}</span>
                    {r.status === 'pending' && (
                      <span className="font-sans text-[12px] text-ghost border border-white/30 px-2 py-0.5 rounded-[2px]">Nouveau</span>
                    )}
                    <span className="font-sans text-[12px] text-muted">Reçu le {formatCreated(r.createdAt)}</span>
                    <span className="font-sans text-[12px] border border-white/15 text-muted px-2 py-0.5 rounded-[2px]">{sourceLabel(r.source)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {typeof r.price === 'number' && (
                      <span className="font-display text-[22px] text-ghost leading-none">{formatMAD(r.price)}</span>
                    )}
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[12px] ${st.badge}`}>
                      <StIcon weight="fill" size={14} /> {st.label}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-x-8 gap-y-6 px-6 py-6">
                  <Info icon={User} label="Client">
                    <div className="font-medium flex items-center gap-2 flex-wrap">
                      {r.fullName}
                      {(() => {
                        const c = customerOf.get(phoneKey(r.phone));
                        if (c?.profile?.vip) return <span className="inline-flex items-center gap-1 font-sans text-[12px] text-amber-300 border border-amber-300/40 px-1.5 py-0.5 rounded-[2px]"><Crown size={11} weight="fill" /> VIP</span>;
                        if (c && c.activeCount > 1) return <span className="font-sans text-[12px] text-muted border border-white/15 px-1.5 py-0.5 rounded-[2px]">Client fidèle · {c.activeCount}</span>;
                        return null;
                      })()}
                    </div>
                    <div className="flex items-center gap-2 text-muted">
                      <Phone size={14} />
                      <span className="text-ghost">{r.phone}</span>
                      <button onClick={() => copy(r.phone)} className="text-muted hover:text-ghost transition-colors" title="Copier le numéro">
                        <Copy size={15} />
                      </button>
                    </div>
                    {r.email && (
                      <div className="flex items-center gap-2 text-muted min-w-0"><EnvelopeSimple size={14} className="shrink-0" /><a href={`mailto:${r.email}`} className="text-ghost hover:underline truncate">{r.email}</a></div>
                    )}
                    {r.address && (
                      <div className="flex items-start gap-2 text-muted"><House size={14} className="mt-1 shrink-0" /><span>{r.address}</span></div>
                    )}
                    {r.reviewRequestedAt && (
                      <div className="flex items-center gap-2 text-muted text-[12px]"><Star size={13} /> Avis demandé le {new Date(r.reviewRequestedAt).toLocaleDateString('fr-FR')}</div>
                    )}
                  </Info>

                  <Info icon={Briefcase} label="Prestation">
                    <div className="font-medium">{serviceName(r.service)}</div>
                    <div className="flex items-center gap-2 text-muted"><Car size={14} /> {vehicleName(r.vehicle)}</div>
                    {(r.passengers || r.luggage != null) && (
                      <div className="flex items-center gap-4 text-muted">
                        {!!r.passengers && <span className="flex items-center gap-1.5"><Users size={14} /> {r.passengers}</span>}
                        {r.luggage != null && <span className="flex items-center gap-1.5"><Suitcase size={14} /> {r.luggage}</span>}
                      </div>
                    )}
                    {(r.driverId || r.fleetUnitId) ? (
                      <div className="pt-1 text-[13px]">
                        {r.driverId && <div className="flex items-center gap-1.5"><SteeringWheel size={14} className="text-muted" /> {driverName(r.driverId)}</div>}
                        {r.fleetUnitId && <div className="flex items-center gap-1.5 text-muted"><IdentificationCard size={14} /> {unitLabel(r.fleetUnitId)}</div>}
                      </div>
                    ) : r.status === 'confirmed' && (
                      <div className="pt-1 text-[12px] text-amber-300">⚠ Chauffeur non assigné</div>
                    )}
                    {jobsByReservation.get(r.id) && (
                      <div className="pt-1 text-[12px] text-green-400 flex items-center gap-1.5">
                        <LinkSimple size={13} /> {driverStatusLabel(jobsByReservation.get(r.id)!.driverStatus)}
                        <span className="text-muted">· {new Date(jobsByReservation.get(r.id)!.driverStatusAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    )}
                  </Info>

                  <Info icon={CalendarBlank} label="Date & heure">
                    <div className="font-medium capitalize-first">{formatDate(r.date)}</div>
                    <div className="text-muted">à {r.time} · ~{Math.round(bookingDuration(r) / 6) / 10} h</div>
                    {r.flightNumber && <div className="flex items-center gap-1.5 text-muted"><AirplaneTilt size={14} /> Vol <span className="text-ghost">{r.flightNumber}</span></div>}
                    {r.signName && <div className="text-muted">Pancarte : <span className="text-ghost">{r.signName}</span></div>}
                  </Info>

                  <Info icon={MapPin} label="Trajet">
                    <div><span className="text-muted">Départ · </span>{r.pickup}</div>
                    <div className="flex items-center gap-1 text-muted"><ArrowRight size={12} /></div>
                    <div><span className="text-muted">Arrivée · </span>{r.destination}</div>
                  </Info>
                </div>

                {r.message && (
                  <div className="mx-6 mb-6 p-4 bg-offblack border border-white/10 rounded-[2px]">
                    <div className="flex items-center gap-2 font-sans text-[12px] text-muted mb-2">
                      <ChatText size={14} /> Message du client
                    </div>
                    <p className="font-sans text-[14px] text-ghost whitespace-pre-wrap">{r.message}</p>
                  </div>
                )}

                {r.notes && (
                  <div className="mx-6 mb-6 p-4 bg-amber-500/[0.06] border border-amber-400/20 rounded-[2px]">
                    <div className="flex items-center gap-2 font-sans text-[12px] text-amber-300/80 mb-2">
                      <NotePencil size={14} /> Notes internes
                    </div>
                    <p className="font-sans text-[14px] text-ghost whitespace-pre-wrap">{r.notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-white/10">
                  <div className={`inline-flex border border-white/10 rounded-[2px] overflow-hidden ${canWrite ? '' : 'pointer-events-none opacity-70'}`}>
                    {(['pending', 'confirmed', 'cancelled'] as Status[]).map(s => (
                      <button
                        key={s}
                        disabled={!canWrite}
                        onClick={() => handleUpdateStatus(r, s)}
                        className={`px-4 py-2 font-sans text-[12px] transition-colors border-r border-white/10 last:border-r-0 ${
                          r.status === s ? 'bg-ghost text-offblack font-medium' : 'text-muted hover:text-ghost hover:bg-white/5'
                        }`}
                      >
                        {STATUS[s].label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {canWrite && (
                      <button
                        onClick={() => openForm(r)}
                        className="inline-flex items-center gap-2 border border-white/15 text-ghost font-sans text-[12px] px-4 py-2 rounded-[2px] hover:border-white/50 transition-colors"
                      >
                        <PencilSimple size={16} /> Modifier
                      </button>
                    )}
                    {r.status !== 'cancelled' && canBill && (
                      <>
                        <Link href={`/admin/documents?from=${r.id}&type=quote`} className="inline-flex items-center gap-2 border border-white/15 text-ghost font-sans text-[12px] px-4 py-2 rounded-[2px] hover:border-white/50 transition-colors">
                          <FileText size={16} /> Devis
                        </Link>
                        <Link href={`/admin/documents?from=${r.id}&type=invoice`} className="inline-flex items-center gap-2 border border-white/15 text-ghost font-sans text-[12px] px-4 py-2 rounded-[2px] hover:border-white/50 transition-colors">
                          <Receipt size={16} /> Facturer
                        </Link>
                      </>
                    )}
                    {r.status !== 'cancelled' && canWrite && (
                      <button
                        onClick={() => setJobFor(r)}
                        className="inline-flex items-center gap-2 border border-white/15 text-ghost font-sans text-[12px] px-4 py-2 rounded-[2px] hover:border-white/50 transition-colors"
                      >
                        <LinkSimple size={16} /> Lien chauffeur
                      </button>
                    )}
                    <a
                      href={whatsappLink(r, serviceName(r.service), {
                        driver: r.driverId ? driverName(r.driverId) : undefined,
                        vehicle: r.fleetUnitId ? `${vehicleName(r.vehicle)} (${units.find(u => u.id === r.fleetUnitId)?.plate || ''})` : undefined,
                      })}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 border border-white/15 text-ghost font-sans text-[12px] px-4 py-2 rounded-[2px] hover:border-white/50 transition-colors"
                    >
                      <WhatsappLogo size={16} /> Contacter
                    </a>
                    {canDelete && (
                      <button
                        onClick={() => setToDelete(r)}
                        className="inline-flex items-center gap-2 border border-red-500/25 text-red-400 font-sans text-[12px] px-4 py-2 rounded-[2px] hover:bg-red-500/10 transition-colors"
                      >
                        <Trash size={16} /> Supprimer
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <ReservationForm
        open={formOpen}
        reservation={editing}
        services={services}
        vehicles={vehicles}
        drivers={drivers}
        units={units}
        allReservations={reservations}
        onClose={() => setFormOpen(false)}
      />

      <JobLinkDialog
        reservation={jobFor ? reservations.find(r => r.id === jobFor.id) || jobFor : null}
        job={jobFor ? jobsByReservation.get(jobFor.id) : undefined}
        services={services}
        vehicles={vehicles}
        drivers={drivers}
        units={units}
        onClose={() => setJobFor(null)}
      />

      <ConfirmDialog
        open={!!toDelete}
        title="Supprimer la réservation"
        message={`Supprimer définitivement la réservation ${toDelete?.ref || ''} de ${toDelete?.fullName || ''} ? Cette action est irréversible.`}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
