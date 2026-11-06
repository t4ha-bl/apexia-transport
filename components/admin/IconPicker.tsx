'use client';
import { useMemo, useState } from 'react';
import * as Phosphor from '@phosphor-icons/react';
import { CaretDown, MagnifyingGlass, Star } from '@phosphor-icons/react';
import { inputClass, labelClass } from './ui';

const icons = Phosphor as unknown as Record<string, React.ComponentType<{ size?: number; weight?: 'regular' | 'fill' }>>;

// Every icon component in the library (the package also re-exports each one as "<Name>Icon")
const ALL_ICONS = Object.keys(Phosphor)
  .filter(k => /^[A-Z]/.test(k) && !k.endsWith('Icon') && !['IconContext', 'IconBase', 'SSR'].includes(k))
  .filter(k => {
    const v = (Phosphor as any)[k];
    return typeof v === 'function' || (v && v.render);
  })
  .sort();

// Suggestions shown before the user types anything: travel, hospitality and business
const SUGGESTED = [
  'Airplane', 'AirplaneTakeoff', 'AirplaneLanding', 'AirplaneInFlight', 'AirplaneTilt', 'Car', 'CarProfile', 'CarSimple',
  'Taxi', 'Bus', 'Van', 'Train', 'Boat', 'Compass', 'MapPin', 'MapPinLine', 'MapTrifold', 'NavigationArrow', 'Path',
  'Signpost', 'Suitcase', 'SuitcaseRolling', 'Briefcase', 'Buildings', 'Building', 'Handshake', 'Clock', 'Timer',
  'CalendarBlank', 'CalendarCheck', 'Star', 'Crown', 'Diamond', 'DiamondsFour', 'Medal', 'Trophy', 'Heart', 'Gift',
  'Confetti', 'Champagne', 'Wine', 'Martini', 'ForkKnife', 'Coffee', 'Bed', 'Key', 'ShieldCheck', 'Shield', 'Lock',
  'Phone', 'Headset', 'ChatCircle', 'Users', 'UsersThree', 'UserCircle', 'Cake', 'MusicNotes', 'Camera', 'Mountains',
  'Sun', 'TreePalm', 'Globe', 'GlobeHemisphereWest', 'Flag', 'Ticket', 'IdentificationCard', 'Package', 'Truck',
  'GasPump', 'Lightning', 'WifiHigh', 'Sparkle', 'ThumbsUp', 'CheckCircle', 'Info', 'Question', 'Armchair', 'Bag',
  'BatteryCharging',
].filter(n => ALL_ICONS.includes(n));

const MAX_RESULTS = 120;

// Splits "AirplaneTakeoff" into "airplane takeoff" so searching either word works
const searchable = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase();

export default function IconPicker({ value, onChange }: { value?: string; onChange: (name: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const SelectedIcon = (value && icons[value]) || Star;
  const known = !!(value && icons[value]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SUGGESTED;
    return ALL_ICONS.filter(n => searchable(n).includes(q)).slice(0, MAX_RESULTS);
  }, [query]);

  return (
    <div>
      <label className={labelClass}>Icône</label>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`${inputClass} flex items-center gap-3 text-left hover:border-white/30`}
      >
        <SelectedIcon size={22} />
        <span className="flex-1 truncate">
          {value ? value : <span className="text-muted/50">Choisir une icône…</span>}
          {value && !known && <span className="text-red-400 ml-2 text-[12px]">(introuvable, icône par défaut affichée)</span>}
        </span>
        <CaretDown size={14} className={`text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-2 border border-white/10 bg-offblack rounded-[2px] p-3">
          <div className="relative mb-3">
            <MagnifyingGlass size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Rechercher en anglais : car, plane, star, gift, key…"
              className={`${inputClass} pl-10 !py-2 !text-[13px]`}
            />
          </div>

          <div className="font-sans text-[12px] text-muted mb-2">
            {query.trim() ? `${results.length}${results.length === MAX_RESULTS ? '+' : ''} résultat(s)` : 'Suggestions'}
          </div>

          <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-60 overflow-y-auto pr-1">
            {results.map(name => {
              const Icon = icons[name];
              const selected = name === value;
              return (
                <button
                  key={name}
                  type="button"
                  title={name}
                  onClick={() => { onChange(name); setOpen(false); setQuery(''); }}
                  className={`aspect-square flex items-center justify-center rounded-[2px] border transition-colors ${
                    selected
                      ? 'bg-ghost text-offblack border-ghost'
                      : 'border-white/10 text-ghost hover:border-white/50 hover:bg-white/[0.05]'
                  }`}
                >
                  <Icon size={22} weight={selected ? 'fill' : 'regular'} />
                </button>
              );
            })}
            {results.length === 0 && (
              <div className="col-span-full py-6 text-center font-sans text-[13px] text-muted">Aucune icône trouvée.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
