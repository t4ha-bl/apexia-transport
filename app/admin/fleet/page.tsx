'use client';
import { useEffect, useMemo, useState } from 'react';
import { subscribeCollection, fetchCollection, addDocument, updateDocument, removeDocument } from '@/lib/firebaseUtils';
import { Vehicle } from '@/lib/store/types';
import {
  Driver, FleetUnit, DocItem, MaintenanceEntry, DRIVER_DOC_PRESETS, VEHICLE_DOC_PRESETS,
  expiryState, daysUntil, worstExpiry, unitName, ExpiryState,
} from '@/lib/fleet';
import { useAuth } from '@/lib/AuthContext';
import { PageHeader, Modal, ConfirmDialog, useToast, inputClass, labelClass, primaryBtn, ghostBtn } from '@/components/admin/ui';
import { Plus, PencilSimple, Trash, Phone, WarningCircle, SteeringWheel, Car, X, Wrench } from '@phosphor-icons/react';

const STATE_STYLE: Record<ExpiryState, string> = {
  expired: 'border-red-500/40 bg-red-500/10 text-red-300',
  soon: 'border-amber-400/40 bg-amber-400/10 text-amber-200',
  ok: 'border-white/15 text-muted',
  none: 'border-white/10 text-muted/60',
};

function expiryText(date: string) {
  const d = daysUntil(date);
  if (d === null) return 'date non renseignée';
  if (d < 0) return `expiré depuis ${-d} j`;
  if (d === 0) return "expire aujourd'hui";
  return `expire dans ${d} j`;
}

function DocChips({ docs }: { docs: DocItem[] }) {
  if (!docs?.length) return <div className="font-sans text-[12px] text-muted/60">Aucun document suivi</div>;
  return (
    <div className="flex flex-wrap gap-2">
      {docs.map((d, i) => (
        <span key={i} title={d.expiry ? new Date(`${d.expiry}T00:00:00`).toLocaleDateString('fr-FR') : ''}
          className={`font-sans text-[12px] px-2 py-1 border rounded-[2px] ${STATE_STYLE[expiryState(d.expiry)]}`}>
          {d.label} · {expiryText(d.expiry)}
        </span>
      ))}
    </div>
  );
}

