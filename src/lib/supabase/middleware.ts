/**
 * Supabase Middleware Helper
 *
 * Middleware utilities for handling Supabase auth sessions in Next.js middleware.
 * Refreshes session on every request using the @supabase/ssr pattern.
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Create a Supabase client for middleware
 * Handles session refresh automatically
 */
export async function createMiddlewareClient(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        response.cookies.set({
          name,
          value,
          ...options,
        });
      },
      remove(name: string, options: CookieOptions) {
        response.cookies.set({
          name,
          value: '',
          ...options,
        });
      },
    },
  });

  // Refresh session
  await supabase.auth.getSession();

  return { supabase, response };
}

/**
 * Get user from Supabase session in middleware
 */
export async function getMiddlewareUser(request: NextRequest) {
  const { supabase } = await createMiddlewareClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

/**
 * Get user role from profiles table
 */
export async function getUserRole(supabase: any, userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user role:', error);
    return null;
  }

  return data?.role || null;
}
