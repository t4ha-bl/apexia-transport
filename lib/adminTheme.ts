'use client';
import { useEffect, useLayoutEffect, useState } from 'react';

// Light / dark appearance of the admin dashboard only. Saved per device (localStorage),
// so each team member chooses their own. It works by setting `data-admin-theme` on
// <html> while an admin page is open; app/globals.css swaps the colour variables.
// The public website never has the attribute, so it always stays dark.

export type AdminTheme = 'dark' | 'light';

const KEY = 'apexia-admin-theme';
const EVENT = 'apexia-admin-theme-change';

// useLayoutEffect on the client (no dark flash before paint), useEffect on the server
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export function readAdminTheme(): AdminTheme {
  try { return localStorage.getItem(KEY) === 'light' ? 'light' : 'dark'; } catch { return 'dark'; }
}

export function setAdminTheme(theme: AdminTheme) {
  try { localStorage.setItem(KEY, theme); } catch { /* private mode: still applies for this visit */ }
  window.dispatchEvent(new CustomEvent<AdminTheme>(EVENT, { detail: theme }));
}

// Current theme, kept in sync across components and browser tabs
export function useAdminTheme(): [AdminTheme, (t: AdminTheme) => void] {
  const [theme, setTheme] = useState<AdminTheme>('dark');
  useIsoLayoutEffect(() => {
    setTheme(readAdminTheme());
    const onChange = (e: Event) => setTheme((e as CustomEvent<AdminTheme>).detail);
    const onStorage = (e: StorageEvent) => { if (e.key === KEY) setTheme(readAdminTheme()); };
    window.addEventListener(EVENT, onChange);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener('storage', onStorage);
    };
  }, []);
  return [theme, setAdminTheme];
}

// Applies the theme to the page while the admin is open, and removes it on the way out
export function useApplyAdminTheme(theme: AdminTheme) {
  useIsoLayoutEffect(() => {
    const html = document.documentElement;
    if (theme === 'light') html.setAttribute('data-admin-theme', 'light');
    else html.removeAttribute('data-admin-theme');
    return () => html.removeAttribute('data-admin-theme');
  }, [theme]);
}
