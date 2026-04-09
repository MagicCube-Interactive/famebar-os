/**
 * Next.js Middleware for Route Protection with Supabase
 *
 * Protects routes based on user authentication and role
 * Redirects unauthenticated users to login
 * Redirects authenticated users with wrong role to their dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { createMiddlewareClient } from '@/lib/supabase/middleware';

// ============================================================================
// ROUTE CONFIGURATION
// ============================================================================

interface RouteConfig {
  requiredRoles: string[];
  public?: boolean;
}

const ROUTE_CONFIG: Record<string, RouteConfig> = {
  // Public routes - no authentication required
  '/': { requiredRoles: [], public: true },
  '/login': { requiredRoles: [], public: true },
  '/register': { requiredRoles: [], public: true },
  '/public': { requiredRoles: [], public: true },

  // Buyer routes
  '/buyer': { requiredRoles: ['buyer', 'ambassador', 'leader', 'admin'] },
  '/buyer/shop': { requiredRoles: ['buyer', 'ambassador', 'leader', 'admin'] },
  '/buyer/orders': { requiredRoles: ['buyer', 'ambassador', 'leader', 'admin'] },
  '/buyer/rewards': { requiredRoles: ['buyer', 'ambassador', 'leader', 'admin'] },

  // Ambassador routes
  '/ambassador': { requiredRoles: ['ambassador', 'leader', 'admin'] },
  '/ambassador/recruits': { requiredRoles: ['ambassador', 'leader', 'admin'] },
  '/ambassador/team': { requiredRoles: ['ambassador', 'leader', 'admin'] },
  '/ambassador/commissions': { requiredRoles: ['ambassador', 'leader', 'admin'] },

  // Leader routes
  '/leader': { requiredRoles: ['leader', 'admin'] },
  '/leader/team': { requiredRoles: ['leader', 'admin'] },
  '/leader/analytics': { requiredRoles: ['leader', 'admin'] },

  // Admin routes
  '/admin': { requiredRoles: ['admin'] },
  '/admin/users': { requiredRoles: ['admin'] },
  '/admin/orders': { requiredRoles: ['admin'] },
  '/admin/commissions': { requiredRoles: ['admin'] },
};

// ============================================================================
// ROLE HIERARCHY FOR REDIRECTS
// ============================================================================

const ROLE_DASHBOARD_PATHS: Record<string, string> = {
  buyer: '/buyer',
  ambassador: '/ambassador',
  leader: '/leader',
  admin: '/admin',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get route config for a given path
 */
function getRouteConfig(path: string): RouteConfig | null {
  // Check exact match first
  if (ROUTE_CONFIG[path]) {
    return ROUTE_CONFIG[path];
  }

  // Check pattern matches (e.g., /buyer/*)
  for (const [route, config] of Object.entries(ROUTE_CONFIG)) {
    if (route.endsWith('/*')) {
      const pattern = route.slice(0, -2);
      if (path.startsWith(pattern)) {
        return config;
      }
    }
  }

  // Return default config for unknown routes (protected by default)
  return { requiredRoles: ['ambassador', 'leader', 'admin'] };
}

/**
 * Check if a role can access a route
 */
function canAccessRoute(userRole: string, path: string): boolean {
  const routeConfig = getRouteConfig(path);

  if (!routeConfig) {
    return false;
  }

  if (routeConfig.public) {
    return true;
  }

  return routeConfig.requiredRoles.includes(userRole);
}

// ============================================================================
// MIDDLEWARE FUNCTION
// ============================================================================

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get route configuration
  const routeConfig = getRouteConfig(pathname);

  // Allow public routes
  if (routeConfig?.public) {
    return NextResponse.next();
  }

  try {
    // Create Supabase client and get user
    const { supabase, response } = await createMiddlewareClient(request);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // If no user and route is protected, redirect to login
    if (!user) {
      // Allow auth routes
      if (pathname === '/login' || pathname === '/register') {
        return response;
      }

      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Fetch user role from profiles table
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (error || !profile) {
      // If we can't fetch role, default to buyer but still allow access to buyer routes
      const userRole = 'buyer';

      if (!canAccessRoute(userRole, pathname)) {
        const dashboardPath = ROLE_DASHBOARD_PATHS[userRole] || '/buyer';
        return NextResponse.redirect(new URL(dashboardPath, request.url));
      }

      return response;
    }

    // Get user role
    const userRole = profile.role || 'buyer';

    // Check if user can access this route
    if (!canAccessRoute(userRole, pathname)) {
      // Redirect to user's dashboard
      const dashboardPath = ROLE_DASHBOARD_PATHS[userRole] || '/buyer';
      return NextResponse.redirect(new URL(dashboardPath, request.url));
    }

    // Allow access
    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    // On error, redirect to login to be safe
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }
}

// ============================================================================
// MIDDLEWARE CONFIG
// ============================================================================

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
