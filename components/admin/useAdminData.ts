'use client';
import { useEffect, useMemo, useState } from 'react';
import { buildCustomers, CustomerProfile } from '@/lib/customers';
import { Job } from '@/lib/jobs';
import { subscribeReservations, subscribeCollection, fetchCollection } from '@/lib/firebaseUtils';
import { Reservation, Service, Vehicle } from '@/lib/store/types';
import { Driver, FleetUnit } from '@/lib/fleet';

// Shared live data for admin pages: reservations, drivers and real vehicles update in
// real time; the catalogue (services / vehicle models) is fetched once.
export function useAdminData(onError?: (msg: string) => void) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [units, setUnits] = useState<FleetUnit[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [profiles, setProfiles] = useState<CustomerProfile[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u1 = subscribeReservations(
      rows => { setReservations(rows as Reservation[]); setLoading(false); },
      err => { console.error(err); setLoading(false); onError?.('Impossible de charger les réservations.'); }
    );
    const u2 = subscribeCollection('drivers', rows => setDrivers((rows as Driver[]).sort((a, b) => a.name.localeCompare(b.name))), console.error);
    const u3 = subscribeCollection('fleet', rows => setUnits((rows as FleetUnit[]).sort((a, b) => a.plate.localeCompare(b.plate))), console.error);
    const u4 = subscribeCollection('customers', rows => setProfiles(rows as CustomerProfile[]), console.error);
    const u5 = subscribeCollection('jobs', rows => setJobs(rows as Job[]), console.error);
    Promise.all([fetchCollection('services'), fetchCollection('vehicles')])
      .then(([s, v]) => { setServices(s as Service[]); setVehicles(v as Vehicle[]); })
      .catch(console.error);
    return () => { u1(); u2(); u3(); u4(); u5(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Customers are derived from bookings (grouped by phone) + the team's profile notes
  const customers = useMemo(() => buildCustomers(reservations, profiles), [reservations, profiles]);
  // Driver job links, by booking
  const jobsByReservation = useMemo(() => new Map(jobs.map(j => [j.reservationId, j])), [jobs]);

  return { reservations, drivers, units, services, vehicles, customers, jobsByReservation, loading };
}
