import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createServiceClient } from '@/lib/supabase/server';
import {
  DIRECT_UNIT_COMMISSION,
  REMITTANCE_UNIT_AMOUNT,
  syncPackBalances,
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
    const {
      packId,
      buyerId,
      units,
      paymentMethod,
      customerName,
      notes,
      ageVerified = true,
    } = body;

    const normalizedUnits = Number(units);
    if (!packId || !Number.isFinite(normalizedUnits) || normalizedUnits < 1) {
      return NextResponse.json(
        { success: false, error: 'packId and positive units are required' },
        { status: 400 }
      );
    }

    if (!['cash', 'zelle', 'venmo'].includes(paymentMethod)) {
      return NextResponse.json(
        { success: false, error: 'paymentMethod must be cash, zelle, or venmo' },
        { status: 400 }
      );
    }

    if (!ageVerified) {
      return NextResponse.json(
        { success: false, error: 'Age verification is required before recording a sale' },
        { status: 400 }
      );
    }

    const { data: pack, error: packError } = await supabase
      .from('ambassador_packs')
      .select('*')
      .eq('id', packId)
      .single();

    if (packError || !pack || pack.mode !== 'consignment') {
      return NextResponse.json({ success: false, error: 'Consignment pack not found' }, { status: 404 });
    }

    if (Number(pack.outstanding_units || 0) < normalizedUnits) {
      return NextResponse.json(
        { success: false, error: 'Not enough approved units remaining on this pack' },
        { status: 400 }
      );
    }

    const { data: ambassador } = await supabase
      .from('ambassador_profiles')
      .select('referral_code')
      .eq('id', pack.ambassador_id)
      .single();

    const total = normalizedUnits * 25;
    const orderId = crypto.randomUUID();

    const { error: orderError } = await supabase.from('orders').insert({
      id: orderId,
      buyer_id: buyerId || null,
      ambassador_code: ambassador?.referral_code || pack.referral_code_issued,
      ambassador_id: pack.ambassador_id,
      order_type: 'consignment_sale',
      units: normalizedUnits,
      pack_id: packId,
      total,
      subtotal: total,
      discount: 0,
      payment_status: 'paid',
      settlement_status: 'pending',
      items: [
        {
          productId: 'FAME-001',
          productName: 'FameBar',
          quantity: normalizedUnits,
          unitPrice: 25,
          lineTotal: total,
          customerName: customerName || null,
          paymentMethod,
          notes: notes || null,
        },
      ],
      metadata: {
        source: 'consignment_pack',
        pack_id: packId,
      },
      age_verified: !!ageVerified,
    });

    if (orderError) {
      return NextResponse.json({ success: false, error: orderError.message }, { status: 500 });
    }

    await supabase.from('pack_sale_events').insert({
      pack_id: packId,
      order_id: orderId,
      ambassador_id: pack.ambassador_id,
      buyer_id: buyerId || null,
      units: normalizedUnits,
      gross_revenue: total,
      ambassador_cash_earned: normalizedUnits * DIRECT_UNIT_COMMISSION,
      remittance_due: normalizedUnits * REMITTANCE_UNIT_AMOUNT,
      payment_method: paymentMethod,
      customer_name: customerName || null,
      notes: notes || null,
      recorded_by: user.id,
    });

    await supabase
      .from('ambassador_packs')
      .update({
        units_sold: Number(pack.units_sold || 0) + normalizedUnits,
        cash_retained:
          Number(pack.cash_retained || 0) +
          normalizedUnits * DIRECT_UNIT_COMMISSION,
        remittance_due:
          Number(pack.remittance_due || 0) +
          normalizedUnits * REMITTANCE_UNIT_AMOUNT,
        updated_at: new Date().toISOString(),
      })
      .eq('id', packId);

    if (buyerId) {
      const { data: buyerProfile } = await supabase
        .from('buyer_profiles')
        .select('total_orders')
        .eq('id', buyerId)
        .maybeSingle();

      if (buyerProfile) {
        await supabase
          .from('buyer_profiles')
          .update({
            total_orders: Number(buyerProfile.total_orders || 0) + 1,
          })
          .eq('id', buyerId);
      }
    }

    const updatedPack = await syncPackBalances(supabase, packId);
    const rewards = await processOrderRewards({ supabase, orderId });

    return NextResponse.json({
      success: true,
      orderId,
      pack: updatedPack,
      rewardsProcessed: true,
      commissionsCreated: rewards.commissionCount,
      tokensAwarded: rewards.totalTokens,
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
