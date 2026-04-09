/**
 * POST /api/setup-ambassador
 *
 * Called after successful signup to create:
 * 1. ambassador_profiles row (with referral code, sponsor linkage)
 * 2. referral_codes row (primary code for the new ambassador)
 *
 * The profiles row is already created by the database trigger.
 * This endpoint fills in the ambassador-specific data.
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'FB-';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, referralCode: sponsorCode } = body;

    if (!userId || !sponsorCode) {
      return NextResponse.json(
        { error: 'userId and referralCode are required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // 1. Look up sponsor from the referral code
    const { data: codeData } = await supabase
      .from('referral_codes')
      .select('ambassador_id')
      .eq('code', sponsorCode)
      .eq('is_active', true)
      .single();

    const sponsorId = codeData?.ambassador_id || null;

    // 2. Check if ambassador_profiles already exists (idempotent)
    const { data: existing } = await supabase
      .from('ambassador_profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (existing) {
      return NextResponse.json({ success: true, message: 'Already set up' });
    }

    // 3. Generate a unique referral code for the new ambassador
    let newCode = generateCode();
    let attempts = 0;
    while (attempts < 10) {
      const { data: dup } = await supabase
        .from('referral_codes')
        .select('code')
        .eq('code', newCode)
        .single();
      if (!dup) break;
      newCode = generateCode();
      attempts++;
    }

    // 4. Create ambassador_profiles row
    const { error: profileError } = await supabase
      .from('ambassador_profiles')
      .insert({
        id: userId,
        sponsor_id: sponsorId,
        referral_code: newCode,
        tier: 0,
        rank: 'new',
        is_founder: false,
        is_active: false,
        personal_sales_this_month: 0,
        total_sales: 0,
        total_recruits: 0,
        kyc_verified: false,
      });

    if (profileError) {
      console.error('Failed to create ambassador_profiles:', profileError);
      return NextResponse.json(
        { error: 'Failed to create ambassador profile' },
        { status: 500 }
      );
    }

    // 5. Create referral_codes entry for the new ambassador
    const { error: codeError } = await supabase
      .from('referral_codes')
      .insert({
        code: newCode,
        ambassador_id: userId,
        type: 'primary',
        is_active: true,
      });

    if (codeError) {
      console.error('Failed to create referral_code:', codeError);
    }

    // 6. Increment sponsor's total_recruits
    if (sponsorId) {
      try {
        const { error: rpcError } = await supabase.rpc('increment_recruits', { ambassador_id: sponsorId });
        if (rpcError) throw rpcError;
      } catch {
        // Fallback: direct update if RPC doesn't exist
        const { data } = await supabase
          .from('ambassador_profiles')
          .select('total_recruits')
          .eq('id', sponsorId)
          .single();
        if (data) {
          await supabase
            .from('ambassador_profiles')
            .update({ total_recruits: (data.total_recruits || 0) + 1 })
            .eq('id', sponsorId);
        }
      }
    }

    return NextResponse.json({
      success: true,
      referralCode: newCode,
      sponsorId,
    });
  } catch (err: any) {
    console.error('Setup ambassador error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
