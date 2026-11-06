// Team roles. The real enforcement is in firestore.rules (keep both in sync);
// this file only decides what the admin UI shows.

export type Role = 'owner' | 'dispatcher' | 'accountant';

export const ROLES: { id: Role; label: string; description: string }[] = [
  { id: 'owner', label: 'Propriétaire', description: 'Accès complet, équipe, journal et données clients' },
  { id: 'dispatcher', label: 'Dispatcher', description: 'Réservations, planning, chauffeurs, véhicules, clients' },
  { id: 'accountant', label: 'Comptable', description: 'Devis, factures et statistiques (lecture des réservations)' },
];

export const roleLabel = (r?: string) => ROLES.find(x => x.id === r)?.label || '—';

// A team member, stored at `admins/{email in lowercase}`
export interface TeamMember {
  id: string;        // = lowercase e-mail
  email: string;
  name?: string;
  role: Role;
  active: boolean;
  addedAt?: string;
  addedBy?: string;
}

export type Permission =
  | 'reservations.write' | 'reservations.delete'
  | 'fleet.write' | 'customers.write'
  | 'billing' | 'stats'
  | 'catalog.write' | 'settings'
  | 'team' | 'activity' | 'privacy' | 'reviews';

const MATRIX: Record<Role, Permission[]> = {
  owner: ['reservations.write', 'reservations.delete', 'fleet.write', 'customers.write', 'billing', 'stats', 'catalog.write', 'settings', 'team', 'activity', 'privacy', 'reviews'],
  dispatcher: ['reservations.write', 'fleet.write', 'customers.write', 'reviews'],
  accountant: ['billing', 'stats'],
};

export const can = (role: Role | null | undefined, p: Permission) => !!role && MATRIX[role].includes(p);

// Which permission each admin page needs (pages not listed are open to the whole team)
export const PAGE_PERMISSION: Record<string, Permission> = {
  '/admin/documents': 'billing',
  '/admin/stats': 'stats',
  '/admin/services': 'catalog.write',
  '/admin/team': 'team',
  '/admin/activity': 'activity',
  '/admin/reviews': 'reviews',
};
