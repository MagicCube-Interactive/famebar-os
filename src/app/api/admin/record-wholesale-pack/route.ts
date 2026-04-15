import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createServiceClient } from '@/lib/supabase/server';
import {
  createPackRecord,
  getPackFinancials,
  promoteBuyerToAmbassador,
} from '@/lib/commerce/service';
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

    const supabase = createAdminClient();
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (adminProfile?.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, notes } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
    }

    const promotion = await promoteBuyerToAmbassador({ supabase, userId });

    if (promotion.created && promotion.sponsorId) {
      const { data: sponsor } = await supabase
        .from('ambassador_profiles')
        .select('total_recruits')
        .eq('id', promotion.sponsorId)
        .single();

      await supabase
        .from('ambassador_profiles')
        .update({
          total_recruits: Number(sponsor?.total_recruits || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', promotion.sponsorId);
    }

    const { data: blockingPack } = await supabase
      .from('ambassador_packs')
      .select('id, remittance_balance')
      .eq('ambassador_id', promotion.ambassadorId)
      .eq('mode', 'consignment')
      .gt('remittance_balance', 0)
      .maybeSingle();

    if (blockingPack) {
      return NextResponse.json(
        {
          success: false,
          error: 'This ambassador still has remittance due on an existing consignment pack',
        },
        { status: 400 }
      );
    }

    const { data: ambassador } = await supabase
      .from('ambassador_profiles')
      .select('referral_code')
      .eq('id', promotion.ambassadorId)
      .single();

    const pack = await createPackRecord({
      supabase,
      ambassadorId: promotion.ambassadorId,
      approvedBy: user.id,
      mode: 'wholesale',
      notes,
      referralCodeIssued: ambassador?.referral_code || promotion.referralCode,
      status: 'paid',
    });

    const financials = getPackFinancials();
    const orderId = crypto.randomUUID();

    const { error: orderError } = await supabase.from('orders').insert({
      id: orderId,
      buyer_id: promotion.ambassadorId,
      ambassador_code: ambassador?.referral_code || promotion.referralCode,
      ambassador_id: promotion.ambassadorId,
      order_type: 'wholesale_pack',
      units: financials.quantity,
      pack_id: pack.id,
      total: financials.wholesaleTotal,
      subtotal: financials.wholesaleTotal,
      discount: 0,
      payment_status: 'paid',
      settlement_status: 'pending',
      items: [
        {
          productId: 'FAME-50PACK',
          productName: 'FameBar 50-Pack Wholesale',
          quantity: financials.quantity,
          unitPrice: 18.75,
          lineTotal: financials.wholesaleTotal,
        },
      ],
      metadata: {
        commission_base_total: financials.retailTotal,
        direct_margin_value: financials.ambassadorCash,
        source: 'wholesale_pack',
      },
      age_verified: true,
    });

    if (orderError) {
      return NextResponse.json({ success: false, error: orderError.message }, { status: 500 });
    }

    await supabase
      .from('ambassador_packs')
      .update({
        purchase_order_id: orderId,
        payment_received_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', pack.id);

    const rewards = await processOrderRewards({ supabase, orderId });

    return NextResponse.json({
      success: true,
      promoted: promotion.created,
      orderId,
      packId: pack.id,
      total: financials.wholesaleTotal,
      commissionsCreated: rewards.commissionCount,
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
