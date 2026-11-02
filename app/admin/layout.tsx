'use client';
import { ReactNode, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { CalendarBlank, Briefcase, GearSix, DoorOpen, SignOut } from '@phosphor-icons/react';
import { AuthProvider, useAuth } from '@/lib/AuthContext';

// Inner layout — only rendered once auth is confirmed
function AdminShell({ children }: { children: ReactNode }) {
  const pathname        = usePathname() || '';
  const router          = useRouter();
  const { user, loading, isOwner, signOut } = useAuth();

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (loading) return;
    if (!user || !isOwner) {
      // Not logged in or not the owner → go to login
      if (!isLoginPage) router.replace('/admin/login');
    } else {
      // Logged in as owner on login page → go to dashboard
      if (isLoginPage) router.replace('/admin/reservations');
    }
  }, [user, loading, isOwner, isLoginPage, router]);

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

  // Not authenticated or not the owner → show nothing while redirecting
  if (!user || !isOwner) {
    return null;
  }

  const links = [
    { name: 'Réservations', href: '/admin/reservations', icon: CalendarBlank },
    { name: 'Services & Flotte', href: '/admin/services', icon: Briefcase },
    { name: 'Paramètres', href: '/admin/settings', icon: GearSix },
  ];

  return (
    <div className="min-h-screen bg-offblack flex flex-col md:flex-row">
      <aside className="w-full md:w-64 bg-ink border-r border-gold/15 flex flex-col">
        <div className="p-8 border-b border-gold/10">
          <div className="font-display text-[20px] text-ghost tracking-logo uppercase leading-none">APEXIA</div>
          <div className="font-sans font-medium text-[8px] text-gold tracking-label uppercase mt-1">ADMIN PANEL</div>
        </div>
        <nav className="flex-1 p-4 flex flex-col gap-2">
          {links.map(l => {
            const isActive = pathname.startsWith(l.href);
            return (
              <Link
                key={l.name}
                href={l.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-[2px] transition-colors ${
                  isActive
                    ? 'bg-gold/10 text-gold border border-gold/20'
                    : 'text-muted hover:text-ghost hover:bg-gold/5'
                }`}
              >
                <l.icon size={20} />
                <span className="font-sans text-[14px]">{l.name}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gold/10 flex flex-col gap-1">
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-4 py-3 text-muted hover:text-red-400 transition-colors w-full text-left"
          >
            <SignOut size={20} />
            <span className="font-sans text-[14px]">Déconnexion</span>
          </button>
          <Link href="/" className="flex items-center gap-3 px-4 py-3 text-muted hover:text-ghost transition-colors">
            <DoorOpen size={20} />
            <span className="font-sans text-[14px]">Retour au Site</span>
          </Link>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
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
