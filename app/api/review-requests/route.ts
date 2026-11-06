// Daily job (Vercel Cron, see vercel.json): e-mails a review request to customers who
// gave an e-mail address, once their trip has ended. Protected by CRON_SECRET; Vercel
// sends it automatically as "Authorization: Bearer <CRON_SECRET>".
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/server/firebaseAdmin';
import { bookingInterval } from '@/lib/bookings';
import { Reservation } from '@/lib/store/types';
import { firstNameOf, isValidEmail, newReviewDoc, reviewMessage, withReviewDefaults } from '@/lib/reviewTemplates';
import { randomBytes } from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_PER_RUN = 50;
const LOOKBACK_DAYS = 7;

const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

const ALPHABET = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const newToken = () => Array.from(randomBytes(32), b => ALPHABET[b % ALPHABET.length]).join('');

function emailHtml(lang: 'fr' | 'en', text: string, link: string) {
  const en = lang === 'en';
  const stars = [1, 2, 3, 4, 5]
    .map(n => `<a href="${esc(link)}?n=${n}" style="text-decoration:none;font-size:30px;color:#c9a96e;padding:0 3px">&#9733;</a>`)
    .join('');
  return `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;color:#222">
      <p style="font-size:15px;line-height:1.6">${esc(text.replace(link, '').trim())}</p>
      <p style="margin:22px 0 6px;font-size:13px;color:#666">${en ? 'Tap a star to rate your ride:' : 'Touchez une étoile pour noter votre course :'}</p>
      <div style="margin-bottom:22px">${stars}</div>
      <p><a href="${esc(link)}" style="background:#111;color:#fff;padding:12px 18px;text-decoration:none;display:inline-block">${en ? 'Give my feedback' : 'Donner mon avis'}</a></p>
      <p style="font-size:11px;color:#999;margin-top:28px">Apexia Transport</p>
    </div>`;
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const db = adminDb();
  if (!db) return NextResponse.json({ ok: false, reason: 'not-configured' }, { status: 503 });

  const settings = withReviewDefaults((await db.collection('settings').doc('reviews').get()).data());
  if (!settings.autoEmail) return NextResponse.json({ ok: true, skipped: 'disabled' });

  const dryRun = process.env.ALERT_DRY_RUN === 'true';
  const apiKey = process.env.RESEND_API_KEY;
  if (!dryRun && !apiKey) return NextResponse.json({ ok: false, reason: 'email-not-configured' }, { status: 503 });

  // Single-field range query (no composite index needed); the rest is filtered here
  const since = new Date(Date.now() - LOOKBACK_DAYS * 864e5).toISOString().slice(0, 10);
  const snap = await db.collection('reservations').where('date', '>=', since).get();
  const now = Date.now();
  const due = snap.docs
    .map(d => ({ ...(d.data() as Reservation), id: d.id }))
    .filter(r => {
      if (r.status !== 'confirmed' || r.reviewToken || r.reviewRequestedAt || (r as any).anonymizedAt) return false;
      if (!isValidEmail(r.email)) return false;
      const iv = bookingInterval(r);
      return !!iv && iv.end.getTime() + 2 * 3600e3 <= now;
    })
    .slice(0, MAX_PER_RUN);

  const services = new Map((await db.collection('services').get()).docs.map(d => [d.id, d.data()]));
  const siteUrl = (process.env.SITE_URL || req.nextUrl.origin).replace(/\/$/, '');
  const results: { ref?: string; ok: boolean }[] = [];

  for (const r of due) {
    const token = newToken();
    const resRef = db.collection('reservations').doc(r.id);
    const revRef = db.collection('reviews').doc(token);
    const lang = r.lang === 'en' ? 'en' : 'fr';
    const s = services.get(r.service);
    const serviceTitle = String((lang === 'en' && s?.titleEn) || s?.title || r.service);

    // Claim the booking atomically so a customer is never e-mailed twice
    const claimed = await db.runTransaction(async tx => {
      const cur = await tx.get(resRef);
      if (!cur.exists || cur.data()!.reviewToken || cur.data()!.reviewRequestedAt) return false;
      tx.set(revRef, newReviewDoc(r, serviceTitle, 'email', 'automatique'));
      tx.update(resRef, { reviewToken: token, reviewRequestedAt: new Date().toISOString() });
      return true;
    });
    if (!claimed) continue;

    const link = `${siteUrl}/avis/${token}`;
    const text = reviewMessage(settings, lang, { prenom: firstNameOf(r.fullName), ref: r.ref || '', lien: link });
    const subject = lang === 'en' ? `How was your ride ${r.ref || ''}?`.replace(' ?', '?') : `Comment s'est passée votre course ${r.ref || ''} ?`;

    if (dryRun) {
      console.log('[review-requests] dry run', { ref: r.ref, subject, link });
      results.push({ ref: r.ref, ok: true });
      continue;
    }
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.REVIEW_EMAIL_FROM || process.env.ALERT_EMAIL_FROM || 'Apexia Transport <onboarding@resend.dev>',
        to: [r.email],
        subject,
        html: emailHtml(lang, text, link),
        text,
      }),
    });
    if (!res.ok) {
      console.error('[review-requests] e-mail failed', r.ref, res.status, await res.text());
      // Release the claim so the next run (or the team, on WhatsApp) can retry
      await revRef.delete();
      await resRef.update({ reviewToken: null, reviewRequestedAt: null });
      results.push({ ref: r.ref, ok: false });
      continue;
    }
    results.push({ ref: r.ref, ok: true });
  }

  // Never return customer data: references and outcome only
  return NextResponse.json({ ok: true, dryRun, checked: snap.size, sent: results.filter(x => x.ok).length, results });
}
