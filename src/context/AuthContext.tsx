/**
 * Authentication Context Provider
 *
 * Provides global auth state to the entire application
 * Manages user authentication, profile data, and role-based state
 */

'use client';

import React, { createContext, useEffect, useState, useCallback } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { onAuthStateChange, getUserProfile, getAmbassadorProfile, getBuyerProfile } from '@/lib/supabase/auth';
import type { UserRole } from '@/types';

// ============================================================================
// CONTEXT TYPE DEFINITIONS
// ============================================================================

export interface AuthContextType {
  // Auth state
  user: SupabaseUser | null;
  userProfile: any | null;
  role: UserRole | null;
  loading: boolean;
  isAuthenticated: boolean;

  // Role helpers
  isBuyer: boolean;
  isAmbassador: boolean;
  isLeader: boolean;
  isAdmin: boolean;

  // Error state
  error: string | null;
  clearError: () => void;
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

export const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  role: null,
  loading: true,
  isAuthenticated: false,
  isBuyer: false,
  isAmbassador: false,
  isLeader: false,
  isAdmin: false,
  error: null,
  clearError: () => {},
});

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

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
        // Subscribe to auth state changes
        unsubscribe = onAuthStateChange(async (supabaseUser) => {
          try {
            if (supabaseUser) {
              // User is authenticated
              setUser(supabaseUser);

              // Fetch user profile from profiles table
              try {
                const profile = await getUserProfile(supabaseUser.id);
                setUserProfile(profile);

                if (profile) {
                  const userRole = (profile.role || 'buyer') as UserRole;
                  setRole(userRole);
                } else {
                  // Default to buyer if profile not found
                  setRole('buyer');
                }
              } catch (profileError) {
                console.error('Error fetching user profile:', profileError);
                // Still set user even if we can't get profile
                setRole('buyer');
              }
            } else {
              // User is not authenticated
              setUser(null);
              setUserProfile(null);
              setRole(null);
            }
          } catch (err) {
            console.error('Error in auth state change handler:', err);
            setError(
              err instanceof Error ? err.message : 'Authentication error occurred'
            );
          } finally {
            setLoading(false);
          }
        });
      } catch (err) {
        console.error('Error initializing auth:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to initialize authentication'
        );
        setLoading(false);
      }
    };

    initializeAuth();

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Compute role-based helpers
  const isBuyer = role === 'buyer';
  const isAmbassador = role === 'ambassador';
  const isLeader = role === 'leader';
  const isAdmin = role === 'admin';

  // Compute authentication state
  const isAuthenticated = user !== null && role !== null;

  const value: AuthContextType = {
    user,
    userProfile,
    role,
    loading,
    isAuthenticated,
    isBuyer,
    isAmbassador,
    isLeader,
    isAdmin,
    error,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================================
// HOOK TO USE AUTH CONTEXT
// ============================================================================

/**
 * Hook to access auth context
 * Throws error if used outside of AuthProvider
 */
export function useAuthContext(): AuthContextType {
  const context = React.useContext(AuthContext);

  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }

  return context;
}
