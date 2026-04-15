import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createServiceClient } from '@/lib/supabase/server';
import { processOrderRewards } from '@/lib/commission/process-order';

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

    const body = await request.json();
    const units = Number(body.units || 1);
    const confirmAge = !!body.ageVerified;

    if (!Number.isFinite(units) || units < 1 || units > 25) {
      return NextResponse.json(
        { success: false, error: 'units must be between 1 and 25' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('age_verified')
      .eq('id', user.id)
      .single();

    const { data: buyerProfile } = await supabase
      .from('buyer_profiles')
      .select('referred_by, total_orders')
      .eq('id', user.id)
      .single();

    if (!buyerProfile?.referred_by) {
      return NextResponse.json(
        { success: false, error: 'Buyer profile missing sponsor attribution' },
        { status: 400 }
      );
    }

    const ageVerified = !!profile?.age_verified || confirmAge;
    if (!ageVerified) {
      return NextResponse.json(
        { success: false, error: 'Age verification is required for retail checkout' },
        { status: 400 }
      );
    }

    const { data: sponsor } = await supabase
      .from('ambassador_profiles')
      .select('id, referral_code')
      .eq('id', buyerProfile.referred_by)
      .single();

    if (!sponsor?.referral_code) {
      return NextResponse.json(
        { success: false, error: 'Sponsor referral code not available' },
        { status: 400 }
      );
    }

    const total = units * 25;
    const orderId = crypto.randomUUID();

    const { error: orderError } = await supabase.from('orders').insert({
      id: orderId,
      buyer_id: user.id,
      ambassador_code: sponsor.referral_code,
      ambassador_id: sponsor.id,
      order_type: 'retail',
      units,
      total,
      subtotal: total,
      discount: 0,
      payment_status: 'paid',
      settlement_status: 'pending',
      items: [
        {
          productId: 'FAME-001',
          productName: 'FameBar',
          quantity: units,
          unitPrice: 25,
          lineTotal: total,
        },
      ],
      metadata: {
        placed_by: 'buyer_portal',
      },
      age_verified: true,
    });

    if (orderError) {
      return NextResponse.json(
        { success: false, error: orderError.message },
        { status: 500 }
      );
    }

    await supabase
      .from('profiles')
      .update({
        age_verified: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    await supabase
      .from('buyer_profiles')
      .update({
        total_orders: Number(buyerProfile.total_orders || 0) + 1,
      })
      .eq('id', user.id);

    const rewards = await processOrderRewards({ supabase, orderId });

    return NextResponse.json({
      success: true,
      orderId,
      total,
      rewardsProcessed: true,
      commissionCount: rewards.commissionCount,
      totalTokens: rewards.totalTokens,
      alreadyProcessed: rewards.alreadyProcessed,
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
