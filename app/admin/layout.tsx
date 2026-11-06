'use client';
import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { CalendarBlank, Briefcase, GearSix, List, X, CaretDoubleLeft, CaretDoubleRight, SteeringWheel, CalendarDots, BellRinging, UsersThree, Receipt, ChartBar, ShieldCheck, ClockCounterClockwise, Star } from '@phosphor-icons/react';
import { PAGE_PERMISSION, roleLabel } from '@/lib/roles';
import BookingAlerts from '@/components/admin/BookingAlerts';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { ToastProvider } from '@/components/admin/ui';
import { useAdminTheme, useApplyAdminTheme } from '@/lib/adminTheme';

// Inner layout — only rendered once auth is confirmed
function AdminShell({ children }: { children: ReactNode }) {
  const pathname        = usePathname() || '';
  const router          = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { user, loading, isAdmin, can, role, member } = useAuth();
  // New-booking alerts: pending count for the sidebar badge, desktop notification permission
  const [pendingCount, setPendingCount] = useState(0);
  const [notifPerm, setNotifPerm] = useState<NotificationPermission | 'unsupported'>('default');
  useEffect(() => {
    setNotifPerm('Notification' in window ? Notification.permission : 'unsupported');
  }, []);
  const enableNotifications = async () => {
    if (!('Notification' in window)) return;
    setNotifPerm(await Notification.requestPermission());
  };

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
          <p className="font-sans text-[12px] text-muted">Vérification...</p>
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

  // Only the pages this person's role may use
  const links = [
    { name: 'Réservations', href: '/admin/reservations', icon: CalendarBlank },
    { name: 'Planning', href: '/admin/planning', icon: CalendarDots },
    { name: 'Clients', href: '/admin/customers', icon: UsersThree },
    { name: 'Avis clients', href: '/admin/reviews', icon: Star },
    { name: 'Devis & Factures', href: '/admin/documents', icon: Receipt },
    { name: 'Statistiques', href: '/admin/stats', icon: ChartBar },
    { name: 'Chauffeurs & Véhicules', href: '/admin/fleet', icon: SteeringWheel },
    { name: 'Services & Catalogue', href: '/admin/services', icon: Briefcase },
    { name: 'Équipe', href: '/admin/team', icon: ShieldCheck },
    { name: "Journal d'activité", href: '/admin/activity', icon: ClockCounterClockwise },
    { name: 'Paramètres', href: '/admin/settings', icon: GearSix },
  ].filter(l => !PAGE_PERMISSION[l.href] || can(PAGE_PERMISSION[l.href]));

  // Page guard (the security rules block the data anyway; this avoids a broken page)
  const requiredPerm = Object.entries(PAGE_PERMISSION).find(([href]) => pathname.startsWith(href))?.[1];
  const allowed = !requiredPerm || can(requiredPerm);

  // `compact` = icons only (desktop, when the sidebar is minimised)
  const renderSidebar = (compact: boolean) => {
    const item = `flex items-center rounded-[2px] transition-colors ${compact ? 'justify-center px-0 py-3' : 'gap-3 px-4 py-3'}`;
    return (
      <>
        <Link
          href="/"
          title="Aller sur le site"
          aria-label="Apexia, aller sur le site"
          className={`block border-b border-white/10 hover:opacity-70 transition-opacity duration-150 ease-brand ${compact ? 'px-0 py-8 text-center' : 'px-8 py-8'}`}
        >
          <div className="font-display text-[22px] text-ghost tracking-logo uppercase leading-none">{compact ? 'A' : 'APEXIA'}</div>
          {!compact && <div className="font-sans font-medium text-[8px] text-muted tracking-label uppercase mt-2">Admin Panel</div>}
        </Link>
        <nav className="flex-1 overflow-y-auto p-3 flex flex-col gap-1">
          {links.map(l => {
            const isActive = pathname.startsWith(l.href);
            const badge = l.href === '/admin/reservations' && pendingCount > 0 ? pendingCount : 0;
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
                <span className="relative">
                  <l.icon size={20} weight={isActive ? 'fill' : 'regular'} />
                  {badge > 0 && compact && (
                    <span className="absolute -top-2 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-ghost text-offblack font-sans text-[9px] font-semibold flex items-center justify-center">{badge}</span>
                  )}
                </span>
                {!compact && <span className="font-sans text-[14px] flex-1">{l.name}</span>}
                {!compact && badge > 0 && (
                  <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-ghost text-offblack font-sans text-[12px] font-semibold flex items-center justify-center" title={`${badge} en attente`}>{badge}</span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-white/10 flex flex-col gap-1">
          {!compact && (
            <div className="px-4 pb-2 font-sans text-[12px] text-muted/60 truncate">
              {member?.name || user?.email} · <span className="text-muted">{roleLabel(role || undefined)}</span>
            </div>
          )}
          {notifPerm === 'default' && (
            <button onClick={enableNotifications} title={compact ? 'Activer les notifications' : undefined}
              className={`${item} text-amber-200 hover:text-ghost w-full text-left`}>
              <BellRinging size={20} />
              {!compact && <span className="font-sans text-[14px]">Activer les notifications</span>}
            </button>
          )}
          {/* Appearance and sign-out live in Paramètres; the logo leads back to the website */}
          {/* Minimise / expand (desktop only: the phone menu is always full width) */}
          <button
            onClick={toggleCollapsed}
            title={collapsed ? 'Agrandir le menu' : 'Réduire le menu'}
            aria-label={collapsed ? 'Agrandir le menu' : 'Réduire le menu'}
            className={`hidden md:flex ${item} text-muted hover:text-ghost w-full text-left`}
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
      <BookingAlerts onCount={setPendingCount} />
      <div className="min-h-screen bg-offblack">
        {/* Desktop: fixed sidebar that never scrolls with the page */}
        <aside className={`hidden md:flex print:!hidden fixed inset-y-0 left-0 ${collapsed ? 'w-[72px]' : 'w-64'} bg-offblack border-r border-white/10 flex-col z-30 transition-[width] duration-200`}>
          {renderSidebar(collapsed)}
        </aside>

        {/* Mobile: fixed top bar + slide-over menu */}
        <header className="md:hidden print:hidden fixed top-0 inset-x-0 h-16 bg-offblack border-b border-white/10 flex items-center justify-between px-5 z-30">
          <Link href="/" aria-label="Apexia, aller sur le site">
            <div className="font-display text-[18px] text-ghost tracking-logo uppercase leading-none">APEXIA</div>
            <div className="font-sans text-[7px] text-muted tracking-label uppercase mt-1">Admin Panel</div>
          </Link>
          <button onClick={() => setMenuOpen(true)} className="text-ghost p-2" aria-label="Menu">
            <List size={24} />
          </button>
        </header>
        {menuOpen && (
          <div className="md:hidden fixed inset-0 z-40">
            <div className="absolute inset-0 bg-black/80" onClick={() => setMenuOpen(false)} />
            <aside className="absolute inset-y-0 left-0 w-72 bg-offblack border-r border-white/10 flex flex-col">
              <button onClick={() => setMenuOpen(false)} className="absolute top-5 right-5 text-muted hover:text-ghost" aria-label="Fermer">
                <X size={20} />
              </button>
              {renderSidebar(false)}
            </aside>
          </div>
        )}

        {/* data-sidebar lets pages adapt their layout to the sidebar state (see group-data-[sidebar=collapsed] in services) */}
        <main data-sidebar={collapsed ? 'collapsed' : 'expanded'} className={`group ${collapsed ? 'md:ml-[72px]' : 'md:ml-64'} pt-16 md:pt-0 min-h-screen transition-[margin] duration-200 print:!m-0 print:!p-0`}>
          <div className={`p-5 md:p-10 print:!p-0 print:!max-w-none ${collapsed ? 'max-w-[1700px]' : 'max-w-[1400px]'}`}>
            {allowed ? children : (
              <div className="py-24 text-center">
                <div className="font-display text-[30px] text-ghost">Accès refusé</div>
                <p className="font-sans text-[14px] text-muted mt-3">Votre rôle ({roleLabel(role || undefined)}) ne donne pas accès à cette page.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}

// Outer layout wraps everything with the AuthProvider
export default function AdminLayout({ children }: { children: ReactNode }) {
  // Light / dark appearance of the admin (login page and spinner included)
  const [theme] = useAdminTheme();
  useApplyAdminTheme(theme);
  return (
    <AuthProvider>
      <AdminShell>{children}</AdminShell>
    </AuthProvider>
  );
}
