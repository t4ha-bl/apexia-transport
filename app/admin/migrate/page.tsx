'use client';
import { useState } from 'react';
import { fleetData } from '@/lib/data/fleetData';
import { servicesData } from '@/lib/data/servicesData';
import { partnersData } from '@/lib/data/partnersData';
import { setDocument } from '@/lib/firebaseUtils';

const defaultContactInfo = {
  phoneOffice: '+212 5 20 72 18 33',
  phoneOfficeHours: 'Lun–Ven, 09h00–16h00',
  phoneSecondary: '+212 6 63 53 00 46',
  phoneSecondaryHours: 'Lun–Sam, 09h00–18h00',
  phoneEmergency: '+212 6 64 55 22 11',
  phoneEmergencyHours: 'Assistance 24h/24, 7j/7',
  emailContact: 'contact@apexiatransport.com',
  emailBooking: 'booking@apexiatransport.com',
  emailReclamation: 'reclamation@apexiatransport.com',
  whatsappUrl: 'https://wa.me/212664552211'
};

const defaultLegalTexts = {
  privacy: `La protection de la vie privée est une priorité chez Apexia Transport, et nous nous engageons à respecter la confidentialité des renseignements personnels que nous collectons.
Pour toute question, veuillez nous contacter : reclamation@apexiatransport.com`, 
  terms: `CONDITIONS GÉNÉRALES D'UTILISATION DES SERVICES DU SITE www.apexiatransport.com

Veuillez lire attentivement les conditions générales d'utilisation des prestations de services...`,
  slavery: `Apexia Transport reconnaît son engagement envers les normes éthiques et légales les plus élevées, y compris la lutte contre le travail forcé...`
};

export default function MigratePage() {
  const [status, setStatus] = useState<string>('Prêt à migrer');

  const handleMigrate = async () => {
    setStatus('Migration en cours...');
    try {
      // 1. Migrate Fleet
      for (const vehicle of fleetData) {
        await setDocument('vehicles', vehicle.id, vehicle);
      }
      
      // 2. Migrate Services
      for (const service of servicesData) {
        await setDocument('services', service.id, service);
      }
      
      // 3. Migrate Partners
      for (const partner of partnersData) {
        await setDocument('partners', partner.id, partner);
      }
      
      // 4. Migrate Settings
      await setDocument('settings', 'contact', defaultContactInfo);
      await setDocument('settings', 'legal', defaultLegalTexts);

      setStatus('Migration terminée avec succès ! Vous pouvez retourner voir votre tableau de bord.');
    } catch (err: any) {
      console.error(err);
      setStatus('Erreur : ' + err.message);
    }
  };

  return (
    <div className="p-8">
      <h1 className="font-display text-[32px] text-ghost mb-8">Migration des Données</h1>
      <p className="text-muted mb-8">Cette page va télécharger les anciennes données en dur (Véhicules, Services, Partenaires, Paramètres) vers Firestore.</p>
      
      <button 
        onClick={handleMigrate} 
        className="bg-gold text-offblack px-6 py-3 font-semibold rounded hover:bg-goldpale transition-colors"
      >
        Lancer la migration
      </button>

      <div className="mt-8 p-4 bg-ink border border-white/10 rounded font-mono text-[14px] text-gold">
        Statut : {status}
      </div>
    </div>
  );
}
