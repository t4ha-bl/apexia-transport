'use client';
import { useEffect, useState } from 'react';
import { addDocument, updateDocument } from '@/lib/firebaseUtils';
import { Reservation, Service, Vehicle } from '@/lib/store/types';
import { BOOKING_SOURCES, bookingDuration, findConflicts, newBookingRef } from '@/lib/bookings';
import { Driver, FleetUnit, unitName } from '@/lib/fleet';
import { syncJob } from '@/lib/jobs';
import { isValidEmail } from '@/lib/reviewTemplates';
import { Modal, useToast, inputClass, labelClass, primaryBtn, ghostBtn } from './ui';

type Status = Reservation['status'];

// Form state keeps everything as strings; it is converted on save
interface FormState {
  fullName: string; phone: string; email: string; address: string;
  service: string; vehicle: string; date: string; time: string; durationMin: string;
  pickup: string; destination: string; flightNumber: string; signName: string;
  passengers: string; luggage: string; message: string;
  status: Status; source: NonNullable<Reservation['source']>; price: string; notes: string;
  driverId: string; fleetUnitId: string;
}

const toForm = (r: Partial<Reservation> | null, isNew: boolean): FormState => ({
  fullName: r?.fullName || '', phone: r?.phone || '', email: r?.email || '', address: r?.address || '',
  service: r?.service || '', vehicle: r?.vehicle || '', date: r?.date || '', time: r?.time || '',
  durationMin: r?.durationMin ? String(r.durationMin) : '',
  pickup: r?.pickup || '', destination: r?.destination || '',
  flightNumber: r?.flightNumber || '', signName: r?.signName || '',
  passengers: r?.passengers ? String(r.passengers) : '', luggage: r?.luggage != null ? String(r.luggage) : '',
  message: r?.message || '',
  status: r?.status || 'confirmed', source: r?.source || (isNew ? 'phone' : 'website'),
  price: r?.price != null ? String(r.price) : '', notes: r?.notes || '',
  driverId: r?.driverId || '', fleetUnitId: r?.fleetUnitId || '',
});

const intOrNull = (s: string) => (s.trim() === '' ? null : Math.max(0, Math.round(Number(s))));

