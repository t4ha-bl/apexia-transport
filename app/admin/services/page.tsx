'use client';
import { useState, useEffect } from 'react';
import { fetchCollection, addDocument, updateDocument, removeDocument } from '@/lib/firebaseUtils';
import { Vehicle, Service } from '@/lib/store/types';
import { PageHeader, Modal, ConfirmDialog, useToast, inputClass, labelClass, primaryBtn, ghostBtn } from '@/components/admin/ui';
import IconPicker from '@/components/admin/IconPicker';
import { Plus, PencilSimple, Trash, Users, Suitcase, Star } from '@phosphor-icons/react';

export default function AdminServices() {
  const toast = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editingVehicle, setEditingVehicle] = useState<Partial<Vehicle> | null>(null);
  const [editingService, setEditingService] = useState<Partial<Service> | null>(null);
  const [toDelete, setToDelete] = useState<{ kind: 'vehicle' | 'service'; id: string; label: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedServices, fetchedVehicles] = await Promise.all([
        fetchCollection('services'), // sorted below; orderBy would hide services with no number
        fetchCollection('vehicles')
      ]);

      const sortedServices = (fetchedServices as Service[]).sort((a, b) => {
        const numA = parseInt(a.number) || 999;
        const numB = parseInt(b.number) || 999;
        return numA - numB;
      });

      setServices(sortedServices);
      setVehicles(fetchedVehicles as Vehicle[]);
    } catch (err) {
      console.error(err);
      toast('error', 'Impossible de charger les données.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveVehicle = async () => {
    if (!editingVehicle) return;
    setSaving(true);
    try {
      if (editingVehicle.id && vehicles.find(v => v.id === editingVehicle.id)) {
        await updateDocument('vehicles', editingVehicle.id, editingVehicle);
      } else {
        await addDocument('vehicles', editingVehicle);
      }
      await loadData();
      setEditingVehicle(null);
      toast('success', 'Véhicule enregistré.');
    } catch (err) {
      console.error("Failed to save vehicle", err);
      toast('error', "Échec de l'enregistrement du véhicule.");
    } finally {
      setSaving(false);
    }
  };

  const saveService = async () => {
    if (!editingService) return;
    setSaving(true);
    try {
      if (editingService.id && services.find(s => s.id === editingService.id)) {
        await updateDocument('services', editingService.id, editingService);
      } else {
        await addDocument('services', editingService);
      }
      await loadData();
      setEditingService(null);
      toast('success', 'Service enregistré.');
    } catch (err) {
      console.error("Failed to save service", err);
      toast('error', "Échec de l'enregistrement du service.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    const { kind, id } = toDelete;
    setToDelete(null);
    try {
      if (kind === 'vehicle') {
        await removeDocument('vehicles', id);
        setVehicles(prev => prev.filter(v => v.id !== id));
      } else {
        await removeDocument('services', id);
        setServices(prev => prev.filter(s => s.id !== id));
      }
      toast('success', kind === 'vehicle' ? 'Véhicule supprimé.' : 'Service supprimé.');
    } catch (err) {
      console.error("Failed to delete", err);
      toast('error', 'Échec de la suppression.');
    }
  };

  if (loading) {
    return <div className="py-16 text-center font-sans text-[14px] text-muted">Chargement des données…</div>;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Catalogue"
        title="Services & Flotte"
        subtitle="Ce que vous modifiez ici est publié sur le site."
      />

      {/* Fleet on the left, services on the right on wide screens, or from xl up when the sidebar is minimised */}
      <div className="grid grid-cols-1 2xl:grid-cols-2 xl:group-data-[sidebar=collapsed]:grid-cols-2 gap-10">

        {/* VEHICLES */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-display text-[26px] text-ghost">Flotte de véhicules <span className="font-sans text-[13px] text-muted ml-2">{vehicles.length}</span></h2>
            <button onClick={() => setEditingVehicle({})} className={primaryBtn}><Plus size={14} weight="bold" /> Ajouter</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-1 2xl:group-data-[sidebar=collapsed]:grid-cols-2 gap-4">
            {vehicles.length === 0 ? (
              <div className="p-8 text-center bg-ink border border-white/10 rounded-[2px] font-sans text-[14px] text-muted md:col-span-2 2xl:col-span-1">Aucun véhicule.</div>
            ) : vehicles.map(v => (
              <div key={v.id} className="bg-ink border border-white/10 rounded-[2px] hover:border-white/20 transition-colors flex flex-col">
                <div className="h-36 bg-offblack flex items-center justify-center p-3 border-b border-white/10">
                  {v.image ? <img src={v.image} alt={v.name} className="max-h-full max-w-full object-contain" /> : <span className="text-muted text-[12px]">Pas d&apos;image</span>}
                </div>
                <div className="p-5 flex-1 flex flex-col gap-3">
                  <div>
                    <div className="font-sans font-medium text-[15px] text-ghost">{v.name}</div>
                    <div className="font-sans text-[10px] text-muted tracking-[0.2em] uppercase mt-1">{v.category}</div>
                  </div>
                  <div className="flex items-center gap-4 font-sans text-[12px] text-muted">
                    {!!v.passengers && <span className="flex items-center gap-1.5"><Users size={14} /> {v.passengers}</span>}
                    {!!v.luggage && <span className="flex items-center gap-1.5"><Suitcase size={14} /> {v.luggage}</span>}
                    {!!v.rating && <span className="flex items-center gap-1.5"><Star size={14} weight="fill" /> {v.rating}</span>}
                  </div>
                  <div className="flex gap-2 mt-auto pt-2">
                    <button onClick={() => setEditingVehicle(v)} className={`${ghostBtn} flex-1 !px-3 !py-2`}><PencilSimple size={14} /> Éditer</button>
                    <button onClick={() => setToDelete({ kind: 'vehicle', id: v.id, label: v.name })} className="border border-red-500/25 text-red-400 px-3 rounded-[2px] hover:bg-red-500/10 transition-colors" aria-label="Supprimer">
                      <Trash size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SERVICES */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-display text-[26px] text-ghost">Nos services <span className="font-sans text-[13px] text-muted ml-2">{services.length}</span></h2>
            <button onClick={() => setEditingService({})} className={primaryBtn}><Plus size={14} weight="bold" /> Ajouter</button>
          </div>
          <div className="flex flex-col gap-3">
            {services.length === 0 ? (
              <div className="p-8 text-center bg-ink border border-white/10 rounded-[2px] font-sans text-[14px] text-muted">Aucun service.</div>
            ) : services.map(s => (
              <div key={s.id} className="bg-ink border border-white/10 rounded-[2px] hover:border-white/20 transition-colors p-5 flex items-start gap-5">
                <div className="font-display text-[34px] leading-none text-muted/50 w-12 shrink-0">{s.number}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-sans font-medium text-[15px] text-ghost">{s.title}</div>
                  {s.titleEn && <div className="font-sans text-[12px] text-muted/70">{s.titleEn}</div>}
                  <div className="font-sans text-[12px] text-muted mt-1">{s.price}{s.priceEn ? ` · ${s.priceEn}` : ''}</div>
                  {s.description && <p className="font-sans text-[13px] text-muted/80 mt-3 line-clamp-2">{s.description}</p>}
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button onClick={() => setEditingService(s)} className={`${ghostBtn} !px-3 !py-2`}><PencilSimple size={14} /> Éditer</button>
                  <button onClick={() => setToDelete({ kind: 'service', id: s.id, label: s.title })} className="inline-flex items-center justify-center gap-2 border border-red-500/25 text-red-400 text-[12px] px-3 py-2 rounded-[2px] hover:bg-red-500/10 transition-colors">
                    <Trash size={14} /> Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* Vehicle editor */}
      <Modal open={!!editingVehicle} onClose={() => setEditingVehicle(null)} title={editingVehicle?.id ? 'Éditer le véhicule' : 'Ajouter un véhicule'}>
        {editingVehicle && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Nom (FR)</label>
                <input type="text" placeholder="ex: Mercedes Classe S" value={editingVehicle.name || ''} onChange={e => setEditingVehicle({ ...editingVehicle, name: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Nom (EN)</label>
                <input type="text" placeholder="ex: Mercedes S-Class" value={editingVehicle.nameEn || ''} onChange={e => setEditingVehicle({ ...editingVehicle, nameEn: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Catégorie (FR)</label>
                <input type="text" placeholder="ex: Berline de Luxe" value={editingVehicle.category || ''} onChange={e => setEditingVehicle({ ...editingVehicle, category: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Catégorie (EN)</label>
                <input type="text" placeholder="ex: Luxury Sedan" value={editingVehicle.categoryEn || ''} onChange={e => setEditingVehicle({ ...editingVehicle, categoryEn: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Passagers</label>
                <input type="text" placeholder="3" value={editingVehicle.passengers || ''} onChange={e => setEditingVehicle({ ...editingVehicle, passengers: parseInt(e.target.value) || 0 })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Bagages</label>
                <input type="text" placeholder="2" value={editingVehicle.luggage || ''} onChange={e => setEditingVehicle({ ...editingVehicle, luggage: parseInt(e.target.value) || 0 })} className={inputClass} />
              </div>
              <div className="col-span-2">
                <label className={labelClass}>Note</label>
                <input type="text" placeholder="4.9" value={editingVehicle.rating || ''} onChange={e => setEditingVehicle({ ...editingVehicle, rating: parseFloat(e.target.value) || 0 })} className={inputClass} />
              </div>
              <div className="col-span-2">
                <label className={labelClass}>Description</label>
                <textarea value={editingVehicle.description || ''} onChange={e => setEditingVehicle({ ...editingVehicle, description: e.target.value })} className={`${inputClass} h-24 resize-none`} />
              </div>
              <div className="col-span-2">
                <label className={labelClass}>URL de l&apos;image</label>
                <input type="text" placeholder="/images/car.png" value={editingVehicle.image || ''} onChange={e => setEditingVehicle({ ...editingVehicle, image: e.target.value })} className={inputClass} />
                {editingVehicle.image && (
                  <div className="mt-3 h-28 bg-offblack border border-white/10 flex items-center justify-center p-2">
                    <img src={editingVehicle.image} alt="" className="max-h-full max-w-full object-contain" />
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-8">
              <button onClick={() => setEditingVehicle(null)} className={ghostBtn}>Annuler</button>
              <button onClick={saveVehicle} disabled={saving} className={primaryBtn}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
            </div>
          </>
        )}
      </Modal>

      {/* Service editor */}
      <Modal open={!!editingService} onClose={() => setEditingService(null)} title={editingService?.id ? 'Éditer le service' : 'Ajouter un service'}>
        {editingService && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className={labelClass}>Titre (FR)</label>
                <input type="text" placeholder="ex: Transfert Aéroport" value={editingService.title || ''} onChange={e => setEditingService({ ...editingService, title: e.target.value })} className={inputClass} />
              </div>
              <div className="col-span-2">
                <label className={labelClass}>Titre (EN)</label>
                <input type="text" placeholder="ex: Airport Transfer" value={editingService.titleEn || ''} onChange={e => setEditingService({ ...editingService, titleEn: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Prix (FR)</label>
                <input type="text" placeholder="ex: À partir de 600 MAD" value={editingService.price || ''} onChange={e => setEditingService({ ...editingService, price: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Prix (EN)</label>
                <input type="text" placeholder="ex: From 600 MAD" value={editingService.priceEn || ''} onChange={e => setEditingService({ ...editingService, priceEn: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Numéro</label>
                <input type="text" placeholder="01" value={editingService.number || ''} onChange={e => setEditingService({ ...editingService, number: e.target.value })} className={inputClass} />
              </div>
              <div className="col-span-2">
                <IconPicker value={editingService.icon} onChange={icon => setEditingService({ ...editingService, icon: icon as any })} />
              </div>
              <div className="col-span-2">
                <label className={labelClass}>Description (FR)</label>
                <textarea value={editingService.description || ''} onChange={e => setEditingService({ ...editingService, description: e.target.value })} className={`${inputClass} h-24 resize-none`} />
              </div>
              <div className="col-span-2">
                <label className={labelClass}>Description (EN)</label>
                <textarea value={editingService.descriptionEn || ''} onChange={e => setEditingService({ ...editingService, descriptionEn: e.target.value })} className={`${inputClass} h-24 resize-none`} />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-8">
              <button onClick={() => setEditingService(null)} className={ghostBtn}>Annuler</button>
              <button onClick={saveService} disabled={saving} className={primaryBtn}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
            </div>
          </>
        )}
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title={toDelete?.kind === 'vehicle' ? 'Supprimer le véhicule' : 'Supprimer le service'}
        message={`Supprimer « ${toDelete?.label || ''} » ? Il disparaîtra aussi du site.`}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
