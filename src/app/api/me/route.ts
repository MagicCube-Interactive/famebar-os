/**
 * GET /api/me
 *
 * Returns the current user's profile using the service role key
 * to bypass RLS policies (avoids infinite recursion on profiles table).
 *
 * Requires a valid Supabase session cookie.
 */

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // Use the service client (with cookie-based auth) to get the current user
    const supabase = createServiceClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Use a plain supabase-js client with service role key to bypass RLS
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Fetch profile and ambassador_profiles in parallel
    const [profileResult, ambassadorResult] = await Promise.all([
      adminClient
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single(),
      adminClient
        .from('ambassador_profiles')
        .select('*')
        .eq('id', user.id)
        .single(),
    ]);

    if (profileResult.error || !profileResult.data) {
      console.error('Profile query error:', profileResult.error);
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Merge profile with ambassador data
    const profile = {
      ...profileResult.data,
      // Ambassador-specific fields (camelCase for client use)
      ...(ambassadorResult.data
        ? {
            tier: ambassadorResult.data.tier,
            rank: ambassadorResult.data.rank,
            referralCode: ambassadorResult.data.referral_code,
            isFounder: ambassadorResult.data.is_founder,
            isActive: ambassadorResult.data.is_active,
            personalSalesThisMonth: ambassadorResult.data.personal_sales_this_month,
            totalSales: ambassadorResult.data.total_sales,
            totalRecruits: ambassadorResult.data.total_recruits,
            sponsorId: ambassadorResult.data.sponsor_id,
            kycVerified: ambassadorResult.data.kyc_verified,
          }
        : {}),
    };

    return NextResponse.json({ profile });
  } catch (err: any) {
    console.error('GET /api/me error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
