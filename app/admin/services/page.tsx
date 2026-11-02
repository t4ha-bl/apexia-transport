'use client';
import { useState, useEffect } from 'react';
import { fetchCollection, addDocument, updateDocument, removeDocument } from '@/lib/firebaseUtils';
import { Vehicle, Service } from '@/lib/store/types';

export default function AdminServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingVehicle, setEditingVehicle] = useState<Partial<Vehicle> | null>(null);
  const [editingService, setEditingService] = useState<Partial<Service> | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedServices, fetchedVehicles] = await Promise.all([
        fetchCollection('services', 'number'),
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const saveVehicle = async () => {
    if (!editingVehicle) return;
    try {
      if (editingVehicle.id && vehicles.find(v => v.id === editingVehicle.id)) {
        await updateDocument('vehicles', editingVehicle.id, editingVehicle);
      } else {
        await addDocument('vehicles', editingVehicle);
      }
      await loadData(); // Reload for safety and to get IDs
      setEditingVehicle(null);
    } catch (err) {
      console.error("Failed to save vehicle", err);
    }
  };

  const deleteVehicleDoc = async (id: string) => {
    if (!confirm("Supprimer ce véhicule ?")) return;
    try {
      await removeDocument('vehicles', id);
      setVehicles(prev => prev.filter(v => v.id !== id));
    } catch (err) {
      console.error("Failed to delete vehicle", err);
    }
  };

  const saveService = async () => {
    if (!editingService) return;
    try {
      if (editingService.id && services.find(s => s.id === editingService.id)) {
        await updateDocument('services', editingService.id, editingService);
      } else {
        await addDocument('services', editingService);
      }
      await loadData();
      setEditingService(null);
    } catch (err) {
      console.error("Failed to save service", err);
    }
  };

  const deleteServiceDoc = async (id: string) => {
    if (!confirm("Supprimer ce service ?")) return;
    try {
      await removeDocument('services', id);
      setServices(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error("Failed to delete service", err);
    }
  };

  if (loading) {
    return <div className="p-8 text-muted">Chargement des données...</div>;
  }

  return (
    <div>
      <h1 className="font-display text-[32px] text-ghost mb-8">Gestion des Services & Flotte</h1>
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* VEHICLES */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-sans font-semibold text-[16px] text-ghost">Flotte de Véhicules</h2>
            <button onClick={() => setEditingVehicle({})} className="text-[12px] bg-ghost text-offblack px-3 py-1 rounded hover:bg-goldpale transition-colors">Ajouter un véhicule</button>
          </div>
          <div className="bg-ink border border-white/10 rounded-[2px] divide-y divide-white/5">
            {vehicles.length === 0 ? (
               <div className="p-4 text-[#555]">Aucun véhicule.</div>
            ) : vehicles.map(v => (
              <div key={v.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-12 bg-[#0d0d0d] p-1"><img src={v.image} className="w-full h-full object-contain" /></div>
                  <div>
                    <div className="font-sans font-semibold text-[14px] text-ghost">{v.name}</div>
                    <div className="font-sans text-[11px] text-white/50 uppercase">{v.category}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditingVehicle(v)} className="text-[12px] text-ghost hover:text-white transition-colors border border-white/20 px-2 py-1">Éditer</button>
                  <button onClick={() => deleteVehicleDoc(v.id)} className="text-[12px] text-red-400 hover:text-red-300 transition-colors border border-red-900 px-2 py-1">Supprimer</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SERVICES */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-sans font-semibold text-[16px] text-ghost">Nos Services</h2>
            <button onClick={() => setEditingService({})} className="text-[12px] bg-ghost text-offblack px-3 py-1 rounded hover:bg-goldpale transition-colors">Ajouter un service</button>
          </div>
          <div className="bg-ink border border-white/10 rounded-[2px] divide-y divide-white/5">
           {services.length === 0 ? (
               <div className="p-4 text-[#555]">Aucun service.</div>
            ) : services.map(s => (
              <div key={s.id} className="p-4 flex flex-col md:flex-row justify-between gap-4">
                <div>
                  <div className="font-sans font-semibold text-[14px] text-ghost">{s.title}</div>
                  <div className="font-sans text-[12px] text-[#888]">{s.price}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditingService(s)} className="text-[12px] text-ghost hover:text-white transition-colors border border-white/20 px-2 py-1">Éditer</button>
                  <button onClick={() => deleteServiceDoc(s.id)} className="text-[12px] text-red-400 hover:text-red-300 transition-colors border border-red-900 px-2 py-1">Supprimer</button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Editor Modal Vehicle */}
      {editingVehicle && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-ink border border-white/10 p-6 md:p-8 w-full max-w-[600px] flex flex-col gap-4">
            <h3 className="font-display text-[24px] text-ghost">{editingVehicle.id ? 'Éditer le véhicule' : 'Ajouter un véhicule'}</h3>
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Nom (ex: Mercedes S-Class)" value={editingVehicle.name || ''} onChange={e => setEditingVehicle({...editingVehicle, name: e.target.value})} className="col-span-2 bg-offblack border border-white/10 p-2 text-ghost text-[14px]" />
              <input type="text" placeholder="Catégorie (ex: Premium Sedan)" value={editingVehicle.category || ''} onChange={e => setEditingVehicle({...editingVehicle, category: e.target.value})} className="bg-offblack border border-white/10 p-2 text-ghost text-[14px]" />
              <input type="text" placeholder="Passagers (ex: 3)" value={editingVehicle.passengers || ''} onChange={e => setEditingVehicle({...editingVehicle, passengers: parseInt(e.target.value) || 0})} className="bg-offblack border border-white/10 p-2 text-ghost text-[14px]" />
              <input type="text" placeholder="Bagages (ex: 2)" value={editingVehicle.luggage || ''} onChange={e => setEditingVehicle({...editingVehicle, luggage: parseInt(e.target.value) || 0})} className="bg-offblack border border-white/10 p-2 text-ghost text-[14px]" />
              <input type="text" placeholder="Note (ex: 4.9/5)" value={editingVehicle.rating || ''} onChange={e => setEditingVehicle({...editingVehicle, rating: parseFloat(e.target.value) || 0})} className="bg-offblack border border-white/10 p-2 text-ghost text-[14px]" />
              <textarea placeholder="Description" value={editingVehicle.description || ''} onChange={e => setEditingVehicle({...editingVehicle, description: e.target.value})} className="col-span-2 bg-offblack border border-white/10 p-2 text-ghost text-[14px] h-24" />
              <input type="text" placeholder="URL Image (ex: /images/car.png)" value={editingVehicle.image || ''} onChange={e => setEditingVehicle({...editingVehicle, image: e.target.value})} className="col-span-2 bg-offblack border border-white/10 p-2 text-ghost text-[14px]" />
            </div>
            <div className="flex gap-4 justify-end mt-4">
              <button onClick={() => setEditingVehicle(null)} className="px-4 py-2 text-muted hover:text-ghost text-[14px]">Annuler</button>
              <button onClick={saveVehicle} className="px-4 py-2 bg-ghost text-offblack font-medium text-[14px] rounded">Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* Editor Modal Service */}
      {editingService && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-ink border border-white/10 p-6 md:p-8 w-full max-w-[600px] flex flex-col gap-4">
            <h3 className="font-display text-[24px] text-ghost">{editingService.id ? 'Éditer le service' : 'Ajouter un service'}</h3>
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Titre (FR) (ex: Transfert Aéroport)" value={editingService.title || ''} onChange={e => setEditingService({...editingService, title: e.target.value})} className="col-span-2 bg-offblack border border-white/10 p-2 text-ghost text-[14px]" />
              <input type="text" placeholder="Titre (EN) (ex: Airport Transfer)" value={editingService.titleEn || ''} onChange={e => setEditingService({...editingService, titleEn: e.target.value})} className="col-span-2 bg-offblack border border-white/10 p-2 text-ghost text-[14px]" />
              <input type="text" placeholder="Prix (ex: À partir de 50€)" value={editingService.price || ''} onChange={e => setEditingService({...editingService, price: e.target.value})} className="col-span-2 bg-offblack border border-white/10 p-2 text-ghost text-[14px]" />
              <input type="text" placeholder="Numéro (ex: 01)" value={editingService.number || ''} onChange={e => setEditingService({...editingService, number: e.target.value})} className="bg-offblack border border-white/10 p-2 text-ghost text-[14px]" />
              <input type="text" placeholder="Icone (ex: AirplaneInFlight)" value={editingService.icon || ''} onChange={e => setEditingService({...editingService, icon: e.target.value as any})} className="bg-offblack border border-white/10 p-2 text-ghost text-[14px]" />
              <textarea placeholder="Description (FR)" value={editingService.description || ''} onChange={e => setEditingService({...editingService, description: e.target.value})} className="col-span-2 bg-offblack border border-white/10 p-2 text-ghost text-[14px] h-24" />
              <textarea placeholder="Description (EN)" value={editingService.descriptionEn || ''} onChange={e => setEditingService({...editingService, descriptionEn: e.target.value})} className="col-span-2 bg-offblack border border-white/10 p-2 text-ghost text-[14px] h-24" />
            </div>
            <div className="flex gap-4 justify-end mt-4">
              <button onClick={() => setEditingService(null)} className="px-4 py-2 text-muted hover:text-ghost text-[14px]">Annuler</button>
              <button onClick={saveService} className="px-4 py-2 bg-ghost text-offblack font-medium text-[14px] rounded">Enregistrer</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