// Editable list of documents with expiry dates (+ one-click presets)
function DocsEditor({ docs, presets, onChange }: { docs: DocItem[]; presets: string[]; onChange: (d: DocItem[]) => void }) {
  const missing = presets.filter(p => !docs.some(d => d.label === p));
  return (
    <div>
      <label className={labelClass}>Documents & échéances</label>
      <div className="flex flex-col gap-2">
        {docs.map((d, i) => (
          <div key={i} className="flex gap-2">
            <input className={`${inputClass} flex-1`} value={d.label} placeholder="Document"
              onChange={e => onChange(docs.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
            <input type="date" className={`${inputClass} !w-44`} value={d.expiry}
              onChange={e => onChange(docs.map((x, j) => (j === i ? { ...x, expiry: e.target.value } : x)))} />
            <button type="button" onClick={() => onChange(docs.filter((_, j) => j !== i))}
              className="px-3 border border-white/10 text-muted hover:text-red-400 rounded-[2px]" aria-label="Retirer"><X size={14} /></button>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        {missing.map(p => (
          <button key={p} type="button" onClick={() => onChange([...docs, { label: p, expiry: '' }])}
            className="font-sans text-[12px] px-2 py-1 border border-dashed border-white/20 text-muted hover:text-ghost hover:border-white/40 rounded-[2px]">
            + {p}
          </button>
        ))}
        <button type="button" onClick={() => onChange([...docs, { label: '', expiry: '' }])}
          className="font-sans text-[12px] px-2 py-1 border border-dashed border-white/20 text-muted hover:text-ghost hover:border-white/40 rounded-[2px]">
          + Autre document
        </button>
      </div>
    </div>
  );
}

const cleanDocs = (docs: DocItem[]) => docs.filter(d => d.label.trim()).map(d => ({ label: d.label.trim(), expiry: d.expiry || '' }));
const intOrNull = (s: string) => (s.trim() === '' ? null : Math.max(0, Math.round(Number(s))));

export default function AdminFleet() {
  const toast = useToast();
  const [tab, setTab] = useState<'drivers' | 'units'>('drivers');
  const canEdit = useAuth().can('fleet.write'); // the accountant sees this page read-only
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [units, setUnits] = useState<FleetUnit[]>([]);
  const [catalog, setCatalog] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  const [driverForm, setDriverForm] = useState<Partial<Driver> | null>(null);
  const [unitForm, setUnitForm] = useState<(Partial<FleetUnit> & { seatsS?: string; yearS?: string; mileageS?: string }) | null>(null);
  const [toDelete, setToDelete] = useState<{ kind: 'drivers' | 'fleet'; id: string; label: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let pending = 2;
    const ready = () => { pending -= 1; if (pending === 0) setLoading(false); };
    const fail = (err: Error) => { console.error(err); toast('error', 'Impossible de charger les données.'); setLoading(false); };
    const u1 = subscribeCollection('drivers', rows => { setDrivers((rows as Driver[]).sort((a, b) => a.name.localeCompare(b.name))); ready(); }, fail);
    const u2 = subscribeCollection('fleet', rows => { setUnits((rows as FleetUnit[]).sort((a, b) => a.plate.localeCompare(b.plate))); ready(); }, fail);
    fetchCollection('vehicles').then(v => setCatalog(v as Vehicle[])).catch(console.error);
    return () => { u1(); u2(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const modelName = (id: string) => catalog.find(v => v.id === id)?.name || id || '—';

  // Every expired / soon-to-expire document, for the summary at the top
  const alerts = useMemo(() => {
    const list: { who: string; label: string; expiry: string; state: ExpiryState }[] = [];
    drivers.filter(d => d.active !== false).forEach(d => d.documents?.forEach(doc => {
      const state = expiryState(doc.expiry);
      if (state === 'expired' || state === 'soon') list.push({ who: d.name, label: doc.label, expiry: doc.expiry, state });
    }));
    units.filter(u => u.active !== false).forEach(u => u.documents?.forEach(doc => {
      const state = expiryState(doc.expiry);
      if (state === 'expired' || state === 'soon') list.push({ who: unitName(u), label: doc.label, expiry: doc.expiry, state });
    }));
    return list.sort((a, b) => (daysUntil(a.expiry) ?? 0) - (daysUntil(b.expiry) ?? 0));
  }, [drivers, units]);

  const saveDriver = async () => {
    if (!driverForm) return;
    if (!driverForm.name?.trim() || !driverForm.phone?.trim()) { toast('error', 'Nom et téléphone sont obligatoires.'); return; }
    const payload = {
      name: driverForm.name.trim(), phone: driverForm.phone.trim(), languages: (driverForm.languages || '').trim(),
      active: driverForm.active !== false, documents: cleanDocs(driverForm.documents || []), notes: (driverForm.notes || '').trim(),
    };
    setSaving(true);
    try {
      if (driverForm.id) await updateDocument('drivers', driverForm.id, payload);
      else await addDocument('drivers', payload);
      toast('success', 'Chauffeur enregistré.');
      setDriverForm(null);
    } catch (err) { console.error(err); toast('error', "Échec de l'enregistrement."); }
    finally { setSaving(false); }
  };

  const saveUnit = async () => {
    if (!unitForm) return;
    if (!unitForm.plate?.trim() || !unitForm.modelId) { toast('error', 'Immatriculation et modèle sont obligatoires.'); return; }
    const payload = {
      plate: unitForm.plate.trim().toUpperCase(), modelId: unitForm.modelId, label: (unitForm.label || '').trim(),
      seats: intOrNull(unitForm.seatsS ?? ''), year: intOrNull(unitForm.yearS ?? ''), mileage: intOrNull(unitForm.mileageS ?? ''),
      active: unitForm.active !== false, documents: cleanDocs(unitForm.documents || []),
      maintenance: (unitForm.maintenance || []).filter(m => m.description.trim() || m.date)
        .map(m => ({ date: m.date || '', km: m.km ?? null, description: m.description.trim(), cost: m.cost ?? null }))
        .sort((a, b) => b.date.localeCompare(a.date)),
      notes: (unitForm.notes || '').trim(),
    };
    setSaving(true);
    try {
      if (unitForm.id) await updateDocument('fleet', unitForm.id, payload);
      else await addDocument('fleet', payload);
      toast('success', 'Véhicule enregistré.');
      setUnitForm(null);
    } catch (err) { console.error(err); toast('error', "Échec de l'enregistrement."); }
    finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    const { kind, id } = toDelete;
    setToDelete(null);
    try { await removeDocument(kind, id, toDelete?.label); toast('success', 'Supprimé.'); }
    catch (err) { console.error(err); toast('error', 'Échec de la suppression.'); }
  };

  const openUnit = (u: FleetUnit | null) => setUnitForm(u
    ? { ...u, seatsS: u.seats != null ? String(u.seats) : '', yearS: u.year != null ? String(u.year) : '', mileageS: u.mileage != null ? String(u.mileage) : '' }
    : { active: true, documents: VEHICLE_DOC_PRESETS.slice(0, 4).map(label => ({ label, expiry: '' })), maintenance: [], seatsS: '', yearS: '', mileageS: '' });

  const setMaint = (i: number, patch: Partial<MaintenanceEntry>) =>
    setUnitForm(f => f && ({ ...f, maintenance: (f.maintenance || []).map((m, j) => (j === i ? { ...m, ...patch } : m)) }));

  return (
    <div>
      <PageHeader
        eyebrow="Opérations"
        title="Chauffeurs & Véhicules"
        subtitle="Votre équipe et vos véhicules réels, avec le suivi des documents et de l'entretien."
        action={canEdit &&
          <button onClick={() => (tab === 'drivers' ? setDriverForm({ active: true, documents: DRIVER_DOC_PRESETS.map(label => ({ label, expiry: '' })) }) : openUnit(null))} className={primaryBtn}>
            <Plus size={14} weight="bold" /> {tab === 'drivers' ? 'Ajouter un chauffeur' : 'Ajouter un véhicule'}
          </button>
        }
      />

      {/* Expiry alerts */}
      {alerts.length > 0 && (
        <div className="mb-6 p-5 border border-amber-400/25 bg-amber-400/[0.05] rounded-[2px]">
          <div className="flex items-center gap-2 font-sans text-[12px] text-amber-200 mb-3">
            <WarningCircle size={16} weight="fill" /> {alerts.length} document{alerts.length > 1 ? 's' : ''} à renouveler
          </div>
          <ul className="flex flex-col gap-1.5">
            {alerts.slice(0, 8).map((a, i) => (
              <li key={i} className="font-sans text-[13px] text-ghost">
                <span className={a.state === 'expired' ? 'text-red-300' : 'text-amber-200'}>●</span>{' '}
                <span className="font-medium">{a.label}</span> · {a.who} · <span className="text-muted">{expiryText(a.expiry)}</span>
              </li>
            ))}
            {alerts.length > 8 && <li className="font-sans text-[12px] text-muted">… et {alerts.length - 8} autre(s)</li>}
          </ul>
        </div>
      )}

      {/* Tabs */}
      <div className="inline-flex border border-white/10 rounded-[2px] overflow-hidden mb-6">
        {([['drivers', `Chauffeurs (${drivers.length})`, SteeringWheel], ['units', `Véhicules (${units.length})`, Car]] as const).map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-5 py-2.5 font-sans text-[13px] border-r border-white/10 last:border-r-0 transition-colors ${tab === key ? 'bg-ghost text-offblack font-medium' : 'text-muted hover:text-ghost hover:bg-white/5'}`}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 text-center font-sans text-[14px] text-muted">Chargement…</div>
      ) : tab === 'drivers' ? (
        drivers.length === 0 ? (
          <div className="py-16 text-center bg-ink border border-white/10 rounded-[2px] font-sans text-[14px] text-muted">Aucun chauffeur. Ajoutez votre équipe pour pouvoir l&apos;assigner aux réservations.</div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {drivers.map(d => (
              <article key={d.id} className={`bg-ink border rounded-[2px] p-5 flex flex-col gap-4 ${STATE_BORDER[worstExpiry(d.documents)]}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-sans font-medium text-[16px] text-ghost flex items-center gap-2">
                      {d.name}
                      {d.active === false && <span className="font-sans text-[12px] border border-white/15 text-muted px-2 py-0.5 rounded-[2px]">Inactif</span>}
                    </div>
                    <div className="font-sans text-[13px] text-muted flex items-center gap-1.5 mt-1"><Phone size={13} /> {d.phone}{d.languages ? ` · ${d.languages}` : ''}</div>
                  </div>
                  <div className={`flex gap-2 shrink-0 ${canEdit ? '' : 'hidden'}`}>
                    <button onClick={() => setDriverForm(d)} className={`${ghostBtn} !px-3 !py-2`}><PencilSimple size={14} /> Éditer</button>
                    <button onClick={() => setToDelete({ kind: 'drivers', id: d.id, label: d.name })} className="border border-red-500/25 text-red-400 px-3 rounded-[2px] hover:bg-red-500/10" aria-label="Supprimer"><Trash size={16} /></button>
                  </div>
                </div>
                <DocChips docs={d.documents} />
                {d.notes && <p className="font-sans text-[13px] text-muted whitespace-pre-wrap">{d.notes}</p>}
              </article>
            ))}
          </div>
        )
      ) : units.length === 0 ? (
        <div className="py-16 text-center bg-ink border border-white/10 rounded-[2px] font-sans text-[14px] text-muted">Aucun véhicule. Ajoutez vos voitures (avec immatriculation) pour pouvoir les assigner.</div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {units.map(u => {
            const img = catalog.find(v => v.id === u.modelId)?.image;
            const lastService = u.maintenance?.[0];
            return (
              <article key={u.id} className={`bg-ink border rounded-[2px] p-5 flex flex-col gap-4 ${STATE_BORDER[worstExpiry(u.documents)]}`}>
                <div className="flex items-start gap-4">
                  <div className="w-24 h-16 bg-offblack border border-white/10 flex items-center justify-center p-1 shrink-0">
                    {img ? <img src={img} alt="" className="max-h-full max-w-full object-contain" loading="lazy" /> : <Car size={24} className="text-muted" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-sans font-medium text-[16px] text-ghost flex items-center gap-2 flex-wrap">
                      {u.plate}
                      {u.active === false && <span className="font-sans text-[12px] border border-white/15 text-muted px-2 py-0.5 rounded-[2px]">Inactif</span>}
                    </div>
                    <div className="font-sans text-[13px] text-muted mt-1">
                      {modelName(u.modelId)}{u.label ? ` · ${u.label}` : ''}
                      {u.seats ? ` · ${u.seats} places` : ''}{u.year ? ` · ${u.year}` : ''}
                      {u.mileage != null ? ` · ${u.mileage.toLocaleString('fr-FR')} km` : ''}
                    </div>
                  </div>
                  <div className={`flex gap-2 shrink-0 ${canEdit ? '' : 'hidden'}`}>
                    <button onClick={() => openUnit(u)} className={`${ghostBtn} !px-3 !py-2`}><PencilSimple size={14} /> Éditer</button>
                    <button onClick={() => setToDelete({ kind: 'fleet', id: u.id, label: u.plate })} className="border border-red-500/25 text-red-400 px-3 rounded-[2px] hover:bg-red-500/10" aria-label="Supprimer"><Trash size={16} /></button>
                  </div>
                </div>
                <DocChips docs={u.documents} />
                {lastService && (
                  <div className="font-sans text-[12px] text-muted flex items-center gap-1.5">
                    <Wrench size={13} /> Dernier entretien : {lastService.date ? new Date(`${lastService.date}T00:00:00`).toLocaleDateString('fr-FR') : '—'} · {lastService.description}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* Driver form */}
      <Modal open={!!driverForm} onClose={() => setDriverForm(null)} title={driverForm?.id ? 'Éditer le chauffeur' : 'Ajouter un chauffeur'} maxWidth="max-w-[720px]">
        {driverForm && (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className={labelClass}>Nom complet *</label><input className={inputClass} value={driverForm.name || ''} onChange={e => setDriverForm({ ...driverForm, name: e.target.value })} /></div>
              <div><label className={labelClass}>Téléphone *</label><input className={inputClass} placeholder="+212 6..." value={driverForm.phone || ''} onChange={e => setDriverForm({ ...driverForm, phone: e.target.value })} /></div>
              <div><label className={labelClass}>Langues parlées</label><input className={inputClass} placeholder="Français, Anglais, Arabe" value={driverForm.languages || ''} onChange={e => setDriverForm({ ...driverForm, languages: e.target.value })} /></div>
              <label className="flex items-center gap-3 font-sans text-[14px] text-ghost mt-6 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 accent-white" checked={driverForm.active !== false} onChange={e => setDriverForm({ ...driverForm, active: e.target.checked })} />
                Actif (peut être assigné)
              </label>
            </div>
            <DocsEditor docs={driverForm.documents || []} presets={DRIVER_DOC_PRESETS} onChange={documents => setDriverForm({ ...driverForm, documents })} />
            <div><label className={labelClass}>Notes</label><textarea className={`${inputClass} h-20 resize-y`} value={driverForm.notes || ''} onChange={e => setDriverForm({ ...driverForm, notes: e.target.value })} /></div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDriverForm(null)} className={ghostBtn}>Annuler</button>
              <button onClick={saveDriver} disabled={saving} className={primaryBtn}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Vehicle unit form */}
      <Modal open={!!unitForm} onClose={() => setUnitForm(null)} title={unitForm?.id ? 'Éditer le véhicule' : 'Ajouter un véhicule'} maxWidth="max-w-[820px]">
        {unitForm && (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className={labelClass}>Immatriculation *</label><input className={`${inputClass}`} placeholder="12345-A-6" value={unitForm.plate || ''} onChange={e => setUnitForm({ ...unitForm, plate: e.target.value })} /></div>
              <div>
                <label className={labelClass}>Modèle (catalogue) *</label>
                <select className={inputClass} value={unitForm.modelId || ''} onChange={e => setUnitForm({ ...unitForm, modelId: e.target.value })}>
                  <option value="">Choisir…</option>
                  {catalog.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              <div><label className={labelClass}>Surnom</label><input className={inputClass} placeholder="Classe S noire" value={unitForm.label || ''} onChange={e => setUnitForm({ ...unitForm, label: e.target.value })} /></div>
              <div><label className={labelClass}>Places</label><input type="number" min={1} className={inputClass} value={unitForm.seatsS || ''} onChange={e => setUnitForm({ ...unitForm, seatsS: e.target.value })} /></div>
              <div><label className={labelClass}>Année</label><input type="number" min={1990} className={inputClass} value={unitForm.yearS || ''} onChange={e => setUnitForm({ ...unitForm, yearS: e.target.value })} /></div>
              <div><label className={labelClass}>Kilométrage</label><input type="number" min={0} className={inputClass} value={unitForm.mileageS || ''} onChange={e => setUnitForm({ ...unitForm, mileageS: e.target.value })} /></div>
            </div>
            <label className="flex items-center gap-3 font-sans text-[14px] text-ghost cursor-pointer">
              <input type="checkbox" className="w-4 h-4 accent-white" checked={unitForm.active !== false} onChange={e => setUnitForm({ ...unitForm, active: e.target.checked })} />
              En service (peut être assigné)
            </label>
            <DocsEditor docs={unitForm.documents || []} presets={VEHICLE_DOC_PRESETS} onChange={documents => setUnitForm({ ...unitForm, documents })} />

            <div>
              <label className={labelClass}>Carnet d&apos;entretien</label>
              <div className="flex flex-col gap-2">
                {(unitForm.maintenance || []).map((m, i) => (
                  <div key={i} className="grid grid-cols-[150px_110px_1fr_110px_auto] gap-2">
                    <input type="date" className={inputClass} value={m.date} onChange={e => setMaint(i, { date: e.target.value })} />
                    <input type="number" min={0} className={inputClass} placeholder="km" value={m.km ?? ''} onChange={e => setMaint(i, { km: intOrNull(e.target.value) })} />
                    <input className={inputClass} placeholder="Vidange, pneus, freins…" value={m.description} onChange={e => setMaint(i, { description: e.target.value })} />
                    <input type="number" min={0} className={inputClass} placeholder="MAD" value={m.cost ?? ''} onChange={e => setMaint(i, { cost: intOrNull(e.target.value) })} />
                    <button type="button" onClick={() => setUnitForm({ ...unitForm, maintenance: (unitForm.maintenance || []).filter((_, j) => j !== i) })}
                      className="px-3 border border-white/10 text-muted hover:text-red-400 rounded-[2px]" aria-label="Retirer"><X size={14} /></button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => setUnitForm({ ...unitForm, maintenance: [{ date: new Date().toISOString().slice(0, 10), km: intOrNull(unitForm.mileageS ?? ''), description: '', cost: null }, ...(unitForm.maintenance || [])] })}
                className="mt-3 font-sans text-[12px] px-2 py-1 border border-dashed border-white/20 text-muted hover:text-ghost hover:border-white/40 rounded-[2px]">
                + Ajouter une intervention
              </button>
            </div>

            <div><label className={labelClass}>Notes</label><textarea className={`${inputClass} h-20 resize-y`} value={unitForm.notes || ''} onChange={e => setUnitForm({ ...unitForm, notes: e.target.value })} /></div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setUnitForm(null)} className={ghostBtn}>Annuler</button>
              <button onClick={saveUnit} disabled={saving} className={primaryBtn}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Confirmer la suppression"
        message={`Supprimer « ${toDelete?.label || ''} » ? Les réservations déjà assignées garderont la référence mais n'afficheront plus le nom.`}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}

const STATE_BORDER: Record<ExpiryState, string> = {
  expired: 'border-red-500/40',
  soon: 'border-amber-400/40',
  ok: 'border-white/10',
  none: 'border-white/10',
};
