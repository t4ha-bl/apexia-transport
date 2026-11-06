'use client';
import { useMemo, useState } from 'react';
import { useAdminData } from './useAdminData';
import { anonymizeOld, retentionCandidates } from '@/lib/privacy';
import { ConfirmDialog, useToast, inputClass, labelClass, dangerBtn } from './ui';

// Limited retention (law 09-08): anonymise bookings whose trip is older than N months
export default function RetentionTool() {
  const toast = useToast();
  const { reservations, jobsByReservation, loading } = useAdminData();
  const [months, setMonths] = useState(36);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const candidates = useMemo(() => (months >= 6 ? retentionCandidates(reservations, months) : []), [reservations, months]);

  const run = async () => {
    setConfirm(false);
    setBusy(true);
    try {
      const n = await anonymizeOld(candidates, months, jobsByReservation);
      toast('success', `${n} réservation(s) anonymisée(s).`);
    } catch (err) { console.error(err); toast('error', "Échec de l'anonymisation."); }
    finally { setBusy(false); }
  };

  return (
    <section className="bg-ink border border-white/10 rounded-[2px] mb-8">
      <div className="px-6 md:px-8 py-5 border-b border-white/10">
        <h2 className="font-display text-[26px] text-ghost">Données personnelles</h2>
      </div>
      <div className="p-6 md:p-8 flex flex-col gap-5">
        <p className="font-sans text-[13px] text-muted leading-relaxed">
          La loi 09-08 demande de ne pas garder les données personnelles plus longtemps que nécessaire.
          Cet outil efface les noms, téléphones, adresses et messages des réservations anciennes ; les dates, services et montants restent (anonymes) pour vos statistiques.
          Pour un client précis (droit d&apos;accès ou d&apos;effacement), utilisez sa fiche dans « Clients ».
        </p>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className={labelClass}>Anonymiser les courses de plus de (mois)</label>
            <input type="number" min={6} max={240} className={`${inputClass} !w-40`} value={months} onChange={e => setMonths(Math.max(0, Number(e.target.value) || 0))} />
          </div>
          <div className="font-sans text-[13px] text-ghost pb-3">
            {loading ? '…' : months < 6 ? 'Minimum 6 mois.' : `${candidates.length} réservation(s) concernée(s)`}
          </div>
          <button onClick={() => setConfirm(true)} disabled={busy || !candidates.length} className={dangerBtn}>{busy ? 'En cours…' : 'Anonymiser'}</button>
        </div>
      </div>
      <ConfirmDialog
        open={confirm}
        title="Anonymiser les anciennes réservations"
        confirmLabel="Anonymiser"
        message={`${candidates.length} réservation(s) dont la course date de plus de ${months} mois perdront définitivement leurs données personnelles. Action irréversible.`}
        onConfirm={run}
        onCancel={() => setConfirm(false)}
      />
    </section>
  );
}
