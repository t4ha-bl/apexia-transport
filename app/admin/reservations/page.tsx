'use client';
import { useState, useEffect, useMemo } from 'react';
import { subscribeReservations, fetchCollection, updateDocument, removeDocument } from '@/lib/firebaseUtils';
import { Reservation, Service, Vehicle } from '@/lib/store/types';
import { PageHeader, ConfirmDialog, useToast, inputClass } from '@/components/admin/ui';
import {
  CheckCircle, XCircle, Clock, Copy, WhatsappLogo, Trash, MagnifyingGlass,
  CalendarBlank, MapPin, Car, Briefcase, ChatText, User, ArrowRight, House, Phone
} from '@phosphor-icons/react';

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

// New bookings store the full international number ("+33 612345678").
// Older ones were typed without a country code and are assumed Moroccan ("6 12 34 56 78" or "06…").
const whatsappNumber = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  if (phone.trim().startsWith('+')) return digits;
  if (digits.startsWith('00')) return digits.slice(2);
  if (digits.startsWith('0')) return '212' + digits.slice(1);
  if (digits.length === 9) return '212' + digits;
  return digits;
};

const whatsappLink = (r: Reservation, serviceName: string) => {
  const ref = r.ref || r.id;
  const when = `${formatDate(r.date)} à ${r.time}`;
  const text =
    r.status === 'confirmed'
      ? `Bonjour ${r.fullName}, votre réservation ${ref} (${serviceName}) du ${when} est confirmée. À très bientôt, Apexia Transport.`
      : r.status === 'cancelled'
      ? `Bonjour ${r.fullName}, votre réservation ${ref} du ${when} a été annulée. N'hésitez pas à nous contacter pour toute question. Apexia Transport.`
      : `Bonjour ${r.fullName}, nous avons bien reçu votre demande de réservation ${ref} (${serviceName}) pour le ${when}. Nous revenons vers vous très vite. Apexia Transport.`;
  return `https://wa.me/${whatsappNumber(r.phone)}?text=${encodeURIComponent(text)}`;
};

function Info({ icon: Icon, label, children }: { icon: typeof User; label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2 font-sans text-[10px] text-muted tracking-[0.2em] uppercase mb-2">
        <Icon size={14} /> {label}
      </div>
      <div className="font-sans text-[14px] text-ghost space-y-1">{children}</div>
    </div>
  );
}

export default function AdminReservations() {
  const toast = useToast();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [toDelete, setToDelete] = useState<Reservation | null>(null);

  // Live feed: new bookings from the website show up without refreshing
  useEffect(() => {
    const unsub = subscribeReservations(
      rows => { setReservations(rows as Reservation[]); setLoading(false); },
      err => { console.error(err); setLoading(false); toast('error', 'Impossible de charger les réservations.'); }
    );
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Names for the service / vehicle ids stored on each reservation
  useEffect(() => {
    Promise.all([fetchCollection('services'), fetchCollection('vehicles')])
      .then(([s, v]) => { setServices(s as Service[]); setVehicles(v as Vehicle[]); })
      .catch(console.error);
  }, []);

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
      return [r.fullName, r.phone, r.ref, r.pickup, r.destination, r.address, r.message, serviceName(r.service), vehicleName(r.vehicle)]
        .some(v => (v || '').toLowerCase().includes(q));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservations, filter, search, services, vehicles]);

  const handleUpdateStatus = async (r: Reservation, status: Status) => {
    if (r.status === status) return;
    try {
      await updateDocument('reservations', r.id, { status });
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
      await removeDocument('reservations', r.id);
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
        subtitle="Toutes les demandes envoyées depuis le formulaire du site, mises à jour en direct."
      />

      {/* Summary tiles (also act as filters) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {tiles.map(t => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`text-left p-5 bg-ink border rounded-[2px] transition-colors ${filter === t.key ? 'border-white/40' : 'border-white/10 hover:border-white/25'}`}
          >
            <div className="font-sans text-[10px] text-muted tracking-[0.2em] uppercase">{t.label}</div>
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
                      <span className="font-sans text-[10px] tracking-[0.2em] uppercase bg-ghost text-offblack px-2 py-1 rounded-[2px]">Nouveau</span>
                    )}
                    <span className="font-sans text-[12px] text-muted">Reçu le {formatCreated(r.createdAt)}</span>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] uppercase tracking-wide ${st.badge}`}>
                    <StIcon weight="fill" size={14} /> {st.label}
                  </span>
                </div>

                {/* Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-x-8 gap-y-6 px-6 py-6">
                  <Info icon={User} label="Client">
                    <div className="font-medium">{r.fullName}</div>
                    <div className="flex items-center gap-2 text-muted">
                      <Phone size={14} />
                      <span className="text-ghost">{r.phone}</span>
                      <button onClick={() => copy(r.phone)} className="text-muted hover:text-ghost transition-colors" title="Copier le numéro">
                        <Copy size={15} />
                      </button>
                    </div>
                    {r.address && (
                      <div className="flex items-start gap-2 text-muted"><House size={14} className="mt-1 shrink-0" /><span>{r.address}</span></div>
                    )}
                  </Info>

                  <Info icon={Briefcase} label="Prestation">
                    <div className="font-medium">{serviceName(r.service)}</div>
                    <div className="flex items-center gap-2 text-muted"><Car size={14} /> {vehicleName(r.vehicle)}</div>
                  </Info>

                  <Info icon={CalendarBlank} label="Date & heure">
                    <div className="font-medium capitalize">{formatDate(r.date)}</div>
                    <div className="text-muted">à {r.time}</div>
                  </Info>

                  <Info icon={MapPin} label="Trajet">
                    <div><span className="text-muted">Départ · </span>{r.pickup}</div>
                    <div className="flex items-center gap-1 text-muted"><ArrowRight size={12} /></div>
                    <div><span className="text-muted">Arrivée · </span>{r.destination}</div>
                  </Info>
                </div>

                {r.message && (
                  <div className="mx-6 mb-6 p-4 bg-offblack border border-white/10 rounded-[2px]">
                    <div className="flex items-center gap-2 font-sans text-[10px] text-muted tracking-[0.2em] uppercase mb-2">
                      <ChatText size={14} /> Message du client
                    </div>
                    <p className="font-sans text-[14px] text-ghost whitespace-pre-wrap">{r.message}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-white/10">
                  <div className="inline-flex border border-white/10 rounded-[2px] overflow-hidden">
                    {(['pending', 'confirmed', 'cancelled'] as Status[]).map(s => (
                      <button
                        key={s}
                        onClick={() => handleUpdateStatus(r, s)}
                        className={`px-4 py-2 font-sans text-[12px] transition-colors border-r border-white/10 last:border-r-0 ${
                          r.status === s ? 'bg-ghost text-offblack font-medium' : 'text-muted hover:text-ghost hover:bg-white/5'
                        }`}
                      >
                        {STATUS[s].label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={whatsappLink(r, serviceName(r.service))}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 border border-white/15 text-ghost font-sans text-[12px] px-4 py-2 rounded-[2px] hover:border-white/50 transition-colors"
                    >
                      <WhatsappLogo size={16} /> Contacter
                    </a>
                    <button
                      onClick={() => setToDelete(r)}
                      className="inline-flex items-center gap-2 border border-red-500/25 text-red-400 font-sans text-[12px] px-4 py-2 rounded-[2px] hover:bg-red-500/10 transition-colors"
                    >
                      <Trash size={16} /> Supprimer
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

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
