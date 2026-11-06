'use client';
import { useEffect, useState } from 'react';
import { subscribeCollection, setDocument, removeDocument } from '@/lib/firebaseUtils';
import { ROLES, Role, TeamMember, roleLabel } from '@/lib/roles';
import { useAuth } from '@/lib/AuthContext';
import { PageHeader, Modal, ConfirmDialog, useToast, inputClass, labelClass, primaryBtn, ghostBtn } from '@/components/admin/ui';
import { Plus, PencilSimple, Trash, Info } from '@phosphor-icons/react';

type Draft = { email: string; name: string; role: Role; active: boolean; isNew: boolean };

export default function AdminTeam() {
  const toast = useToast();
  const { user } = useAuth();
  const myEmail = (user?.email || '').toLowerCase();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [toDelete, setToDelete] = useState<TeamMember | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => subscribeCollection('admins', rows => {
    setMembers((rows as TeamMember[]).sort((a, b) => a.email.localeCompare(b.email)));
    setLoading(false);
  }, err => { console.error(err); setLoading(false); toast('error', "Impossible de charger l'équipe."); }), // eslint-disable-line react-hooks/exhaustive-deps
  []);

  const activeOwners = members.filter(m => m.role === 'owner' && m.active !== false);

  const save = async () => {
    if (!draft) return;
    const email = draft.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast('error', 'Adresse e-mail invalide.'); return; }
    if (draft.isNew && members.some(m => m.id === email)) { toast('error', 'Ce membre existe déjà.'); return; }
    // Never lock the team out: keep at least one active owner, and never demote yourself
    const losesOwner = !draft.isNew && members.find(m => m.id === email)?.role === 'owner' && (draft.role !== 'owner' || !draft.active);
    if (losesOwner && activeOwners.length <= 1) { toast('error', 'Il doit rester au moins un propriétaire actif.'); return; }
    if (email === myEmail && (draft.role !== 'owner' || !draft.active)) { toast('error', 'Vous ne pouvez pas retirer vos propres droits.'); return; }
    setSaving(true);
    try {
      await setDocument('admins', email, {
        email, name: draft.name.trim(), role: draft.role, active: draft.active,
        ...(draft.isNew ? { addedAt: new Date().toISOString(), addedBy: myEmail } : {}),
      });
      toast('success', draft.isNew ? 'Membre ajouté.' : 'Membre mis à jour.');
      setDraft(null);
    } catch (err) {
      console.error(err);
      toast('error', "Échec de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    const m = toDelete; setToDelete(null);
    if (m.id === myEmail) { toast('error', 'Vous ne pouvez pas vous retirer vous-même.'); return; }
    if (m.role === 'owner' && activeOwners.length <= 1) { toast('error', 'Il doit rester au moins un propriétaire actif.'); return; }
    try { await removeDocument('admins', m.id, m.email); toast('success', 'Accès retiré.'); }
    catch (err) { console.error(err); toast('error', 'Échec de la suppression.'); }
  };

  return (
    <div className="max-w-[1000px]">
      <PageHeader
        eyebrow="Administration"
        title="Équipe"
        subtitle="Qui peut accéder au panneau, et avec quels droits."
        action={<button onClick={() => setDraft({ email: '', name: '', role: 'dispatcher', active: true, isNew: true })} className={primaryBtn}><Plus size={14} weight="bold" /> Ajouter un membre</button>}
      />

      <div className="mb-6 p-4 border border-white/10 bg-ink rounded-[2px] font-sans text-[13px] text-muted flex gap-3">
        <Info size={18} className="shrink-0 mt-0.5 text-ghost" />
        <div>
          Pour ajouter quelqu&apos;un : 1) créez son compte (e-mail + mot de passe) dans la console Firebase → Authentication → Utilisateurs → « Ajouter un utilisateur » ;
          2) ajoutez la même adresse ici avec son rôle. Un compte Firebase absent de cette liste ne peut pas entrer.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {ROLES.map(r => (
          <div key={r.id} className="p-4 bg-ink border border-white/10 rounded-[2px]">
            <div className="font-sans text-[13px] text-ghost font-medium">{r.label}</div>
            <div className="font-sans text-[12px] text-muted mt-1">{r.description}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="py-16 text-center font-sans text-[14px] text-muted">Chargement…</div>
      ) : (
        <div className="bg-ink border border-white/10 rounded-[2px] divide-y divide-white/5">
          {members.map(m => (
            <div key={m.id} className="px-5 py-4 flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="font-sans text-[14px] text-ghost">{m.name || m.email}{m.id === myEmail && <span className="text-muted text-[12px]"> (vous)</span>}</div>
                {m.name && <div className="font-sans text-[12px] text-muted">{m.email}</div>}
              </div>
              <span className="font-sans text-[12px] text-ghost border border-white/15 px-2 py-1 rounded-[2px]">{roleLabel(m.role)}</span>
              <span className={`font-sans text-[12px] ${m.active !== false ? 'text-green-400' : 'text-muted line-through'}`}>{m.active !== false ? 'Actif' : 'Désactivé'}</span>
              <div className="flex gap-2">
                <button onClick={() => setDraft({ email: m.email, name: m.name || '', role: m.role, active: m.active !== false, isNew: false })} className={`${ghostBtn} !px-3 !py-2`}><PencilSimple size={14} /></button>
                {m.id !== myEmail && (
                  <button onClick={() => setToDelete(m)} className="border border-red-500/25 text-red-400 px-3 rounded-[2px] hover:bg-red-500/10" aria-label="Retirer"><Trash size={16} /></button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!draft} onClose={() => setDraft(null)} title={draft?.isNew ? 'Ajouter un membre' : 'Modifier le membre'} maxWidth="max-w-[520px]">
        {draft && (
          <div className="flex flex-col gap-4">
            <div><label className={labelClass}>E-mail (identique au compte Firebase)</label><input className={inputClass} disabled={!draft.isNew} value={draft.email} onChange={e => setDraft({ ...draft, email: e.target.value })} /></div>
            <div><label className={labelClass}>Nom</label><input className={inputClass} value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} /></div>
            <div>
              <label className={labelClass}>Rôle</label>
              <select className={inputClass} value={draft.role} onChange={e => setDraft({ ...draft, role: e.target.value as Role })}>
                {ROLES.map(r => <option key={r.id} value={r.id}>{r.label} : {r.description}</option>)}
              </select>
            </div>
            <label className="flex items-center gap-3 font-sans text-[14px] text-ghost cursor-pointer">
              <input type="checkbox" className="w-4 h-4 accent-white" checked={draft.active} onChange={e => setDraft({ ...draft, active: e.target.checked })} />
              Accès actif
            </label>
            <div className="flex justify-end gap-3 mt-2">
              <button onClick={() => setDraft(null)} className={ghostBtn}>Annuler</button>
              <button onClick={save} disabled={saving} className={primaryBtn}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!toDelete} title="Retirer l'accès" confirmLabel="Retirer"
        message={`Retirer l'accès de ${toDelete?.email || ''} ? Son compte Firebase existe toujours mais ne pourra plus entrer dans le panneau.`}
        onConfirm={confirmDelete} onCancel={() => setToDelete(null)} />
    </div>
  );
}