export default function ReservationForm({ open, reservation, prefill, services, vehicles, drivers, units, allReservations, onClose }: {
  open: boolean;
  reservation: Reservation | null; // null = new manual booking
  prefill?: Partial<Reservation>;  // starting values for a new booking (e.g. from a customer sheet)
  services: Service[];
  vehicles: Vehicle[];
  drivers: Driver[];
  units: FleetUnit[];
  allReservations: Reservation[];  // for double-booking warnings
  onClose: () => void;
}) {
  const toast = useToast();
  const [f, setF] = useState<FormState>(toForm(reservation || prefill || null, !reservation));
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (open) { setF(toForm(reservation || prefill || null, !reservation)); setErrors({}); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, reservation]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF(prev => ({ ...prev, [k]: v }));

  const save = async () => {
    const errs: Record<string, boolean> = {};
    (['fullName', 'phone', 'service', 'vehicle', 'date', 'time', 'pickup', 'destination'] as const)
      .forEach(k => { if (!f[k].trim()) errs[k] = true; });
    if (f.price.trim() && (isNaN(Number(f.price)) || Number(f.price) < 0)) errs.price = true;
    if (f.email.trim() && !isValidEmail(f.email.trim())) errs.email = true;
    setErrors(errs);
    if (Object.keys(errs).length) { toast('error', 'Complétez les champs obligatoires.'); return; }

    const payload = {
      fullName: f.fullName.trim(), phone: f.phone.trim(), email: f.email.trim().toLowerCase(), address: f.address.trim(),
      service: f.service, vehicle: f.vehicle, date: f.date, time: f.time,
      durationMin: intOrNull(f.durationMin),
      pickup: f.pickup.trim(), destination: f.destination.trim(),
      flightNumber: f.flightNumber.trim().toUpperCase(), signName: f.signName.trim(),
      passengers: intOrNull(f.passengers), luggage: intOrNull(f.luggage),
      message: f.message.trim(),
      status: f.status, source: f.source,
      price: f.price.trim() === '' ? null : Number(f.price),
      notes: f.notes.trim(),
      driverId: f.driverId || null,
      fleetUnitId: f.fleetUnitId || null,
    };

    setSaving(true);
    try {
      if (reservation) {
        await updateDocument('reservations', reservation.id, payload);
        // Keep the driver's link in sync with the edited booking
        if (reservation.jobToken) {
          await syncJob({ ...reservation, ...payload } as Reservation, reservation.jobToken, { services, vehicles, drivers, units }, false)
            .catch(err => console.error('Driver link refresh failed', err));
        }
        toast('success', 'Réservation mise à jour.');
      } else {
        await addDocument('reservations', { ...payload, ref: newBookingRef() });
        toast('success', 'Réservation ajoutée.');
      }
      onClose();
    } catch (err) {
      console.error(err);
      toast('error', "Échec de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const field = (k: keyof FormState) => `${inputClass} ${errors[k] ? '!border-red-400/70' : ''}`;
  const estDuration = bookingDuration({ service: f.service, durationMin: intOrNull(f.durationMin) });

  // Double-booking warnings for the chosen driver / vehicle
  const timing = { id: reservation?.id, date: f.date, time: f.time, service: f.service, durationMin: intOrNull(f.durationMin) };
  const driverClash = f.status === 'cancelled' ? [] : findConflicts(timing, 'driverId', f.driverId, allReservations);
  const unitClash = f.status === 'cancelled' ? [] : findConflicts(timing, 'fleetUnitId', f.fleetUnitId, allReservations);
  const clashText = (list: Reservation[]) => list.map(r => `${r.ref || r.id} (${r.time})`).join(', ');
  const activeDrivers = drivers.filter(d => d.active !== false || d.id === f.driverId);
  // Suggest units of the requested model first
  const activeUnits = units.filter(u => u.active !== false || u.id === f.fleetUnitId)
    .sort((a, b) => Number(b.modelId === f.vehicle) - Number(a.modelId === f.vehicle));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={reservation ? `Modifier ${reservation.ref || ''}` : 'Nouvelle réservation'}
      maxWidth="max-w-[860px]"
    >
      <div className="flex flex-col gap-8">
        {/* Client */}
        <section>
          <h4 className="font-display text-[20px] text-ghost mb-4">Client</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className={labelClass}>Nom complet *</label><input className={field('fullName')} value={f.fullName} onChange={e => set('fullName', e.target.value)} /></div>
            <div><label className={labelClass}>Téléphone (avec indicatif) *</label><input className={field('phone')} placeholder="+212 6..." value={f.phone} onChange={e => set('phone', e.target.value)} /></div>
            <div><label className={labelClass}>E-mail</label><input type="email" className={field('email')} placeholder="Pour la demande d'avis" value={f.email} onChange={e => set('email', e.target.value)} /></div>
            <div><label className={labelClass}>Adresse / hôtel</label><input className={field('address')} value={f.address} onChange={e => set('address', e.target.value)} /></div>
          </div>
        </section>

        {/* Trip */}
        <section>
          <h4 className="font-display text-[20px] text-ghost mb-4">Trajet</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Service *</label>
              <select className={field('service')} value={f.service} onChange={e => set('service', e.target.value)}>
                <option value="">Choisir…</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                {f.service && !services.some(s => s.id === f.service) && <option value={f.service}>{f.service}</option>}
              </select>
            </div>
            <div>
              <label className={labelClass}>Véhicule demandé *</label>
              <select className={field('vehicle')} value={f.vehicle} onChange={e => set('vehicle', e.target.value)}>
                <option value="">Choisir…</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                {f.vehicle && !vehicles.some(v => v.id === f.vehicle) && <option value={f.vehicle}>{f.vehicle}</option>}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            <div><label className={labelClass}>Date *</label><input type="date" className={field('date')} value={f.date} onChange={e => set('date', e.target.value)} /></div>
            <div><label className={labelClass}>Heure *</label><input type="time" className={field('time')} value={f.time} onChange={e => set('time', e.target.value)} /></div>
            <div className="col-span-2 md:col-span-1">
              <label className={labelClass}>Durée (min)</label>
              <input type="number" min={0} className={field('durationMin')} placeholder={`Auto : ${estDuration}`} value={f.durationMin} onChange={e => set('durationMin', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div><label className={labelClass}>Départ *</label><input className={field('pickup')} value={f.pickup} onChange={e => set('pickup', e.target.value)} /></div>
            <div><label className={labelClass}>Arrivée *</label><input className={field('destination')} value={f.destination} onChange={e => set('destination', e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div><label className={labelClass}>Passagers</label><input type="number" min={1} className={field('passengers')} value={f.passengers} onChange={e => set('passengers', e.target.value)} /></div>
            <div><label className={labelClass}>Bagages</label><input type="number" min={0} className={field('luggage')} value={f.luggage} onChange={e => set('luggage', e.target.value)} /></div>
            <div><label className={labelClass}>N° de vol</label><input className={`${field('flightNumber')}`} value={f.flightNumber} onChange={e => set('flightNumber', e.target.value)} /></div>
            <div><label className={labelClass}>Nom sur pancarte</label><input className={field('signName')} placeholder={f.fullName} value={f.signName} onChange={e => set('signName', e.target.value)} /></div>
          </div>
          <div className="mt-4">
            <label className={labelClass}>Message du client</label>
            <textarea className={`${field('message')} h-20 resize-y`} value={f.message} onChange={e => set('message', e.target.value)} />
          </div>
        </section>

        {/* Management */}
        <section>
          <h4 className="font-display text-[20px] text-ghost mb-4">Gestion <span className="font-sans text-[12px] text-muted ml-2">visible par l&apos;équipe uniquement</span></h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Statut</label>
              <select className={field('status')} value={f.status} onChange={e => set('status', e.target.value as Status)}>
                <option value="pending">En attente</option>
                <option value="confirmed">Confirmé</option>
                <option value="cancelled">Annulé</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Source</label>
              <select className={field('source')} value={f.source} onChange={e => set('source', e.target.value as FormState['source'])}>
                {BOOKING_SOURCES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Prix convenu (MAD)</label>
              <input type="number" min={0} step="1" className={field('price')} value={f.price} onChange={e => set('price', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className={labelClass}>Chauffeur assigné</label>
              <select className={field('driverId')} value={f.driverId} onChange={e => set('driverId', e.target.value)}>
                <option value="">Non assigné</option>
                {activeDrivers.map(d => <option key={d.id} value={d.id}>{d.name}{d.active === false ? ' (inactif)' : ''}</option>)}
              </select>
              {driverClash.length > 0 && <p className="font-sans text-[12px] text-amber-300 mt-2">⚠ Déjà occupé à ce moment : {clashText(driverClash)}</p>}
              {drivers.length === 0 && <p className="font-sans text-[12px] text-muted mt-2">Ajoutez vos chauffeurs dans « Chauffeurs & Véhicules ».</p>}
            </div>
            <div>
              <label className={labelClass}>Véhicule assigné</label>
              <select className={field('fleetUnitId')} value={f.fleetUnitId} onChange={e => set('fleetUnitId', e.target.value)}>
                <option value="">Non assigné</option>
                {activeUnits.map(u => (
                  <option key={u.id} value={u.id}>
                    {unitName(u)} · {vehicles.find(v => v.id === u.modelId)?.name || u.modelId}{u.active === false ? ' (hors service)' : ''}
                  </option>
                ))}
              </select>
              {unitClash.length > 0 && <p className="font-sans text-[12px] text-amber-300 mt-2">⚠ Déjà utilisé à ce moment : {clashText(unitClash)}</p>}
            </div>
          </div>
          <div className="mt-4">
            <label className={labelClass}>Notes internes</label>
            <textarea className={`${field('notes')} h-24 resize-y`} placeholder="Préférences, consignes chauffeur, facturation…" value={f.notes} onChange={e => set('notes', e.target.value)} />
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className={ghostBtn}>Annuler</button>
          <button onClick={save} disabled={saving} className={primaryBtn}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
        </div>
      </div>
    </Modal>
  );
}
