/**
 * Supabase Server-Side Client
 *
 * Server-side Supabase instance for API routes, server components, and middleware.
 * Uses service role key for elevated permissions.
 *
 * IMPORTANT: Only use in server-side code (API routes, server components, middleware).
 * Never use in client components.
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Create a Supabase server client for API routes and server components
 * This uses the anon key and manages session cookies
 */
export function createServiceClient() {
  const cookieStore = cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set(name, value, options);
        } catch (error) {
          // The `set` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.delete(name);
        } catch (error) {
          // The `delete` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  });
}

/**
 * Create a Supabase admin client with service role key
 * Use this for administrative operations only (migrations, batch updates, etc.)
 *
 * IMPORTANT: Only use on the server side where the service role key is safe.
 * Never expose this to the client.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase admin environment variables');
  }

  return createServerClient(supabaseUrl, serviceRoleKey, {
    cookies: {
      get(name: string) {
        const cookieStore = cookies();
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          const cookieStore = cookies();
          cookieStore.set(name, value, options);
        } catch (error) {
          // Ignore errors in Server Components
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          const cookieStore = cookies();
          cookieStore.delete(name);
        } catch (error) {
          // Ignore errors in Server Components
        }
      },
    },
  });
}
