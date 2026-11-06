// Operational fleet: real drivers and real vehicles (with plates), as opposed to the
// public catalogue in the `vehicles` collection that the website shows.

export interface DocItem {
  label: string;   // e.g. "Assurance", "Permis de conduire"
  expiry: string;  // YYYY-MM-DD ('' if not set)
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  languages?: string;
  active: boolean;
  documents: DocItem[];
  notes?: string;
}

export interface MaintenanceEntry {
  date: string;        // YYYY-MM-DD
  km?: number | null;
  description: string;
  cost?: number | null; // MAD
}

export interface FleetUnit {
  id: string;
  plate: string;          // immatriculation
  modelId: string;        // id in the public `vehicles` catalogue
  label?: string;         // optional nickname, e.g. "Classe S noire"
  seats?: number | null;
  year?: number | null;
  mileage?: number | null;
  active: boolean;
  documents: DocItem[];
  maintenance: MaintenanceEntry[];
  notes?: string;
}

export const DRIVER_DOC_PRESETS = ['Permis de conduire', 'Carte professionnelle', 'Visite médicale'];
export const VEHICLE_DOC_PRESETS = ['Assurance', 'Visite technique', 'Vignette', "Carte d'autorisation", 'Carte grise'];

export const SOON_DAYS = 30;

export type ExpiryState = 'expired' | 'soon' | 'ok' | 'none';

export function daysUntil(date: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(`${date}T00:00:00`);
  return Math.round((d.getTime() - today.getTime()) / 864e5);
}

export function expiryState(date: string): ExpiryState {
  const days = daysUntil(date);
  if (days === null) return 'none';
  if (days < 0) return 'expired';
  if (days <= SOON_DAYS) return 'soon';
  return 'ok';
}

// Worst state among a list of documents (for a quick badge)
export function worstExpiry(docs: DocItem[] = []): ExpiryState {
  const states = docs.map(d => expiryState(d.expiry));
  if (states.includes('expired')) return 'expired';
  if (states.includes('soon')) return 'soon';
  if (states.includes('ok')) return 'ok';
  return 'none';
}

export const unitName = (u: Pick<FleetUnit, 'plate' | 'label'>) => (u.label ? `${u.label} · ${u.plate}` : u.plate);
