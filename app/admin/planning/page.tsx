'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Reservation } from '@/lib/store/types';
import { bookingInterval } from '@/lib/bookings';
import { unitName } from '@/lib/fleet';
import { PageHeader, useToast } from '@/components/admin/ui';
import ReservationForm from '@/components/admin/ReservationForm';
import { useAdminData } from '@/components/admin/useAdminData';
import { useAuth } from '@/lib/AuthContext';
import { CaretLeft, CaretRight, WarningCircle } from '@phosphor-icons/react';

type View = 'day' | 'week';
type Group = 'driver' | 'unit';

const DAY_START_H = 5;          // timeline starts at 05:00
const DAY_END_H = 24;
const PX_PER_H = 72;
const TIMELINE_W = (DAY_END_H - DAY_START_H) * PX_PER_H;
const UNASSIGNED = '__none__';

// Local-date helpers (bookings store local dates as YYYY-MM-DD)
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const parseDay = (s: string) => new Date(`${s}T00:00:00`);
const addDays = (s: string, n: number) => { const d = parseDay(s); d.setDate(d.getDate() + n); return iso(d); };
const mondayOf = (s: string) => { const d = parseDay(s); const wd = (d.getDay() + 6) % 7; d.setDate(d.getDate() - wd); return iso(d); };

interface Job { r: Reservation; start: Date; end: Date; lane: string; conflict: boolean; row: number }

const jobStyle = (j: Job) => {
  const base = j.r.status === 'confirmed'
    ? 'bg-ghost text-offblack border-ghost'
    : j.r.status === 'cancelled'
      ? 'bg-transparent text-muted border-white/15 line-through opacity-60'
      : 'bg-white/[0.06] text-ghost border-dashed border-white/40';
  return `${base} ${j.conflict ? '!border-red-500 ring-1 ring-red-500' : ''}`;
};

