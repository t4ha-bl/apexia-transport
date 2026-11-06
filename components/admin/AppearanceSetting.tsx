'use client';
import { Check } from '@phosphor-icons/react';
import { AdminTheme, useAdminTheme } from '@/lib/adminTheme';

// Light / dark appearance of the dashboard. Saved on this device only; the public
// website keeps its dark theme whatever is chosen here.
const OPTIONS: { id: AdminTheme; label: string; note: string; page: string; card: string; line: string; ink: string }[] = [
  { id: 'dark', label: 'Sombre', note: "L'apparence d'origine, comme le site", page: '#0a0a0a', card: '#111111', line: 'rgba(255,255,255,0.12)', ink: '#f4f4f4' },
  { id: 'light', label: 'Clair', note: 'Plus lisible en pleine journée', page: '#f4f4f2', card: '#ffffff', line: 'rgba(0,0,0,0.10)', ink: '#171717' },
];

export default function AppearanceSetting() {
  const [theme, setTheme] = useAdminTheme();

  return (
    <section className="bg-ink border border-white/10 rounded-[2px] mb-8">
      <div className="px-6 md:px-8 py-5 border-b border-white/10">
        <h2 className="font-display text-[26px] text-ghost">Apparence</h2>
      </div>
      <div className="p-6 md:p-8">
        <div role="radiogroup" aria-label="Apparence du tableau de bord" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {OPTIONS.map(o => {
            const active = theme === o.id;
            return (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setTheme(o.id)}
                className={`text-left border rounded-[2px] p-4 transition-colors duration-150 ease-brand focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-white/60 ${
                  active ? 'border-ghost bg-white/[0.04]' : 'border-white/10 hover:border-white/30'
                }`}
              >
                {/* A miniature of the dashboard in this theme */}
                <div className="h-20 rounded-[2px] flex overflow-hidden" style={{ background: o.page, border: `1px solid ${o.line}` }} aria-hidden="true">
                  <div className="w-1/4 h-full" style={{ background: o.card, borderRight: `1px solid ${o.line}` }} />
                  <div className="flex-1 p-3 flex flex-col gap-2">
                    <div className="h-2 w-1/2 rounded-[1px]" style={{ background: o.ink, opacity: 0.85 }} />
                    <div className="flex-1 rounded-[1px]" style={{ background: o.card, border: `1px solid ${o.line}` }} />
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="font-sans font-medium text-[14px] text-ghost">{o.label}</span>
                  {active && <Check size={16} className="text-ghost" />}
                </div>
                <div className="font-sans text-[12px] text-muted mt-1">{o.note}</div>
              </button>
            );
          })}
        </div>
        <p className="font-sans text-[12px] text-muted mt-4">
          Ce choix concerne uniquement le tableau de bord, sur cet appareil : chaque membre de l&apos;équipe choisit le sien.
          Le site public reste en noir.
        </p>
      </div>
    </section>
  );
}
