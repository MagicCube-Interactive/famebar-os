/**
 * useRole Hook — Two-role system (admin + ambassador)
 */

'use client';

import { useAuth } from './useAuth';
import type { UserRole } from '@/types';

export interface RoleConfig {
  dashboardPath: string;
  availableRoutes: string[];
  canAccess: (path: string) => boolean;
}

const ROLE_ROUTES: Record<UserRole, RoleConfig> = {
  ambassador: {
    dashboardPath: '/ambassador',
    availableRoutes: [
      '/ambassador',
      '/ambassador/share',
      '/ambassador/earnings',
      '/ambassador/tokens',
      '/ambassador/customers',
      '/ambassador/team',
      '/ambassador/team-tree',
      '/ambassador/training',
      '/ambassador/campaigns',
      '/ambassador/events',
      '/ambassador/profile',
    ],
    canAccess: (path: string) => path.startsWith('/ambassador'),
  },
  admin: {
    dashboardPath: '/admin',
    availableRoutes: [
      '/admin',
      '/admin/users',
      '/admin/ambassadors',
      '/admin/orders',
      '/admin/record-sale',
      '/admin/cash-ledger',
      '/admin/token-ledger',
      '/admin/campaigns',
      '/admin/events',
      '/admin/fraud',
      '/admin/content',
      '/admin/analytics',
      '/admin/settings',
      '/ambassador',
    ],
    canAccess: () => true,
  },
};

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

  return { role, ...ROLE_ROUTES[role] };
}

export function useCanAccess(path: string): boolean {
  const { canAccess } = useRole();
  return canAccess(path);
}

export function useDashboardPath(): string {
  const { dashboardPath } = useRole();
  return dashboardPath;
}

export function useAvailableRoutes(): string[] {
  const { availableRoutes } = useRole();
  return availableRoutes;
}
