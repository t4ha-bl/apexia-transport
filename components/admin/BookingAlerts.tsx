'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { subscribePendingReservations } from '@/lib/firebaseUtils';
import { useToast } from './ui';

const BASE_TITLE = 'Apexia · Admin';

// Short two-note chime generated in the browser (no audio file to download)
function chime() {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new Ctx();
    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.4);
    });
    setTimeout(() => ctx.close(), 1200);
  } catch { /* audio not available */ }
}

// Watches for new website bookings while any admin page is open:
// chime + toast + desktop notification, pending count in the tab title and sidebar.
export default function BookingAlerts({ onCount }: { onCount: (n: number) => void }) {
  const toast = useToast();
  const router = useRouter();
  const onCountRef = useRef(onCount);
  onCountRef.current = onCount;

  useEffect(() => {
    const unsub = subscribePendingReservations(
      (rows, added) => {
        onCountRef.current(rows.length);
        document.title = rows.length ? `(${rows.length}) ${BASE_TITLE}` : BASE_TITLE;
        if (!added.length) return;
        chime();
        added.forEach(r => {
          const text = `${r.fullName} · ${r.date} ${r.time}`;
          toast('success', `Nouvelle réservation ${r.ref} : ${text}`);
          if ('Notification' in window && Notification.permission === 'granted') {
            const n = new Notification(`Nouvelle réservation ${r.ref}`, { body: `${text}\n${r.pickup} → ${r.destination}`, tag: r.id });
            n.onclick = () => { window.focus(); router.push('/admin/reservations'); n.close(); };
          }
        });
      },
      err => console.error('Booking alerts unavailable', err)
    );
    return () => { unsub(); document.title = BASE_TITLE; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
