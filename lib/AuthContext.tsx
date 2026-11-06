'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Permission, Role, TeamMember, can as roleCan } from '@/lib/roles';

interface AuthContextType {
  user:    User | null;
  member:  TeamMember | null;   // entry in the team list (admins/{email})
  role:    Role | null;
  loading: boolean;
  isAdmin: boolean;             // signed in AND an active team member
  can:     (p: Permission) => boolean;
  signIn:  (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null);
  const [member,  setMember]  = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubMember: (() => void) | null = null;
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      unsubMember?.();
      unsubMember = null;
      setUser(firebaseUser);
      const email = firebaseUser?.email?.toLowerCase();
      if (!email) { setMember(null); setLoading(false); return; }
      // Access comes from the team list, not just from having a Firebase account.
      // Live, so a role change or deactivation applies immediately.
      setLoading(true);
      unsubMember = onSnapshot(
        doc(db, 'admins', email),
        snap => {
          setMember(snap.exists() ? ({ id: snap.id, ...snap.data() } as TeamMember) : null);
          setLoading(false);
        },
        () => { setMember(null); setLoading(false); }
      );
    });
    return () => { unsubscribe(); unsubMember?.(); };
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  // UI only: the Firestore security rules enforce the same roles server-side
  const isAdmin = !!user && !!member && member.active !== false;
  const role = isAdmin ? member!.role : null;

  return (
    <AuthContext.Provider value={{ user, member, role, loading, isAdmin, can: p => roleCan(role, p), signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
