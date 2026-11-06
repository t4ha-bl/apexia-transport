'use client';
import { useEffect, useRef, useState } from 'react';
import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Star, GoogleLogo, CheckCircle } from '@phosphor-icons/react';
import { db } from '@/lib/firebase';
import { useTranslation } from '@/lib/i18n/useTranslation';
import { useStore } from '@/lib/store/dataStore';
import LanguageToggle from '@/components/layout/LanguageToggle';
import { Review } from '@/lib/reviewTemplates';

// Public page opened from the review request sent after a trip. The customer rates the
// ride once; the Google review link is then offered to everyone, whatever the rating
// (Google forbids filtering who is invited to review).
export default function ReviewPage({ params }: { params: { token: string } }) {
  const { t, lang } = useTranslation();
  const setLang = useStore(s => s.setLang);
  const [review, setReview] = useState<Review | null>(null);
  const [state, setState] = useState<'loading' | 'form' | 'done' | 'invalid'>('loading');
  const [googleUrl, setGoogleUrl] = useState('');
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [already, setAlready] = useState(false);
  const langSet = useRef(false);

  useEffect(() => {
    if (!/^[A-Za-z0-9]{30,64}$/.test(params.token)) { setState('invalid'); return; }
    // Stars clicked in the e-mail arrive as ?n=1..5
    const n = Number(new URLSearchParams(window.location.search).get('n'));
    if (n >= 1 && n <= 5) setRating(Math.round(n));
    getDoc(doc(db, 'settings', 'reviews'))
      .then(s => {
        const url = String(s.data()?.googleUrl || '');
        if (/^https:\/\/\S+$/.test(url)) setGoogleUrl(url);
      })
      .catch(() => {});
    getDoc(doc(db, 'reviews', params.token))
      .then(snap => {
        if (!snap.exists()) { setState('invalid'); return; }
        const r = { id: snap.id, ...(snap.data() as Omit<Review, 'id'>) };
        setReview(r);
        // Open in the language the customer booked in (they can still switch)
        if (!langSet.current) { langSet.current = true; setLang(r.lang === 'en' ? 'en' : 'fr'); }
        if (typeof r.rating === 'number') { setAlready(true); setState('done'); }
        else setState('form');
      })
      .catch(() => setState('invalid')); // expired or not allowed
  }, [params.token, setLang]);

  const submit = async () => {
    if (!review || sending) return;
    if (!rating) { setError(t('review_need_rating')); return; }
    setSending(true);
    setError('');
    try {
      await updateDoc(doc(db, 'reviews', review.id), {
        rating, comment: comment.trim().slice(0, 1000), submittedAt: serverTimestamp(),
      });
      setReview({ ...review, rating, comment: comment.trim() });
      setState('done');
    } catch {
      setError(t('review_error'));
    } finally {
      setSending(false);
    }
  };

  const shell = (children: React.ReactNode) => (
    <main className="min-h-screen bg-offblack flex flex-col">
      <header className="flex items-center justify-between px-5 md:px-10 h-[72px] border-b border-white/10">
        <a href="/" aria-label="Apexia Transport">
          <img src="/images/apexia logo.png" alt="Apexia Transport" className="h-[28px] object-contain filter invert brightness-0" />
        </a>
        <LanguageToggle />
      </header>
      <div className="flex-1 flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-[520px]">{children}</div>
      </div>
    </main>
  );

  if (state === 'loading') {
    return shell(<div className="flex justify-center"><div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" /></div>);
  }

  if (state === 'invalid' || !review) {
    return shell(
      <div className="text-center">
        <h1 className="font-display text-[34px] text-ghost leading-tight">{t('review_invalid')}</h1>
        <p className="font-sans text-[14px] text-muted mt-4 leading-relaxed">{t('review_invalid_sub')}</p>
        <a href="/" className="inline-block mt-8 border border-gold text-gold font-sans text-[12px] uppercase tracking-[0.2em] px-6 py-3 hover:bg-gold hover:text-offblack transition-colors">{t('review_back')}</a>
      </div>
    );
  }

  const dateText = review.date
    ? new Date(`${review.date}T00:00:00`).toLocaleDateString(lang === 'en' ? 'en-GB' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  if (state === 'done') {
    const low = (review.rating || 0) <= 3;
    return shell(
      <div className="text-center">
        <CheckCircle size={56} weight="thin" className="text-gold mx-auto" />
        <h1 className="font-display text-[36px] text-ghost leading-tight mt-4">{t('review_thanks')}</h1>
        <p className="font-sans text-[14px] text-muted mt-4 leading-relaxed">
          {already ? t('review_already') : low ? t('review_thanks_low') : t('review_thanks_high')}
        </p>
        {googleUrl && (
          <div className="mt-10 border-t border-white/10 pt-8">
            <p className="font-sans text-[14px] text-ghost mb-5">{t('review_google')}</p>
            <a href={googleUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-3 border border-gold text-gold font-sans font-medium text-[12px] uppercase tracking-[0.2em] px-7 py-4 hover:bg-gold hover:text-offblack transition-colors">
              <GoogleLogo size={18} /> {t('review_google_btn')}
            </a>
          </div>
        )}
        <a href="/" className="block mt-10 font-sans text-[12px] text-muted hover:text-ghost uppercase tracking-[0.2em]">{t('review_back')}</a>
      </div>
    );
  }

  const shown = hover || rating;
  const intro = t('review_intro');
  return shell(
    <div>
      <div className="font-sans text-[11px] text-muted uppercase tracking-[0.25em]">Apexia Transport</div>
      <h1 className="font-display text-[38px] md:text-[44px] text-ghost leading-tight mt-2">{t('review_title')}</h1>
      <p className="font-sans text-[14px] text-muted mt-3 leading-relaxed">
        {review.firstName ? `${review.firstName}, ${intro.charAt(0).toLowerCase()}${intro.slice(1)}` : intro}{' '}<span className="text-ghost">{review.service}</span>{dateText ? ` · ${dateText}` : ''}{lang === 'fr' ? ' ?' : '?'}
      </p>

      <div className="mt-10">
        <div className="font-sans text-[13px] text-ghost mb-4">{t('review_q')}</div>
        <div className="flex gap-2" onMouseLeave={() => setHover(0)} role="radiogroup" aria-label={t('review_q')}>
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} ${t('review_stars')}`}
              onMouseEnter={() => setHover(n)}
              onClick={() => { setRating(n); setError(''); }}
              className="p-1 transition-transform duration-150 ease-brand active:scale-[0.94]"
            >
              <Star size={40} weight={n <= shown ? 'fill' : 'thin'} className={n <= shown ? 'text-gold' : 'text-white/30'} />
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-2">
        <label htmlFor="review-comment" className="font-sans font-medium text-[11px] text-muted uppercase tracking-[0.15em]">{t('review_comment')}</label>
        <textarea
          id="review-comment"
          maxLength={1000}
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder={t('review_ph_comment')}
          className="bg-offblack border border-gold/15 focus:border-gold h-32 p-4 font-sans text-[15px] text-ghost placeholder-[#666666] outline-none transition-colors resize-none"
        />
      </div>

      {error && <div className="mt-4 font-sans text-[13px] text-red-400/90">{error}</div>}

      <button
        onClick={submit}
        disabled={sending}
        className="mt-8 w-full border border-gold text-gold font-sans font-medium text-[13px] uppercase tracking-[0.2em] py-4 hover:bg-gold hover:text-offblack active:scale-[0.99] transition-colors disabled:opacity-50"
      >
        {sending ? t('review_sending') : t('review_send')}
      </button>
    </div>
  );
}
