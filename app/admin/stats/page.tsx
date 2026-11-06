'use client';
import { useEffect, useMemo, useState } from 'react';
import { subscribeCollection } from '@/lib/firebaseUtils';
import { Reservation } from '@/lib/store/types';
import { bookingDuration, sourceLabel } from '@/lib/bookings';
import { BillingDoc, totals } from '@/lib/billing';
import { unitName } from '@/lib/fleet';
import { phoneKey } from '@/lib/customers';
import { PageHeader, useToast } from '@/components/admin/ui';
import { useAdminData } from '@/components/admin/useAdminData';

type Period = '30d' | '90d' | '12m' | 'year' | 'all';
const PERIODS: { id: Period; label: string }[] = [
  { id: '30d', label: '30 jours' }, { id: '90d', label: '3 mois' }, { id: '12m', label: '12 mois' },
  { id: 'year', label: 'Cette année' }, { id: 'all', label: 'Tout' },
];

// Single series charts: one neutral ink for every bar; the bar that matters (the current
// period) is the only one in full white, so the eye lands on it first
const BAR = 'bg-muted';
const BAR_LEAD = 'bg-ghost';
const BAR_HOVER = 'bg-white';

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const mad = (n: number) => `${Math.round(n).toLocaleString('fr-FR')} MAD`;
const pct = (n: number) => `${Math.round(n * 100)} %`;

interface Datum { label: string; value: number; display: string; sub?: string }

// ---------- Chart building blocks ----------

function ChartCard({ title, note, rows, columns, children }: {
  title: string; note?: string; rows: Datum[]; columns: [string, string]; children: React.ReactNode;
}) {
  const [table, setTable] = useState(false);
  return (
    <section className="bg-ink border border-white/10 rounded-[2px] p-5 flex flex-col min-w-0">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="font-sans font-medium text-[14px] text-ghost">{title}</h3>
          {note && <p className="font-sans text-[12px] text-muted mt-0.5">{note}</p>}
        </div>
        <button onClick={() => setTable(t => !t)} className="font-sans text-[12px] text-muted hover:text-ghost border border-white/10 px-2 py-1 rounded-[2px] shrink-0">
          {table ? 'Graphique' : 'Tableau'}
        </button>
      </div>
      {rows.length === 0 ? (
        <div className="py-10 text-center font-sans text-[12px] text-muted">Pas de données sur la période.</div>
      ) : table ? (
        <table className="w-full font-sans text-[12px]">
          <thead><tr className="text-muted text-left"><th className="font-normal pb-2">{columns[0]}</th><th className="font-normal pb-2 text-right">{columns[1]}</th></tr></thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((r, i) => <tr key={`${i}-${r.label}`}><td className="py-1.5 text-ghost">{r.label}</td><td className="py-1.5 text-right text-ghost tabular-nums">{r.display}{r.sub ? <span className="text-muted"> · {r.sub}</span> : null}</td></tr>)}
          </tbody>
        </table>
      ) : children}
    </section>
  );
}

// Round an axis maximum up to 1 / 2 / 2.5 / 5 x 10^n so tick labels are clean numbers
function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
}

