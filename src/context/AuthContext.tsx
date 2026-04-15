/**
 * Authentication Context Provider
 *
 * Role-aware auth provider for buyer, ambassador, and admin accounts.
 * Provides global auth state to the entire application
 */

'use client';

import React, { createContext, useEffect, useState, useCallback } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { onAuthStateChange, getUserProfile } from '@/lib/supabase/auth';
import type { UserRole } from '@/types';

export interface AuthContextType {
  user: SupabaseUser | null;
  userProfile: any | null;
  role: UserRole | null;
  loading: boolean;
  isAuthenticated: boolean;
  isBuyer: boolean;
  isAmbassador: boolean;
  isAdmin: boolean;
  error: string | null;
  clearError: () => void;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  role: null,
  loading: true,
  isAuthenticated: false,
  isBuyer: false,
  isAmbassador: false,
  isAdmin: false,
  error: null,
  clearError: () => {},
  refreshProfile: async () => {},
});

export interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const syncProfile = useCallback(async (supabaseUser: SupabaseUser | null) => {
    if (!supabaseUser) {
      setUser(null);
      setUserProfile(null);
      setRole(null);
      return;
    }

    setUser(supabaseUser);
    try {
      const profile = await getUserProfile(supabaseUser.id);
      setUserProfile(profile);
      if (profile) {
        setRole((profile.role || 'buyer') as UserRole);
      } else {
        setRole('buyer');
      }
    } catch (profileError) {
      console.error('Error fetching user profile:', profileError);
      setRole('buyer');
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      return;
    }

    try {
      await syncProfile(user);
    } catch (err) {
      console.error('Error refreshing profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh profile');
    }
  }, [syncProfile, user]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initializeAuth = async () => {
      try {
        unsubscribe = onAuthStateChange(async (supabaseUser) => {
          try {
            await syncProfile(supabaseUser);
          } catch (err) {
            console.error('Error in auth state change handler:', err);
            setError(err instanceof Error ? err.message : 'Authentication error occurred');
          } finally {
            setLoading(false);
          }
        });
      } catch (err) {
        console.error('Error initializing auth:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize authentication');
        setLoading(false);
      }
    };

    initializeAuth();
    return () => { if (unsubscribe) unsubscribe(); };
  }, [syncProfile]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const handleFocus = () => {
      refreshProfile();
    };

    const interval = window.setInterval(() => {
      refreshProfile();
    }, 30000);

    window.addEventListener('focus', handleFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [refreshProfile, user]);

  const isBuyer = role === 'buyer';
  const isAmbassador = role === 'ambassador';
  const isAdmin = role === 'admin';
  const isAuthenticated = user !== null && role !== null;

  const value: AuthContextType = {
    user, userProfile, role, loading, isAuthenticated,
    isBuyer, isAmbassador, isAdmin, error, clearError,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextType {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error('useAuthContext must be used within AuthProvider');
  return context;
}
