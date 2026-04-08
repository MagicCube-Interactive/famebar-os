/**
 * Supabase Browser Client
 *
 * Client-side Supabase instance for auth and database operations.
 * Used in browser components and client-side code.
 */

import { createBrowserClient } from '@supabase/ssr';

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Create and return the Supabase browser client
 * Uses singleton pattern to avoid re-initialization
 */
export function createClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  supabaseClient = createBrowserClient(supabaseUrl, supabaseKey);
  return supabaseClient;
}

/**
 * Get existing Supabase client instance
 * Throws error if client hasn't been initialized
 */
export function getClient() {
  if (!supabaseClient) {
    return createClient();
  }
  return supabaseClient;
}