export default function AdminPlanning() {
  const toast = useToast();
  const { reservations, drivers, units, services, vehicles, loading } = useAdminData(msg => toast('error', msg));
  const canEdit = useAuth().can('reservations.write'); // read-only planning for the accountant
  const [view, setView] = useState<View>('day');
  const [group, setGroup] = useState<Group>('driver');
  const [day, setDay] = useState(() => iso(new Date()));
  const [showCancelled, setShowCancelled] = useState(false);
  const [editing, setEditing] = useState<Reservation | null>(null);
  const [now, setNow] = useState(() => new Date());

  // Keep the "now" marker moving
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(t); }, []);

  const rangeStart = view === 'day' ? day : mondayOf(day);
  const days = view === 'day' ? [day] : Array.from({ length: 7 }, (_, i) => addDays(rangeStart, i));
  const rangeEnd = addDays(days[days.length - 1], 1);

  // Rows: active drivers / vehicles, plus any referenced by a booking, plus "unassigned"
  const lanes = useMemo(() => {
    const list = group === 'driver'
      ? drivers.filter(d => d.active !== false).map(d => ({ id: d.id, label: d.name, sub: d.phone }))
      : units.filter(u => u.active !== false).map(u => ({ id: u.id, label: unitName(u), sub: vehicles.find(v => v.id === u.modelId)?.name || '' }));
    return [...list, { id: UNASSIGNED, label: 'Non assigné', sub: '' }];
  }, [group, drivers, units, vehicles]);

  // Bookings in the visible range, placed in lanes with overlap detection
  const { jobs, conflicts, unassigned } = useMemo(() => {
    const from = parseDay(rangeStart), to = parseDay(rangeEnd);
    const laneKey = (r: Reservation) => (group === 'driver' ? r.driverId : r.fleetUnitId) || UNASSIGNED;
    const list: Job[] = [];
    for (const r of reservations) {
      if (r.status === 'cancelled' && !showCancelled) continue;
      const iv = bookingInterval(r);
      if (!iv || iv.end <= from || iv.start >= to) continue;
      list.push({ r, start: iv.start, end: iv.end, lane: laneKey(r), conflict: false, row: 0 });
    }
    list.sort((a, b) => a.start.getTime() - b.start.getTime());
    // Overlaps inside the same (assigned) lane are conflicts; also pack overlapping jobs into sub-rows
    const byLane = new Map<string, Job[]>();
    list.forEach(j => { const arr = byLane.get(j.lane) || []; arr.push(j); byLane.set(j.lane, arr); });
    byLane.forEach((arr, lane) => {
      const rowEnds: number[] = [];
      arr.forEach(j => {
        let row = rowEnds.findIndex(end => end <= j.start.getTime());
        if (row === -1) { row = rowEnds.length; rowEnds.push(0); }
        rowEnds[row] = j.end.getTime();
        j.row = row;
      });
      if (lane === UNASSIGNED) return;
      arr.forEach(a => arr.forEach(b => {
        if (a !== b && a.r.status !== 'cancelled' && b.r.status !== 'cancelled' && a.start < b.end && b.start < a.end) a.conflict = true;
      }));
    });
    // Bookings pointing to a deleted driver/vehicle still need a row
    const known = new Set(lanes.map(l => l.id));
    list.forEach(j => { if (!known.has(j.lane)) j.lane = UNASSIGNED; });
    return {
      jobs: list,
      conflicts: list.filter(j => j.conflict).length,
      unassigned: list.filter(j => j.lane === UNASSIGNED && j.r.status !== 'cancelled').length,
    };
  }, [reservations, group, rangeStart, rangeEnd, showCancelled, lanes]);

  const title = view === 'day'
    ? parseDay(day).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : `Semaine du ${parseDay(rangeStart).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} au ${parseDay(days[6]).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`;

  // Day view: scroll the timeline to the first job (or to "now" on an empty day)
  const timelineRef = useRef<HTMLDivElement>(null);
  const firstJobHour = jobs.length ? Math.min(...jobs.map(j => j.start.getHours() + j.start.getMinutes() / 60)) : null;
  useEffect(() => {
    if (view !== 'day' || !timelineRef.current) return;
    const target = firstJobHour ?? (day === iso(new Date()) ? new Date().getHours() : 8);
    timelineRef.current.scrollLeft = Math.max(0, (target - DAY_START_H - 1) * PX_PER_H);
  }, [view, day, firstJobHour, loading]);

  const step = (dir: number) => setDay(addDays(day, dir * (view === 'day' ? 1 : 7)));
  const segBtn = (active: boolean) => `px-4 py-2 font-sans text-[12px] border-r border-white/10 last:border-r-0 transition-colors ${active ? 'bg-ghost text-offblack font-medium' : 'text-muted hover:text-ghost hover:bg-white/5'}`;
  const nowOffset = (now.getHours() + now.getMinutes() / 60 - DAY_START_H) * PX_PER_H;

  return (
    <div>
      <PageHeader eyebrow="Opérations" title="Planning" subtitle="Qui conduit quoi, et quand. Cliquez sur une course pour la modifier ou l'assigner." />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="inline-flex border border-white/10 rounded-[2px] overflow-hidden">
          <button onClick={() => step(-1)} className="px-3 py-2 text-muted hover:text-ghost hover:bg-white/5 border-r border-white/10" aria-label="Précédent"><CaretLeft size={16} /></button>
          <button onClick={() => setDay(iso(new Date()))} className="px-4 py-2 font-sans text-[12px] text-ghost hover:bg-white/5 border-r border-white/10">Aujourd&apos;hui</button>
          <button onClick={() => step(1)} className="px-3 py-2 text-muted hover:text-ghost hover:bg-white/5" aria-label="Suivant"><CaretRight size={16} /></button>
        </div>
        <input type="date" value={day} onChange={e => e.target.value && setDay(e.target.value)}
          className="bg-offblack border border-white/10 px-3 py-2 font-sans text-[13px] text-ghost rounded-[2px] outline-none focus:border-white/40" />
        <div className="inline-flex border border-white/10 rounded-[2px] overflow-hidden">
          <button onClick={() => setView('day')} className={segBtn(view === 'day')}>Jour</button>
          <button onClick={() => setView('week')} className={segBtn(view === 'week')}>Semaine</button>
        </div>
        <div className="inline-flex border border-white/10 rounded-[2px] overflow-hidden">
          <button onClick={() => setGroup('driver')} className={segBtn(group === 'driver')}>Par chauffeur</button>
          <button onClick={() => setGroup('unit')} className={segBtn(group === 'unit')}>Par véhicule</button>
        </div>
        <label className="flex items-center gap-2 font-sans text-[12px] text-muted cursor-pointer">
          <input type="checkbox" className="accent-white" checked={showCancelled} onChange={e => setShowCancelled(e.target.checked)} /> Afficher les annulées
        </label>
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4">
        <h2 className="font-display text-[26px] text-ghost capitalize-first">{title}</h2>
        <div className="flex flex-wrap gap-4 font-sans text-[12px] text-muted">
          <span>{jobs.filter(j => j.r.status !== 'cancelled').length} course(s)</span>
          {unassigned > 0 && <span className="text-amber-300">{unassigned} non assignée(s)</span>}
          {conflicts > 0 && <span className="text-red-400 flex items-center gap-1"><WarningCircle size={14} weight="fill" /> {conflicts} en conflit</span>}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4 font-sans text-[12px] text-muted">
        <span className="flex items-center gap-2"><span className="w-3 h-3 bg-ghost rounded-[2px]" /> Confirmée</span>
        <span className="flex items-center gap-2"><span className="w-3 h-3 border border-dashed border-white/50 rounded-[2px]" /> En attente</span>
        <span className="flex items-center gap-2"><span className="w-3 h-3 border border-red-500 ring-1 ring-red-500 rounded-[2px]" /> Chevauchement</span>
      </div>

      {loading ? (
        <div className="py-16 text-center font-sans text-[14px] text-muted">Chargement…</div>
      ) : view === 'day' ? (
        <div ref={timelineRef} className="bg-ink border border-white/10 rounded-[2px] overflow-x-auto">
          <div style={{ width: 200 + TIMELINE_W }}>
            {/* Hours header */}
            <div className="flex border-b border-white/10 sticky top-0 bg-ink z-10">
              <div className="w-[200px] shrink-0 sticky left-0 bg-ink z-20 border-r border-white/10" />
              <div className="relative h-9" style={{ width: TIMELINE_W }}>
                {Array.from({ length: DAY_END_H - DAY_START_H }, (_, i) => (
                  <div key={i} className="absolute top-0 h-full border-l border-white/10 pl-1.5 pt-2 font-sans text-[12px] text-muted" style={{ left: i * PX_PER_H }}>
                    {String(DAY_START_H + i).padStart(2, '0')}:00
                  </div>
                ))}
              </div>
            </div>
            {lanes.map(lane => {
              const laneJobs = jobs.filter(j => j.lane === lane.id);
              const rows = Math.max(1, ...laneJobs.map(j => j.row + 1));
              const dayStart = parseDay(day).getTime() + DAY_START_H * 3600e3;
              return (
                <div key={lane.id} className="flex border-b border-white/5 last:border-b-0">
                  <div className="w-[200px] shrink-0 sticky left-0 bg-ink z-10 border-r border-white/10 px-4 py-3">
                    <div className={`font-sans text-[13px] ${lane.id === UNASSIGNED ? 'text-amber-300' : 'text-ghost'} truncate`}>{lane.label}</div>
                    {lane.sub && <div className="font-sans text-[12px] text-muted truncate">{lane.sub}</div>}
                  </div>
                  <div className="relative" style={{ width: TIMELINE_W, height: rows * 46 + 12 }}>
                    {Array.from({ length: DAY_END_H - DAY_START_H }, (_, i) => (
                      <div key={i} className="absolute top-0 bottom-0 border-l border-white/[0.04]" style={{ left: i * PX_PER_H }} />
                    ))}
                    {day === iso(now) && nowOffset > 0 && nowOffset < TIMELINE_W && (
                      <div className="absolute top-0 bottom-0 w-px bg-red-400/70" style={{ left: nowOffset }} />
                    )}
                    {laneJobs.length === 0 && lane.id !== UNASSIGNED && (
                      <div className="absolute inset-0 flex items-center pl-4 font-sans text-[12px] text-muted/50">Libre</div>
                    )}
                    {laneJobs.map(j => {
                      const left = Math.max(0, (j.start.getTime() - dayStart) / 3600e3 * PX_PER_H);
                      const right = Math.min(TIMELINE_W, (j.end.getTime() - dayStart) / 3600e3 * PX_PER_H);
                      return (
                        <button key={j.r.id} onClick={() => canEdit && setEditing(j.r)}
                          title={`${j.r.time} · ${j.r.fullName} · ${j.r.pickup} → ${j.r.destination}`}
                          className={`absolute text-left border rounded-[2px] px-2 py-1 overflow-hidden hover:brightness-110 transition ${jobStyle(j)}`}
                          style={{ left, width: Math.max(44, right - left - 2), top: 6 + j.row * 46, height: 40 }}>
                          <div className="font-sans text-[12px] font-medium truncate">{j.r.time} · {j.r.fullName}</div>
                          <div className="font-sans text-[11px] truncate opacity-75">{j.r.pickup} → {j.r.destination}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-ink border border-white/10 rounded-[2px] overflow-x-auto">
          <div className="grid min-w-[1100px]" style={{ gridTemplateColumns: '180px repeat(7, minmax(130px, 1fr))' }}>
            <div className="border-b border-r border-white/10" />
            {days.map(d => (
              <button key={d} onClick={() => { setDay(d); setView('day'); }}
                className={`border-b border-r border-white/10 last:border-r-0 px-3 py-2 text-left font-sans text-[12px] hover:bg-white/5 ${d === iso(now) ? 'text-ghost' : 'text-muted'}`}>
                <span className="capitalize-first inline-block">{parseDay(d).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })}</span>
              </button>
            ))}
            {lanes.map(lane => (
              <div key={lane.id} className="contents">
                <div className="border-b border-r border-white/10 px-3 py-3">
                  <div className={`font-sans text-[13px] truncate ${lane.id === UNASSIGNED ? 'text-amber-300' : 'text-ghost'}`}>{lane.label}</div>
                  {lane.sub && <div className="font-sans text-[12px] text-muted truncate">{lane.sub}</div>}
                </div>
                {days.map(d => {
                  const cell = jobs.filter(j => j.lane === lane.id && iso(j.start) === d);
                  return (
                    <div key={d} className={`border-b border-r border-white/10 last:border-r-0 p-1.5 flex flex-col gap-1 min-h-[56px] ${d === iso(now) ? 'bg-white/[0.02]' : ''}`}>
                      {cell.map(j => (
                        <button key={j.r.id} onClick={() => canEdit && setEditing(j.r)} title={`${j.r.pickup} → ${j.r.destination}`}
                          className={`text-left border rounded-[2px] px-2 py-1 font-sans text-[12px] truncate hover:brightness-110 ${jobStyle(j)}`}>
                          {j.r.time} · {j.r.fullName}
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      <ReservationForm
        open={!!editing}
        reservation={editing}
        services={services}
        vehicles={vehicles}
        drivers={drivers}
        units={units}
        allReservations={reservations}
        onClose={() => setEditing(null)}
      />
    </div>
  );
}
