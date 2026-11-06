// E-mails the team when a customer books on the website.
// Called by the booking form right after it saves the reservation. Safe to expose:
// it only ever e-mails about a reservation that really exists, is still pending,
// was created in the last 15 minutes and has not been alerted yet, so it cannot be
// used to spam the inbox with made-up content.
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/server/firebaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_AGE_MS = 15 * 60 * 1000;

const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

export async function POST(req: NextRequest) {
  let id = '';
  try {
    const body = await req.json();
    id = typeof body?.id === 'string' ? body.id : '';
  } catch { /* invalid JSON */ }
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) return NextResponse.json({ ok: false }, { status: 400 });

  const db = adminDb();
  if (!db) return NextResponse.json({ ok: false, reason: 'not-configured' }, { status: 503 });

  const ref = db.collection('reservations').doc(id);
  // Claim the alert atomically so a booking is never e-mailed twice
  const booking = await db.runTransaction(async tx => {
    const snap = await tx.get(ref);
    if (!snap.exists) return null;
    const d = snap.data()!;
    const age = Date.now() - Date.parse(d.createdAt || '');
    if (d.status !== 'pending' || d.alertSentAt || !(age >= 0 && age < MAX_AGE_MS)) return null;
    tx.update(ref, { alertSentAt: new Date().toISOString() });
    return d;
  });
  if (!booking) return NextResponse.json({ ok: true, skipped: true });

  // Recipients: ALERT_EMAIL_TO (comma-separated), otherwise the booking e-mail from Paramètres
  let to = (process.env.ALERT_EMAIL_TO || '').split(',').map(s => s.trim()).filter(Boolean);
  if (!to.length) {
    const contact = (await db.collection('settings').doc('contact').get()).data();
    if (contact?.emailBooking) to = [contact.emailBooking];
  }

  const siteUrl = process.env.SITE_URL || req.nextUrl.origin;
  const rows: [string, unknown][] = [
    ['Référence', booking.ref], ['Client', booking.fullName], ['Téléphone', booking.phone],
    ['Service', booking.service], ['Véhicule', booking.vehicle],
    ['Date', `${booking.date} à ${booking.time}`], ['Départ', booking.pickup], ['Arrivée', booking.destination],
    ['Passagers', booking.passengers], ['Bagages', booking.luggage], ['Vol', booking.flightNumber],
    ['Adresse', booking.address], ['Message', booking.message],
  ];
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px">
      <h2 style="margin:0 0 12px">Nouvelle réservation ${esc(booking.ref)}</h2>
      <table style="border-collapse:collapse;width:100%">
        ${rows.filter(([, v]) => v !== undefined && v !== null && v !== '').map(([k, v]) =>
          `<tr><td style="padding:6px 10px;color:#666;border-bottom:1px solid #eee">${esc(k)}</td><td style="padding:6px 10px;border-bottom:1px solid #eee">${esc(v)}</td></tr>`).join('')}
      </table>
      <p style="margin-top:18px"><a href="${esc(siteUrl)}/admin/reservations" style="background:#111;color:#fff;padding:10px 16px;text-decoration:none">Ouvrir le tableau de bord</a></p>
    </div>`;
  const subject = `Nouvelle réservation ${booking.ref} · ${booking.fullName} · ${booking.date} ${booking.time}`;

  if (process.env.ALERT_DRY_RUN === 'true') {
    console.log('[booking-alert] dry run', { to, subject });
    return NextResponse.json({ ok: true, dryRun: true, to, subject });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !to.length) {
    await ref.update({ alertSentAt: null }); // release the claim so it can be retried once configured
    return NextResponse.json({ ok: false, reason: 'email-not-configured' }, { status: 503 });
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.ALERT_EMAIL_FROM || 'Apexia Réservations <onboarding@resend.dev>',
      to,
      subject,
      html,
    }),
  });
  if (!res.ok) {
    console.error('[booking-alert] e-mail failed', res.status, await res.text());
    await ref.update({ alertSentAt: null });
    return NextResponse.json({ ok: false, reason: 'email-failed' }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
