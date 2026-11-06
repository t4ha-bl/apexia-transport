'use client';
import { useState } from 'react';
import { SignOut } from '@phosphor-icons/react';
import { useAuth } from '@/lib/AuthContext';
import { roleLabel } from '@/lib/roles';
import { ConfirmDialog, ghostBtn } from './ui';

// Who is signed in, and the way out
export default function AccountSetting() {
  const { user, member, role, signOut } = useAuth();
  const [confirm, setConfirm] = useState(false);

  return (
    <section className="bg-ink border border-white/10 rounded-[2px] mb-8">
      <div className="px-6 md:px-8 py-5 border-b border-white/10">
        <h2 className="font-display text-[26px] text-ghost">Compte</h2>
      </div>
      <div className="p-6 md:p-8 flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="font-sans font-medium text-[14px] text-ghost truncate">{member?.name || user?.email}</div>
          <div className="font-sans text-[12px] text-muted mt-1 truncate">
            {member?.name ? `${user?.email} · ` : ''}{roleLabel(role || undefined)}
          </div>
        </div>
        <button onClick={() => setConfirm(true)} className={`${ghostBtn} hover:!text-red-400 hover:!border-red-500/40`}>
          <SignOut size={16} /> Déconnexion
        </button>
      </div>
      <ConfirmDialog
        open={confirm}
        title="Se déconnecter"
        message="Vous devrez saisir à nouveau votre e-mail et votre mot de passe pour revenir au tableau de bord."
        confirmLabel="Se déconnecter"
        onConfirm={() => { setConfirm(false); signOut(); }}
        onCancel={() => setConfirm(false)}
      />
    </section>
  );
}
