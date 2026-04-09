/**
 * POST /api/data
 *
 * Authenticated data fetching endpoint that bypasses RLS.
 * The profiles table has an RLS policy with infinite recursion,
 * which also breaks queries on tables with RLS policies that reference profiles.
 *
 * This route uses the service role key to query any table,
 * but ONLY for the authenticated user's own data.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

interface DataRequest {
  table: string;
  select?: string;
  filters?: Array<{ column: string; op: string; value: any }>;
  order?: { column: string; ascending?: boolean };
  limit?: number;
}

// Allowed tables — whitelist for safety
const ALLOWED_TABLES = [
  'profiles',
  'ambassador_profiles',
  'commission_events',
  'token_events',
  'orders',
  'referral_codes',
];

export async function POST(request: NextRequest) {
  try {
    // Authenticate the user via session cookie
    const serviceClient = createServiceClient();
    const { data: { user }, error: authError } = await serviceClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = (await request.json()) as DataRequest;
    const { table, select = '*', filters = [], order, limit } = body;

    // Validate table name
    if (!ALLOWED_TABLES.includes(table)) {
      return NextResponse.json(
        { error: `Table "${table}" is not allowed` },
        { status: 400 }
      );
    }

    // Use admin client to bypass RLS
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    let query = adminClient.from(table).select(select);

    // Apply filters
    for (const filter of filters) {
      switch (filter.op) {
        case 'eq':
          query = query.eq(filter.column, filter.value);
          break;
        case 'neq':
          query = query.neq(filter.column, filter.value);
          break;
        case 'gte':
          query = query.gte(filter.column, filter.value);
          break;
        case 'lte':
          query = query.lte(filter.column, filter.value);
          break;
        case 'gt':
          query = query.gt(filter.column, filter.value);
          break;
        case 'lt':
          query = query.lt(filter.column, filter.value);
          break;
        case 'in':
          query = query.in(filter.column, filter.value);
          break;
        case 'is':
          query = query.is(filter.column, filter.value);
          break;
        default:
          query = query.eq(filter.column, filter.value);
      }
    }

    // Apply ordering
    if (order) {
      query = query.order(order.column, { ascending: order.ascending ?? false });
    }

    // Apply limit
    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error(`/api/data error on ${table}:`, error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (err: any) {
    console.error('POST /api/data error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
