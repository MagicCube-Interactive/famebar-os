/**
 * useRole Hook
 *
 * Provides role-based routing and access control helpers
 * Determines available routes and dashboard paths based on user role
 */

'use client';

import { useAuth } from './useAuth';
import type { UserRole } from '@/types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface RoleConfig {
  dashboardPath: string;
  availableRoutes: string[];
  canAccess: (path: string) => boolean;
}

// ============================================================================
// ROLE CONFIGURATION
// ============================================================================

const ROLE_ROUTES: Record<UserRole, RoleConfig> = {
  buyer: {
    dashboardPath: '/buyer/dashboard',
    availableRoutes: [
      '/buyer',
      '/buyer/dashboard',
      '/buyer/shop',
      '/buyer/orders',
      '/buyer/rewards',
      '/buyer/profile',
      '/buyer/referrals',
    ],
    canAccess: (path: string) => path.startsWith('/buyer'),
  },
  ambassador: {
    dashboardPath: '/ambassador/dashboard',
    availableRoutes: [
      '/ambassador',
      '/ambassador/dashboard',
      '/ambassador/recruits',
      '/ambassador/team',
      '/ambassador/commissions',
      '/ambassador/campaigns',
      '/ambassador/profile',
      '/buyer',
      '/buyer/shop',
    ],
    canAccess: (path: string) =>
      path.startsWith('/ambassador') || path.startsWith('/buyer'),
  },
  leader: {
    dashboardPath: '/leader/dashboard',
    availableRoutes: [
      '/leader',
      '/leader/dashboard',
      '/leader/team',
      '/leader/analytics',
      '/leader/campaigns',
      '/leader/events',
      '/leader/profile',
      '/ambassador',
      '/buyer',
    ],
    canAccess: (path: string) =>
      path.startsWith('/leader') ||
      path.startsWith('/ambassador') ||
      path.startsWith('/buyer'),
  },
  admin: {
    dashboardPath: '/admin/dashboard',
    availableRoutes: [
      '/admin',
      '/admin/dashboard',
      '/admin/users',
      '/admin/orders',
      '/admin/commissions',
      '/admin/campaigns',
      '/admin/analytics',
      '/admin/settings',
      '/leader',
      '/ambassador',
      '/buyer',
    ],
    canAccess: (path: string) => true, // Admin can access everything
  },
};

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to get role-based routing configuration
 *
 * @returns Role config object with dashboard path and access control helpers
 *
 * @example
 * const { dashboardPath, canAccessRoute } = useRole();
 * if (canAccessRoute('/ambassador/team')) {
 *   // User can access this route
 * }
 */
export function useRole(): RoleConfig & { role: UserRole | null } {
  const { role } = useAuth();

  if (!role) {
    return {
      role: null,
      dashboardPath: '/login',
      availableRoutes: [],
      canAccess: () => false,
    };
  }

  const roleConfig = ROLE_ROUTES[role];

  return {
    role,
    ...roleConfig,
  };
}

/**
 * Hook to check if user can access a specific route
 *
 * @param path - Route path to check access for
 * @returns true if user can access this route
 *
 * @example
 * const canAccess = useCanAccess('/ambassador/team');
 */
export function useCanAccess(path: string): boolean {
  const { canAccess } = useRole();
  return canAccess(path);
}

/**
 * Hook to get user's dashboard path
 * Useful for redirecting users to their role-appropriate dashboard
 *
 * @returns Dashboard path for user's role, or '/login' if not authenticated
 *
 * @example
 * const dashboardPath = useDashboardPath();
 * router.push(dashboardPath);
 */
export function useDashboardPath(): string {
  const { dashboardPath } = useRole();
  return dashboardPath;
}

/**
 * Hook to get available routes for user's role
 *
 * @returns Array of available route paths
 */
export function useAvailableRoutes(): string[] {
  const { availableRoutes } = useRole();
  return availableRoutes;
}