// Vertical columns over time, with hover / focus tooltip
function ColumnChart({ data, leadLast = false }: { data: Datum[]; leadLast?: boolean }) {
  const [active, setActive] = useState<number | null>(null);
  const max = niceMax(Math.max(...data.map(d => d.value)));
  const H = 180;
  const ticks = [0, 0.5, 1];
  const GUTTER = 56; // room for the tick labels on the right
  // Show at most ~8 axis labels so they never collide
  const every = Math.ceil(data.length / 8);
  return (
    <div className="relative">
      <div className="relative" style={{ height: H }}>
        {ticks.map(t => (
          <div key={t} className="absolute left-0 border-t border-white/[0.07]" style={{ bottom: t * H, right: GUTTER - 8 }}>
            <span className="absolute -top-2 left-full pl-2 font-sans text-[11px] text-muted/70 tabular-nums whitespace-nowrap">{t === 0 ? '0' : (max * t).toLocaleString('fr-FR')}</span>
          </div>
        ))}
        <div className="absolute inset-0 flex items-end" style={{ right: GUTTER }}>
          {data.map((d, i) => (
            // The whole column slot is the hit area (>= 24px tall even for tiny values)
            <button key={`${i}-${d.label}`} type="button" aria-label={`${d.label} : ${d.display}`}
              onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)} onFocus={() => setActive(i)} onBlur={() => setActive(null)}
              className="relative flex-1 h-full flex items-end justify-center px-[1px] focus:outline-none">
              <span className={`w-full max-w-[22px] rounded-t-[4px] transition-colors ${active === i ? BAR_HOVER : leadLast && i === data.length - 1 ? BAR_LEAD : BAR}`} style={{ height: d.value > 0 ? Math.max(2, (d.value / max) * H) : 0 }} />
            </button>
          ))}
        </div>
        {active !== null && (
          <div className="absolute z-10 -translate-x-1/2 pointer-events-none bg-offblack border border-white/20 rounded-[2px] px-3 py-2 shadow-xl whitespace-nowrap"
            style={{ left: `calc(${((active + 0.5) / data.length) * 100}% - ${((active + 0.5) / data.length) * GUTTER}px)`, bottom: Math.min(H - 10, (data[active].value / max) * H + 10) }}>
            <div className="font-sans text-[12px] text-muted">{data[active].label}</div>
            <div className="font-sans text-[13px] text-ghost">{data[active].display}</div>
            {data[active].sub && <div className="font-sans text-[12px] text-muted">{data[active].sub}</div>}
          </div>
        )}
      </div>
      <div className="flex mt-2" style={{ marginRight: GUTTER }}>
        {data.map((d, i) => (
          <span key={`${i}-${d.label}`} className="flex-1 font-sans text-[11px] text-muted text-center whitespace-nowrap overflow-visible">{i % every === 0 ? d.label : ''}</span>
        ))}
      </div>
    </div>
  );
}

