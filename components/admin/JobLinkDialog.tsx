'use client';
import { useEffect, useState } from 'react';
import { updateDocument } from '@/lib/firebaseUtils';
import { Reservation, Service, Vehicle } from '@/lib/store/types';
import { Driver, FleetUnit } from '@/lib/fleet';
import { Job, jobUrl, newJobToken, revokeJob, syncJob, driverStatusLabel } from '@/lib/jobs';
import { phoneKey } from '@/lib/customers';
import { Modal, useToast, inputClass, primaryBtn, ghostBtn, dangerBtn } from './ui';
import { Copy, WhatsappLogo, ArrowSquareOut } from '@phosphor-icons/react';

// Creates (or refreshes) the secret driver link for a booking and lets the team share or revoke it
export default function JobLinkDialog({ reservation, job, services, vehicles, drivers, units, onClose }: {
  reservation: Reservation | null;
  job?: Job;
  services: Service[]; vehicles: Vehicle[]; drivers: Driver[]; units: FleetUnit[];
  onClose: () => void;
}) {
  const toast = useToast();
  const [token, setToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Opening the dialog creates the link if needed, otherwise refreshes its content
  useEffect(() => {
    if (!reservation) { setToken(null); return; }
    let cancelled = false;
    (async () => {
      setBusy(true);
      try {
        const t = reservation.jobToken || newJobToken();
        // A booking whose link was revoked elsewhere gets a fresh job too
        await syncJob(reservation, t, { services, vehicles, drivers, units }, !reservation.jobToken || !job);
        if (!reservation.jobToken) await updateDocument('reservations', reservation.id, { jobToken: t });
        if (!cancelled) setToken(t);
      } catch (err) {
        console.error(err);
        toast('error', 'Impossible de créer le lien chauffeur.');
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservation?.id]);

  if (!reservation) return null;
  const url = token ? jobUrl(token) : '';
  const driver = drivers.find(d => d.id === reservation.driverId);
  const message = `Bonjour${driver ? ` ${driver.name.split(' ')[0]}` : ''}, voici votre mission ${reservation.ref || ''} du ${reservation.date} à ${reservation.time} : ${url}`;

  const revoke = async () => {
    if (!token) return;
    setBusy(true);
    try {
      await revokeJob(token, reservation.ref);
      await updateDocument('reservations', reservation.id, { jobToken: null });
      toast('success', 'Lien chauffeur révoqué.');
      onClose();
    } catch (err) { console.error(err); toast('error', 'Échec de la révocation.'); }
    finally { setBusy(false); }
  };

  return (
    <Modal open={!!reservation} onClose={onClose} title={`Lien chauffeur · ${reservation.ref || ''}`} maxWidth="max-w-[620px]">
      <div className="flex flex-col gap-5">
        <p className="font-sans text-[13px] text-muted">
          Page mobile sans connexion pour le chauffeur : trajet, client, itinéraire et boutons d&apos;avancement.
          Le prix et vos notes internes n&apos;y figurent pas. Le lien expire 2 jours après la course.
        </p>
        {!token ? (
          <div className="py-6 text-center font-sans text-[13px] text-muted">{busy ? 'Création du lien…' : '—'}</div>
        ) : (
          <>
            <div className="flex gap-2">
              <input readOnly value={url} className={`${inputClass} flex-1 !text-[12px]`} onFocus={e => e.target.select()} />
              <button onClick={() => navigator.clipboard.writeText(url).then(() => toast('success', 'Lien copié.'))} className={`${ghostBtn} !px-3`} aria-label="Copier"><Copy size={16} /></button>
              <a href={url} target="_blank" rel="noreferrer" className={`${ghostBtn} !px-3`} aria-label="Ouvrir"><ArrowSquareOut size={16} /></a>
            </div>
            {job && <div className="font-sans text-[13px] text-ghost">Statut chauffeur : <span className="font-medium">{driverStatusLabel(job.driverStatus)}</span> <span className="text-muted">({new Date(job.driverStatusAt).toLocaleString('fr-FR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })})</span></div>}
            <div className="flex flex-wrap gap-3 justify-between">
              <button onClick={revoke} disabled={busy} className={dangerBtn}>Révoquer le lien</button>
              {driver ? (
                <a href={`https://wa.me/${phoneKey(driver.phone)}?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer" className={primaryBtn}>
                  <WhatsappLogo size={16} /> Envoyer à {driver.name.split(' ')[0]}
                </a>
              ) : (
                <span className="font-sans text-[12px] text-amber-300 self-center">Assignez un chauffeur pour l&apos;envoyer par WhatsApp.</span>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
