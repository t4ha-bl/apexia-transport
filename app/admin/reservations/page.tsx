'use client';
import { useState, useEffect } from 'react';
import { fetchCollection, updateDocument, removeDocument } from '@/lib/firebaseUtils';
import { Reservation } from '@/lib/store/types';
import { CheckCircle, XCircle, Clock, Copy } from '@phosphor-icons/react';

export default function AdminReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReservations = async () => {
    setLoading(true);
    try {
      const data = await fetchCollection('reservations', 'createdAt');
      setReservations(data as Reservation[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReservations();
  }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await updateDocument('reservations', id, { status });
      setReservations(prev => prev.map(r => r.id === id ? { ...r, status: status as any } : r));
    } catch (err) {
      console.error("Failed to update", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer la réservation ?")) return;
    try {
      await removeDocument('reservations', id);
      setReservations(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  return (
    <div>
      <h1 className="font-display text-[32px] text-ghost mb-8">Tableau de Bord · Réservations</h1>
      
      <div className="bg-ink border border-gold/15 rounded-[2px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans">
            <thead className="bg-[#151515] text-[11px] text-muted uppercase tracking-[0.1em]">
              <tr>
                <th className="px-6 py-4 font-medium border-b border-gold/10">ID / Date</th>
                <th className="px-6 py-4 font-medium border-b border-gold/10">Client</th>
                <th className="px-6 py-4 font-medium border-b border-gold/10">Téléphone</th>
                <th className="px-6 py-4 font-medium border-b border-gold/10">Trajet</th>
                <th className="px-6 py-4 font-medium border-b border-gold/10">Statut</th>
                <th className="px-6 py-4 font-medium border-b border-gold/10">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold/10 text-[14px] text-ghost">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-[#555555]">Chargement des réservations...</td>
                </tr>
              ) : reservations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-[#555555]">Aucune réservation trouvée.</td>
                </tr>
              ) : reservations.map(r => (
                <tr key={r.id} className="hover:bg-gold/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-semibold">{r.id.substring(0, 8)}...</div>
                    <div className="text-[12px] text-[#888]">Créé le {new Date(r.createdAt || '').toLocaleDateString('fr-FR')}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div>{r.fullName}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 group">
                      <span className="text-[14px] text-ghost">{r.phone}</span>
                      <button 
                        onClick={() => navigator.clipboard.writeText(r.phone)}
                        className="text-muted hover:text-gold transition-colors p-1 opacity-0 group-hover:opacity-100"
                        title="Copier le numéro"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-[12px] mb-1"><span className="text-gold">S:</span> {r.service} | <span className="text-gold">V:</span> {r.vehicle}</div>
                    <div>{r.date} à {r.time}</div>
                    <div className="text-[12px] text-[#888] mt-1">{r.pickup} → {r.destination}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] uppercase tracking-wide
                      ${r.status === 'confirmed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                        r.status === 'cancelled' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                        'bg-gold/10 text-gold border border-gold/20'}`}
                    >
                      {r.status === 'confirmed' && <CheckCircle weight="fill" />}
                      {r.status === 'cancelled' && <XCircle weight="fill" />}
                      {r.status === 'pending' && <Clock weight="fill" />}
                      {r.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <select 
                        value={r.status} 
                        onChange={e => handleUpdateStatus(r.id, e.target.value)}
                        className="bg-offblack border border-gold/20 text-ghost text-[12px] px-2 py-1 outline-none focus:border-gold cursor-pointer"
                      >
                        <option value="pending">En attente</option>
                        <option value="confirmed">Confirmé</option>
                        <option value="cancelled">Annulé</option>
                      </select>
                      <button onClick={() => handleDelete(r.id)} className="text-red-400 hover:text-red-300 text-[12px] px-2">Supprimer</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
