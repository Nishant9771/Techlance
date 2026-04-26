import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { normalizeRole, type AppRole } from '@/lib/firebaseAuth';
import { embedActorFromUser } from '@/lib/vertexClient';

type Role = AppRole;

interface RoleContextType {
  role: Role;
  setRole: (role: Role) => void;
  loading: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const { user, profile, loading: authLoading, profileLoading } = useAuth();
  const [role, setRoleState] = useState<Role>('user');
  const [hasLoadedCachedRole, setHasLoadedCachedRole] = useState(false);

  useEffect(() => {
    const savedRole = localStorage.getItem('role');

    if (savedRole === 'user' || savedRole === 'actor' || savedRole === 'supplier') {
      setRoleState(savedRole);
    }

    setHasLoadedCachedRole(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedCachedRole || authLoading || profileLoading) {
      return;
    }

    if (!user) {
      setRoleState('user');
      localStorage.removeItem('role');
      return;
    }

    const nextRole = normalizeRole(profile?.role);
    setRoleState(nextRole);
    localStorage.setItem('role', nextRole);

    if (nextRole === 'actor' && user) {
      void embedActorFromUser(user.uid).catch((error) => {
        console.warn('Unable to sync actor embedding.', error);
      });
    }
  }, [authLoading, hasLoadedCachedRole, profile?.role, profileLoading, user]);

  const setRole = useCallback(
    (nextRole: Role) => {
      setRoleState(nextRole);
      localStorage.setItem('role', nextRole);

      if (!user) {
        return;
      }

      void setDoc(
        doc(db, 'users', user.uid),
        {
          uid: user.uid,
          email: user.email ?? '',
          displayName: user.displayName ?? '',
          role: nextRole,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      ).catch((error) => {
        console.warn('Unable to persist role in Firebase.', error);
      });
    },
    [user],
  );

  return (
    <RoleContext.Provider value={{ role, setRole, loading: authLoading || profileLoading || !hasLoadedCachedRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