// Ranked horizontal bars: label, bar, value (labels are direct, so no legend needed)
function BarList({ data, max: maxOverride }: { data: Datum[]; max?: number }) {
  const max = maxOverride ?? Math.max(1, ...data.map(d => d.value));
  return (
    <ul className="flex flex-col gap-2.5">
      {data.map((d, i) => (
        <li key={`${i}-${d.label}`} className="group" title={`${d.label} : ${d.display}${d.sub ? ` · ${d.sub}` : ''}`}>
          <div className="flex justify-between gap-3 font-sans text-[12px] mb-1">
            <span className="text-ghost truncate">{d.label}</span>
            <span className="text-ghost shrink-0">{d.display}{d.sub ? <span className="text-muted"> · {d.sub}</span> : null}</span>
          </div>
          <div className="h-2 bg-white/[0.05] rounded-r-[4px]">
            <div className={`h-full rounded-r-[4px] transition-colors ${BAR} group-hover:bg-white`} style={{ width: `${Math.min(100, (d.value / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="p-5 bg-ink border border-white/10 rounded-[2px]">
      <div className="font-sans text-[12px] text-muted">{label}</div>
      <div className="font-sans font-medium text-[28px] leading-none mt-3 text-ghost">{value}</div>
      {sub && <div className="font-sans text-[12px] text-muted mt-2">{sub}</div>}
    </div>
  );
}

// ---------- Page ----------

export default function AdminStats() {
  const toast = useToast();
  const { reservations, services, vehicles, drivers, units, customers, loading } = useAdminData(msg => toast('error', msg));
  const [docs, setDocs] = useState<BillingDoc[]>([]);
  const [period, setPeriod] = useState<Period>('12m');

  useEffect(() => subscribeCollection('documents', rows => setDocs(rows as BillingDoc[]), console.error), []);

  const stats = useMemo(() => {
    const now = new Date();
    const end = iso(now);
    const startDate = new Date(now);
    if (period === '30d') startDate.setDate(now.getDate() - 29);
    else if (period === '90d') startDate.setDate(now.getDate() - 89);
    else if (period === '12m') { startDate.setMonth(now.getMonth() - 11); startDate.setDate(1); }
    else if (period === 'year') { startDate.setMonth(0); startDate.setDate(1); }
    else {
      const first = reservations.map(r => r.date).filter(Boolean).sort()[0];
      if (first) startDate.setTime(new Date(`${first}T00:00:00`).getTime());
    }
    const start = iso(startDate);
    const days = Math.max(1, Math.round((now.getTime() - startDate.getTime()) / 864e5) + 1);

    // Trips in the period (by trip date; future trips already booked count in "Tout" only)
    const inPeriod = reservations.filter(r => r.date && r.date >= start && (period === 'all' || r.date <= end));
    const active = inPeriod.filter(r => r.status !== 'cancelled');
    const confirmed = inPeriod.filter(r => r.status === 'confirmed');
    const revenue = confirmed.reduce((s, r) => s + (typeof r.price === 'number' ? r.price : 0), 0);
    const priced = confirmed.filter(r => typeof r.price === 'number');
    const decided = inPeriod.filter(r => r.status !== 'pending');

    // Time buckets: days (<= 31 d), weeks (<= 120 d) or months
    const mode = days <= 31 ? 'day' : days <= 120 ? 'week' : 'month';
    const bucketKey = (date: string) => {
      const d = new Date(`${date}T00:00:00`);
      if (mode === 'day') return date;
      if (mode === 'week') { const m = new Date(d); m.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return iso(m); }
      return date.slice(0, 7);
    };
    const bucketLabel = (key: string) => {
      const d = new Date(`${key.length === 7 ? `${key}-01` : key}T00:00:00`);
      return mode === 'month' ? d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }) : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    };
    const buckets: string[] = [];
    const cursor = new Date(startDate);
    const last = period === 'all' ? new Date(`${[...reservations.map(r => r.date), end].sort().pop()}T00:00:00`) : now;
    while (cursor <= last && buckets.length < 400) {
      const k = bucketKey(iso(cursor));
      if (!buckets.includes(k)) buckets.push(k);
      if (mode === 'month') cursor.setMonth(cursor.getMonth() + 1, 1); else cursor.setDate(cursor.getDate() + (mode === 'week' ? 7 : 1));
    }
    const revByBucket = new Map<string, number>(), countByBucket = new Map<string, number>();
    confirmed.forEach(r => revByBucket.set(bucketKey(r.date), (revByBucket.get(bucketKey(r.date)) || 0) + (r.price || 0)));
    active.forEach(r => countByBucket.set(bucketKey(r.date), (countByBucket.get(bucketKey(r.date)) || 0) + 1));
    const revenueSeries: Datum[] = buckets.map(k => ({ label: bucketLabel(k), value: revByBucket.get(k) || 0, display: mad(revByBucket.get(k) || 0), sub: `${countByBucket.get(k) || 0} course(s)` }));
    const countSeries: Datum[] = buckets.map(k => ({ label: bucketLabel(k), value: countByBucket.get(k) || 0, display: `${countByBucket.get(k) || 0} course(s)` }));

    const countBy = (key: (r: Reservation) => string, list: Reservation[]) => {
      const m = new Map<string, { n: number; rev: number }>();
      list.forEach(r => { const k = key(r); const e = m.get(k) || { n: 0, rev: 0 }; e.n += 1; if (r.status === 'confirmed' && typeof r.price === 'number') e.rev += r.price; m.set(k, e); });
      return Array.from(m.entries()).sort((a, b) => b[1].n - a[1].n);
    };
    const byService: Datum[] = countBy(r => services.find(s => s.id === r.service)?.title || r.service, active)
      .map(([label, e]) => ({ label, value: e.n, display: `${e.n}`, sub: e.rev ? mad(e.rev) : undefined }));
    const bySource: Datum[] = countBy(r => sourceLabel(r.source), active).map(([label, e]) => ({ label, value: e.n, display: `${e.n}`, sub: pct(e.n / Math.max(1, active.length)) }));
    const byVehicle: Datum[] = countBy(r => vehicles.find(v => v.id === r.vehicle)?.name || r.vehicle, active).map(([label, e]) => ({ label, value: e.n, display: `${e.n}` }));

    const WEEKDAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    const wd = new Array(7).fill(0);
    active.forEach(r => { const d = new Date(`${r.date}T00:00:00`); wd[(d.getDay() + 6) % 7] += 1; });
    const byWeekday: Datum[] = WEEKDAYS.map((label, i) => ({ label: label.slice(0, 3), value: wd[i], display: `${wd[i]} course(s)`, sub: label }));

    // Utilisation: booked hours / (days in period x 12 operating hours)
    const capacityH = Math.min(days, 366) * 12;
    const unitUse: Datum[] = units.filter(u => u.active !== false).map(u => {
      const h = active.filter(r => r.fleetUnitId === u.id).reduce((s, r) => s + bookingDuration(r) / 60, 0);
      return { label: unitName(u), value: h / capacityH, display: pct(h / capacityH), sub: `${Math.round(h)} h` };
    }).sort((a, b) => b.value - a.value);
    const driverLoad: Datum[] = drivers.filter(d => d.active !== false).map(d => {
      const jobs = active.filter(r => r.driverId === d.id);
      const h = jobs.reduce((s, r) => s + bookingDuration(r) / 60, 0);
      return { label: d.name, value: jobs.length, display: `${jobs.length} course(s)`, sub: `${Math.round(h)} h` };
    }).sort((a, b) => b.value - a.value);

    // Customers
    const activeKeys = new Set(active.map(r => phoneKey(r.phone)));
    const repeatShare = activeKeys.size ? customers.filter(c => activeKeys.has(c.key) && c.activeCount > 1).length / activeKeys.size : 0;
    const topCustomers: Datum[] = Array.from(confirmed.reduce((m, r) => {
      const k = phoneKey(r.phone); const e = m.get(k) || { name: r.fullName, rev: 0, n: 0 };
      e.rev += r.price || 0; e.n += 1; m.set(k, e); return m;
    }, new Map<string, { name: string; rev: number; n: number }>()).values())
      .filter(e => e.rev > 0).sort((a, b) => b.rev - a.rev).slice(0, 8)
      .map(e => ({ label: e.name, value: e.rev, display: mad(e.rev), sub: `${e.n} course(s)` }));

    // Booking lead time (website bookings): days between request and trip
    const leads = inPeriod.filter(r => (r.source || 'website') === 'website' && r.createdAt)
      .map(r => (new Date(`${r.date}T00:00:00`).getTime() - new Date(r.createdAt).getTime()) / 864e5).filter(n => n >= 0);
    const avgLead = leads.length ? leads.reduce((s, n) => s + n, 0) / leads.length : null;

    // Invoicing in the period
    const invoices = docs.filter(d => d.type === 'invoice' && d.status !== 'cancelled' && d.date >= start && d.date <= end);
    const invoiced = invoices.reduce((s, d) => s + totals(d).ttc, 0);
    const collected = invoices.reduce((s, d) => s + totals(d).paid, 0);

    return {
      count: active.length, revenue, avgValue: priced.length ? revenue / priced.length : 0,
      confirmRate: decided.length ? confirmed.length / decided.length : 0,
      cancelRate: inPeriod.length ? inPeriod.filter(r => r.status === 'cancelled').length / inPeriod.length : 0,
      pending: inPeriod.filter(r => r.status === 'pending').length,
      unpriced: confirmed.length - priced.length,
      repeatShare, avgLead, invoiced, collected,
      revenueSeries, countSeries, byService, bySource, byVehicle, byWeekday, unitUse, driverLoad, topCustomers, mode,
    };
  }, [reservations, services, vehicles, drivers, units, customers, docs, period]);

  const segBtn = (active: boolean) => `px-4 py-2 font-sans text-[12px] border-r border-white/10 last:border-r-0 transition-colors ${active ? 'bg-ghost text-offblack font-medium' : 'text-muted hover:text-ghost hover:bg-white/5'}`;
  const bucketWord = stats.mode === 'day' ? 'jour' : stats.mode === 'week' ? 'semaine' : 'mois';

  return (
    <div>
      <PageHeader eyebrow="Pilotage" title="Statistiques" subtitle="Calculées en direct à partir des réservations et des factures (date de la course)." />

      {/* One filter row scopes every figure below */}
      <div className="inline-flex flex-wrap border border-white/10 rounded-[2px] overflow-hidden mb-6">
        {PERIODS.map(p => <button key={p.id} onClick={() => setPeriod(p.id)} className={segBtn(period === p.id)}>{p.label}</button>)}
      </div>

      {loading ? (
        <div className="py-16 text-center font-sans text-[14px] text-muted">Chargement…</div>
      ) : (
        <div className={`flex flex-col gap-6 transition-opacity`}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Tile label="Chiffre d'affaires confirmé" value={mad(stats.revenue)} sub={stats.unpriced ? `${stats.unpriced} course(s) confirmée(s) sans prix` : undefined} />
            <Tile label="Courses" value={String(stats.count)} sub={stats.pending ? `dont ${stats.pending} en attente` : undefined} />
            <Tile label="Panier moyen" value={stats.avgValue ? mad(stats.avgValue) : '—'} />
            <Tile label="Taux de confirmation" value={pct(stats.confirmRate)} sub={`Annulations : ${pct(stats.cancelRate)}`} />
            <Tile label="Clients fidèles" value={pct(stats.repeatShare)} sub="des clients de la période ont 2+ courses" />
            <Tile label="Délai de réservation" value={stats.avgLead !== null ? `${Math.round(stats.avgLead)} j` : '—'} sub="en moyenne, demandes du site" />
            <Tile label="Facturé (TTC)" value={mad(stats.invoiced)} />
            <Tile label="Encaissé" value={mad(stats.collected)} sub={stats.invoiced ? `${pct(stats.collected / stats.invoiced)} du facturé` : undefined} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <ChartCard title={`Chiffre d'affaires par ${bucketWord}`} note="Courses confirmées avec un prix" rows={stats.revenueSeries} columns={['Période', "Chiffre d'affaires"]}>
              <ColumnChart data={stats.revenueSeries} leadLast />
            </ChartCard>
            <ChartCard title={`Courses par ${bucketWord}`} note="Hors annulations" rows={stats.countSeries} columns={['Période', 'Courses']}>
              <ColumnChart data={stats.countSeries} leadLast />
            </ChartCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <ChartCard title="Par service" rows={stats.byService} columns={['Service', 'Courses · CA']}><BarList data={stats.byService} /></ChartCard>
            <ChartCard title="Par source" note="D'où viennent les réservations" rows={stats.bySource} columns={['Source', 'Courses · part']}><BarList data={stats.bySource} /></ChartCard>
            <ChartCard title="Par véhicule demandé" rows={stats.byVehicle} columns={['Modèle', 'Courses']}><BarList data={stats.byVehicle} /></ChartCard>
            <ChartCard title="Jours les plus chargés" rows={stats.byWeekday} columns={['Jour', 'Courses']}><ColumnChart data={stats.byWeekday} /></ChartCard>
            <ChartCard title="Utilisation des véhicules" note="Heures réservées / 12 h par jour" rows={stats.unitUse} columns={['Véhicule', 'Utilisation · heures']}><BarList data={stats.unitUse} max={1} /></ChartCard>
            <ChartCard title="Charge des chauffeurs" rows={stats.driverLoad} columns={['Chauffeur', 'Courses · heures']}><BarList data={stats.driverLoad} /></ChartCard>
          </div>

          <ChartCard title="Meilleurs clients" note="Chiffre d'affaires confirmé sur la période" rows={stats.topCustomers} columns={['Client', 'CA · courses']}>
            <BarList data={stats.topCustomers} />
          </ChartCard>
        </div>
      )}
    </div>
  );
}
