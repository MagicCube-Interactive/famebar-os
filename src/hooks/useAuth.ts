/**
 * useAuth Hook
 *
 * Provides convenient access to authentication state and user profile
 * from anywhere in the application
 */

'use client';

import { useAuthContext } from '@/context/AuthContext';

/**
 * Hook to access auth context
 * Returns all auth state including user, profile, role, and loading state
 *
 * @returns Auth context object with user, role, loading state, and role helpers
 * @throws Error if used outside of AuthProvider
 *
 * @example
 * const { user, isAuthenticated, isAmbassador, loading } = useAuth();
 */
export function useAuth() {
  return useAuthContext();
}

// Re-export for convenience
export type { AuthContextType } from '@/context/AuthContext';
