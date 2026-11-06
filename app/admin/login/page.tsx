'use client';
import { useState, FormEvent } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Eye, EyeSlash, SignIn, Warning } from '@phosphor-icons/react';
import { USE_EMULATOR } from '@/lib/firebase';

export default function LoginPage() {
  const { signIn, signOut, user, isAdmin, loading: authLoading } = useAuth();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // The layout redirects to the dashboard once the team entry is confirmed
      await signIn(email, password);
    } catch (err: any) {
      // Tell "wrong credentials" apart from "can't reach the login server"
      const code: string = err?.code || '';
      if (code === 'auth/network-request-failed') {
        setError(USE_EMULATOR
          ? "Serveur de test injoignable. Lancez « npm run emulators » puis réessayez."
          : 'Connexion impossible. Vérifiez votre connexion internet.');
      } else if (code === 'auth/too-many-requests') {
        setError('Trop de tentatives. Patientez quelques minutes avant de réessayer.');
      } else {
        setError(USE_EMULATOR
          ? 'Identifiants incorrects. En mode test, seul le compte de test fonctionne (voir scripts/seed-emulator.cjs).'
          : 'Email ou mot de passe incorrect. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-offblack flex items-center justify-center p-6">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold/[0.03] rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="font-display text-[32px] text-ghost tracking-logo uppercase">APEXIA</div>
          <div className="font-sans text-[10px] text-gold/60 tracking-label uppercase mt-2">Panneau administrateur</div>
        </div>

        {USE_EMULATOR && (
          <div className="mb-5 p-4 border border-amber-400/40 bg-amber-400/10 rounded-[2px] font-sans text-[12px] text-amber-100 leading-relaxed">
            <div className="font-semibold text-[12px] text-amber-200 mb-1">Mode test (données fictives)</div>
            Connectez-vous avec le <b>compte de test</b> indiqué en haut de <code>scripts/seed-emulator.cjs</code>.
            Vos identifiants réels ne fonctionnent pas ici.
          </div>
        )}

        {/* Signed in, but this account is not on the team list (or was deactivated) */}
        {!authLoading && user && !isAdmin && (
          <div className="mb-5 p-4 border border-red-500/30 bg-red-500/10 rounded-[2px] font-sans text-[13px] text-red-200 leading-relaxed">
            Le compte <b>{user.email}</b> n&apos;a pas accès au panneau. Demandez au propriétaire de vous ajouter dans « Équipe ».
            <button type="button" onClick={signOut} className="block mt-2 underline text-red-100">Se déconnecter</button>
          </div>
        )}

        {/* Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-ink border border-gold/10 rounded-[2px] p-8 flex flex-col gap-5"
        >
          <div>
            <label className="block font-sans text-[12px] text-muted mb-2">
              Adresse e-mail
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              className="w-full bg-offblack border border-gold/15 rounded-[2px] px-4 py-3 font-sans text-[14px] text-ghost placeholder:text-muted/40 outline-none focus:border-gold/40 transition-colors"
            />
          </div>

          <div>
            <label className="block font-sans text-[12px] text-muted mb-2">
              Mot de passe
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPw ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-offblack border border-gold/15 rounded-[2px] px-4 py-3 pr-12 font-sans text-[14px] text-ghost placeholder:text-muted/40 outline-none focus:border-gold/40 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ghost transition-colors"
              >
                {showPw ? <EyeSlash size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-[2px] px-4 py-3">
              <Warning size={16} className="text-red-400 mt-0.5 shrink-0" />
              <p className="font-sans text-[13px] text-red-400">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            id="login-submit"
            type="submit"
            disabled={loading}
            className="mt-2 flex items-center justify-center gap-2 bg-gold text-offblack font-sans font-semibold text-[13px] py-3 rounded-[2px] hover:bg-goldpale transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-offblack/30 border-t-offblack rounded-full animate-spin" />
                Connexion...
              </span>
            ) : (
              <>
                <SignIn size={16} />
                Se connecter
              </>
            )}
          </button>
        </form>

        <p className="text-center font-sans text-[12px] text-muted/50 mt-6">
          Accès réservé — Apexia Transport
        </p>
      </div>
    </div>
  );
}
