/**
 * Next.js Middleware for Route Protection with Supabase
 *
 * Role-based protection for buyer, ambassador, and admin portals.
 * Protects routes based on authentication and role
 */

import { NextRequest, NextResponse } from 'next/server';
import { createMiddlewareClient } from '@/lib/supabase/middleware';
import { createClient } from '@supabase/supabase-js';

interface RouteConfig {
  requiredRoles: string[];
  public?: boolean;
}

const ROUTE_CONFIG: Record<string, RouteConfig> = {
  // Public routes
  '/': { requiredRoles: [], public: true },
  '/login': { requiredRoles: [], public: true },
  '/register': { requiredRoles: [], public: true },
  '/public': { requiredRoles: [], public: true },
  '/terms': { requiredRoles: [], public: true },
  '/privacy': { requiredRoles: [], public: true },
  '/help': { requiredRoles: [], public: true },

  // Buyer routes
  '/buyer': { requiredRoles: ['buyer', 'ambassador', 'admin'] },

  // Ambassador routes
  '/ambassador': { requiredRoles: ['ambassador', 'admin'] },
  '/ambassador/share': { requiredRoles: ['ambassador', 'admin'] },
  '/ambassador/earnings': { requiredRoles: ['ambassador', 'admin'] },
  '/ambassador/tokens': { requiredRoles: ['ambassador', 'admin'] },
  '/ambassador/customers': { requiredRoles: ['ambassador', 'admin'] },
  '/ambassador/team': { requiredRoles: ['ambassador', 'admin'] },
  '/ambassador/team-tree': { requiredRoles: ['ambassador', 'admin'] },
  '/ambassador/training': { requiredRoles: ['ambassador', 'admin'] },
  '/ambassador/campaigns': { requiredRoles: ['ambassador', 'admin'] },
  '/ambassador/events': { requiredRoles: ['ambassador', 'admin'] },
  '/ambassador/profile': { requiredRoles: ['ambassador', 'admin'] },

  // Admin routes
  '/admin': { requiredRoles: ['admin'] },
  '/admin/users': { requiredRoles: ['admin'] },
  '/admin/ambassadors': { requiredRoles: ['admin'] },
  '/admin/orders': { requiredRoles: ['admin'] },
  '/admin/record-sale': { requiredRoles: ['admin'] },
  '/admin/cash-ledger': { requiredRoles: ['admin'] },
  '/admin/token-ledger': { requiredRoles: ['admin'] },
  '/admin/campaigns': { requiredRoles: ['admin'] },
  '/admin/events': { requiredRoles: ['admin'] },
  '/admin/fraud': { requiredRoles: ['admin'] },
  '/admin/content': { requiredRoles: ['admin'] },
  '/admin/analytics': { requiredRoles: ['admin'] },
  '/admin/settings': { requiredRoles: ['admin'] },
};

const ROLE_DASHBOARD_PATHS: Record<string, string> = {
  buyer: '/buyer',
  ambassador: '/ambassador',
  admin: '/admin',
};

function getRouteConfig(path: string): RouteConfig | null {
  if (ROUTE_CONFIG[path]) {
    return ROUTE_CONFIG[path];
  }

  for (const [route, config] of Object.entries(ROUTE_CONFIG)) {
    if (route.endsWith('/*')) {
      const pattern = route.slice(0, -2);
      if (path.startsWith(pattern)) {
        return config;
      }
    }
  }

  // Default: authenticated buyer-level access
  return { requiredRoles: ['buyer', 'ambassador', 'admin'] };
}

function canAccessRoute(userRole: string, path: string): boolean {
  const routeConfig = getRouteConfig(path);
  if (!routeConfig) return false;
  if (routeConfig.public) return true;
  return routeConfig.requiredRoles.includes(userRole);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const routeConfig = getRouteConfig(pathname);

  if (routeConfig?.public) {
    return NextResponse.next();
  }

  try {
    const { supabase, response } = await createMiddlewareClient(request);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      if (pathname === '/login' || pathname === '/register') {
        return response;
      }
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Use service role key to bypass RLS (profiles table has recursive RLS policy)
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: profile, error } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (error || !profile) {
      const userRole = 'buyer';
      if (!canAccessRoute(userRole, pathname)) {
        return NextResponse.redirect(new URL('/buyer', request.url));
      }
      return response;
    }

    const userRole = profile.role || 'buyer';

    if (!canAccessRoute(userRole, pathname)) {
      const dashboardPath = ROLE_DASHBOARD_PATHS[userRole] || '/buyer';
      return NextResponse.redirect(new URL(dashboardPath, request.url));
    }

    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
