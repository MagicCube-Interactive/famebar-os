/**
 * Authentication Context Provider
 *
 * Two-role system: admin + ambassador
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
  isAmbassador: boolean;
  isAdmin: boolean;
  error: string | null;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  role: null,
  loading: true,
  isAuthenticated: false,
  isAmbassador: false,
  isAdmin: false,
  error: null,
  clearError: () => {},
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

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initializeAuth = async () => {
      try {
        unsubscribe = onAuthStateChange(async (supabaseUser) => {
          try {
            if (supabaseUser) {
              setUser(supabaseUser);
              try {
                const profile = await getUserProfile(supabaseUser.id);
                setUserProfile(profile);
                if (profile) {
                  const userRole = (profile.role || 'ambassador') as UserRole;
                  setRole(userRole);
                } else {
                  setRole('ambassador');
                }
              } catch (profileError) {
                console.error('Error fetching user profile:', profileError);
                setRole('ambassador');
              }
            } else {
              setUser(null);
              setUserProfile(null);
              setRole(null);
            }
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
  }, []);

  const isAmbassador = role === 'ambassador';
  const isAdmin = role === 'admin';
  const isAuthenticated = user !== null && role !== null;

  const value: AuthContextType = {
    user, userProfile, role, loading, isAuthenticated,
    isAmbassador, isAdmin, error, clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextType {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error('useAuthContext must be used within AuthProvider');
  return context;
}
