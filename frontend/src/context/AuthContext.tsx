'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { normalizeUserProfile, type UserProfile } from '@/lib/firebaseAuth';

type AuthContextType = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  profileLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);

    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(
      userRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setProfile(normalizeUserProfile(user.uid, snapshot.data()));
          setProfileLoading(false);
          return;
        }

        const fallbackProfile = normalizeUserProfile(user.uid, {
          uid: user.uid,
          email: user.email ?? '',
          displayName: user.displayName ?? '',
          role: 'user',
          phone: '',
          location: '',
        });

        setProfile(fallbackProfile);
        setProfileLoading(false);

        void setDoc(
          userRef,
          {
            ...fallbackProfile,
            createdAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        );
      },
      (error) => {
        console.warn('Unable to load Firebase user profile.', error);
        setProfile(
          normalizeUserProfile(user.uid, {
            uid: user.uid,
            email: user.email ?? '',
            displayName: user.displayName ?? '',
            role: 'user',
          }),
        );
        setProfileLoading(false);
      },
    );

    return unsubscribe;
  }, [loading, user]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, profileLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
