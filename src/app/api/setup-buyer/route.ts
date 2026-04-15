import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, referralCode, telegramHandle, signalHandle, ageVerified } = body;

    if (!userId || !referralCode) {
      return NextResponse.json(
        { success: false, error: 'userId and referralCode are required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: sponsorCode, error: sponsorError } = await supabase
      .from('referral_codes')
      .select('ambassador_id')
      .eq('code', String(referralCode).trim().toUpperCase())
      .eq('is_active', true)
      .single();

    if (sponsorError || !sponsorCode) {
      return NextResponse.json(
        { success: false, error: 'Sponsor code not found or inactive' },
        { status: 404 }
      );
    }

    const { data: existingBuyer } = await supabase
      .from('buyer_profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    await supabase
      .from('profiles')
      .update({
        role: 'buyer',
        telegram_handle: telegramHandle || null,
        signal_handle: signalHandle || null,
        age_verified: !!ageVerified,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (!existingBuyer) {
      const { error: buyerError } = await supabase.from('buyer_profiles').insert({
        id: userId,
        referred_by: sponsorCode.ambassador_id,
        fame_balance: 0,
        hold_to_save_tier: 0,
        total_orders: 0,
      });

      if (buyerError) {
        return NextResponse.json(
          { success: false, error: buyerError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      sponsorId: sponsorCode.ambassador_id,
    });
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
