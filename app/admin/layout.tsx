'use client';
import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { CalendarBlank, Briefcase, GearSix, Globe, SignOut, List, X, CaretDoubleLeft, CaretDoubleRight } from '@phosphor-icons/react';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { ToastProvider } from '@/components/admin/ui';

// Inner layout — only rendered once auth is confirmed
function AdminShell({ children }: { children: ReactNode }) {
  const pathname        = usePathname() || '';
  const router          = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { user, loading, isAdmin, signOut } = useAuth();

  // Remember the sidebar state between visits (per browser)
  useEffect(() => {
    try { setCollapsed(localStorage.getItem('apexia-admin-sidebar') === 'collapsed'); } catch {}
  }, []);

  const toggleCollapsed = () => {
    setCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem('apexia-admin-sidebar', next ? 'collapsed' : 'expanded'); } catch {}
      return next;
    });
  };

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (loading) return;
    if (!user || !isAdmin) {
      // Not logged in → go to login
      if (!isLoginPage) router.replace('/admin/login');
    } else {
      // Logged in on login page → go to dashboard
      if (isLoginPage) router.replace('/admin/reservations');
    }
  }, [user, loading, isAdmin, isLoginPage, router]);

  // While Firebase checks auth state, show a full-screen spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-offblack flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
          <p className="font-sans text-[12px] text-muted tracking-label uppercase">Vérification...</p>
        </div>
      </div>
    );
  }

  // On the login page → show it (no sidebar)
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Not authenticated → show nothing while redirecting
  if (!user || !isAdmin) {
    return null;
  }

  const links = [
    { name: 'Réservations', href: '/admin/reservations', icon: CalendarBlank },
    { name: 'Services & Flotte', href: '/admin/services', icon: Briefcase },
    { name: 'Paramètres', href: '/admin/settings', icon: GearSix },
  ];

  // `compact` = icons only (desktop, when the sidebar is minimised)
  const renderSidebar = (compact: boolean) => {
    const item = `flex items-center rounded-[2px] transition-colors ${compact ? 'justify-center px-0 py-3' : 'gap-3 px-4 py-3'}`;
    return (
      <>
        <div className={`border-b border-white/10 ${compact ? 'px-0 py-8 text-center' : 'px-8 py-8'}`}>
          <div className="font-display text-[22px] text-ghost tracking-logo uppercase leading-none">{compact ? 'A' : 'APEXIA'}</div>
          {!compact && <div className="font-sans font-medium text-[8px] text-muted tracking-label uppercase mt-2">Admin Panel</div>}
        </div>
        <nav className="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
          {links.map(l => {
            const isActive = pathname.startsWith(l.href);
            return (
              <Link
                key={l.name}
                href={l.href}
                title={compact ? l.name : undefined}
                onClick={() => setMenuOpen(false)}
                className={`${item} border-l-2 ${
                  isActive
                    ? 'bg-white/[0.06] text-ghost border-ghost'
                    : 'text-muted border-transparent hover:text-ghost hover:bg-white/[0.03]'
                }`}
              >
                <l.icon size={20} weight={isActive ? 'fill' : 'regular'} />
                {!compact && <span className="font-sans text-[14px]">{l.name}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-white/10 flex flex-col gap-1">
          {!compact && <div className="px-4 pb-2 font-sans text-[11px] text-muted/60 truncate">{user?.email}</div>}
          <Link href="/" title={compact ? 'Retour au Site' : undefined} className={`${item} text-muted hover:text-ghost`}>
            <Globe size={20} />
            {!compact && <span className="font-sans text-[14px]">Retour au Site</span>}
          </Link>
          <button
            onClick={signOut}
            title={compact ? 'Déconnexion' : undefined}
            className={`${item} text-muted hover:text-red-400 w-full text-left`}
          >
            <SignOut size={20} />
            {!compact && <span className="font-sans text-[14px]">Déconnexion</span>}
          </button>
          {/* Minimise / expand (desktop only: the phone menu is always full width) */}
          <button
            onClick={toggleCollapsed}
            title={collapsed ? 'Agrandir le menu' : 'Réduire le menu'}
            aria-label={collapsed ? 'Agrandir le menu' : 'Réduire le menu'}
            className={`hidden md:flex ${item} text-muted hover:text-ghost w-full text-left border-t border-white/10 mt-1 pt-4`}
          >
            {collapsed ? <CaretDoubleRight size={20} /> : <CaretDoubleLeft size={20} />}
            {!compact && <span className="font-sans text-[14px]">Réduire le menu</span>}
          </button>
        </div>
      </>
    );
  };

  return (
    <ToastProvider>
      <div className="min-h-screen bg-offblack">
        {/* Desktop: fixed sidebar that never scrolls with the page */}
        <aside className={`hidden md:flex fixed inset-y-0 left-0 ${collapsed ? 'w-[72px]' : 'w-64'} bg-ink border-r border-white/10 flex-col z-30 transition-[width] duration-200`}>
          {renderSidebar(collapsed)}
        </aside>

        {/* Mobile: fixed top bar + slide-over menu */}
        <header className="md:hidden fixed top-0 inset-x-0 h-16 bg-ink border-b border-white/10 flex items-center justify-between px-5 z-30">
          <div>
            <div className="font-display text-[18px] text-ghost tracking-logo uppercase leading-none">APEXIA</div>
            <div className="font-sans text-[7px] text-muted tracking-label uppercase mt-1">Admin Panel</div>
          </div>
          <button onClick={() => setMenuOpen(true)} className="text-ghost p-2" aria-label="Menu">
            <List size={24} />
          </button>
        </header>
        {menuOpen && (
          <div className="md:hidden fixed inset-0 z-40">
            <div className="absolute inset-0 bg-black/80" onClick={() => setMenuOpen(false)} />
            <aside className="absolute inset-y-0 left-0 w-72 bg-ink border-r border-white/10 flex flex-col">
              <button onClick={() => setMenuOpen(false)} className="absolute top-5 right-5 text-muted hover:text-ghost" aria-label="Fermer">
                <X size={20} />
              </button>
              {renderSidebar(false)}
            </aside>
          </div>
        )}

        {/* data-sidebar lets pages adapt their layout to the sidebar state (see group-data-[sidebar=collapsed] in services) */}
        <main data-sidebar={collapsed ? 'collapsed' : 'expanded'} className={`group ${collapsed ? 'md:ml-[72px]' : 'md:ml-64'} pt-16 md:pt-0 min-h-screen transition-[margin] duration-200`}>
          <div className={`p-5 md:p-10 ${collapsed ? 'max-w-[1700px]' : 'max-w-[1400px]'}`}>{children}</div>
        </main>
      </div>
    </ToastProvider>
  );
}

// Outer layout wraps everything with the AuthProvider
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AdminShell>{children}</AdminShell>
    </AuthProvider>
  );
}
