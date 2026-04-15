import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createServiceClient } from '@/lib/supabase/server';

const ALLOWED_TABLES = new Set([
  'profiles',
  'buyer_profiles',
  'ambassador_profiles',
  'referral_codes',
  'orders',
  'ambassador_packs',
  'pack_sale_events',
  'pack_remittances',
]);

export async function POST(request: NextRequest) {
  try {
    const serviceClient = await createServiceClient();
    const {
      data: { user },
      error: authError,
    } = await serviceClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const {
      table,
      action,
      fields = {},
      match,
      matchIn,
      returning = '*',
    } = body;

    if (!ALLOWED_TABLES.has(table)) {
      return NextResponse.json({ success: false, error: 'Table not allowed' }, { status: 400 });
    }

    if (!['insert', 'update', 'delete'].includes(action)) {
      return NextResponse.json({ success: false, error: 'Unsupported action' }, { status: 400 });
    }

    if (action === 'insert') {
      const { data, error } = await supabase.from(table).insert(fields).select(returning);
      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, data });
    }

    let query: any =
      action === 'update'
        ? supabase.from(table).update(fields)
        : supabase.from(table).delete();

    if (matchIn?.column && Array.isArray(matchIn.values) && matchIn.values.length > 0) {
      query = query.in(matchIn.column, matchIn.values);
    } else if (match?.column) {
      query = query.eq(match.column, match.value);
    } else {
      return NextResponse.json({ success: false, error: 'Missing match condition' }, { status: 400 });
    }

    const { data, error } = await query.select(returning);
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
