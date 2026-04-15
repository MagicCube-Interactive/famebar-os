import {
  calculateCommissionChain,
  calculateWholesalePackCommissionChain,
  validateCommissionChain,
} from '@/lib/commission/engine';
import { calculateTokensForOrder } from '@/lib/tokens/engine';
import { buildTeamTree } from '@/lib/commerce/service';

export interface ProcessOrderRewardsResult {
  orderId: string;
  commissionCount: number;
  totalCommission: number;
  totalTokens: number;
  alreadyProcessed: boolean;
}

export async function processOrderRewards({
  supabase,
  orderId,
}: {
  supabase: any;
  orderId: string;
}): Promise<ProcessOrderRewardsResult> {
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    throw new Error('Order not found');
  }

  if (order.payment_status !== 'paid') {
    throw new Error(`Order payment status is ${order.payment_status}, not paid`);
  }

  const { data: ambassador, error: ambError } = await supabase
    .from('ambassador_profiles')
    .select('*')
    .eq('id', order.ambassador_id)
    .single();

  if (ambError || !ambassador) {
    throw new Error('Ambassador not found');
  }

  const orderType = order.order_type || 'retail';
  const units = Number(order.units) || Number(order.items?.[0]?.quantity) || 1;

  const [existingCommissionsResult, existingTokensResult] = await Promise.all([
    supabase
      .from('commission_events')
      .select('*')
      .eq('order_id', orderId),
    supabase
      .from('token_events')
      .select('*')
      .eq('order_id', orderId),
  ]);

  const existingCommissions = existingCommissionsResult.data || [];
  const existingTokens = existingTokensResult.data || [];
  const hadExistingRewards =
    existingCommissions.length > 0 ||
    (orderType !== 'wholesale_pack' && existingTokens.length > 0);

  let commissionEvents = existingCommissions;
  let tokenEvent = existingTokens[0] || null;

  if (existingCommissions.length === 0) {
    const teamTree = await buildTeamTree(supabase, order.ambassador_id);
    const commissionBaseTotal =
      orderType === 'wholesale_pack'
        ? Number(order.metadata?.commission_base_total || 0)
        : Number(order.total);

    commissionEvents =
      orderType === 'wholesale_pack'
        ? calculateWholesalePackCommissionChain(
            orderId,
            commissionBaseTotal,
            order.ambassador_id,
            teamTree
          )
        : calculateCommissionChain(orderId, Number(order.total), order.ambassador_id, teamTree);

    const validation = validateCommissionChain(commissionEvents);
    if (!validation.valid) {
      throw new Error(validation.errors.join(', ') || 'Invalid commission chain');
    }

    if (commissionEvents.length > 0) {
      const { error: commError } = await supabase.from('commission_events').insert(
        commissionEvents.map((event: any) => ({
          id: event.commissionId,
          order_id: event.orderId,
          ambassador_id: event.ambassadorId,
          tier: event.tier,
          rate: event.rate,
          amount: event.amount,
          status: 'pending',
          source_ambassador_id: event.sourceAmbassadorId,
          created_at: new Date().toISOString(),
        }))
      );

      if (commError) {
        throw new Error('Failed to insert commissions');
      }
    }
  }

  if (orderType !== 'wholesale_pack' && !tokenEvent) {
    tokenEvent = calculateTokensForOrder(
      units,
      order.ambassador_id,
      ambassador.is_founder,
      ambassador.founder_start_date,
      orderId
    );

    const { error: tokenError } = await supabase.from('token_events').insert({
      id: tokenEvent.eventId,
      ambassador_id: tokenEvent.ambassadorId,
      order_id: tokenEvent.orderId,
      tokens_earned: tokenEvent.tokensEarned,
      founder_multiplier: tokenEvent.founderMultiplier,
      final_tokens: tokenEvent.finalTokens,
      status: 'pending',
      created_at: new Date().toISOString(),
    });

    if (tokenError) {
      throw new Error('Failed to insert token event');
    }
  }

  const referralChain =
    commissionEvents.length > 0
      ? commissionEvents.map((event: any) => ({
          ambassadorId: event.ambassadorId || event.ambassador_id,
          tier: event.tier,
          commissionRate: event.rate,
          commissionAmount: event.amount,
          hasFounderBoost: event.tier === 0 && ambassador.is_founder,
        }))
      : [];

  const metadata = {
    ...(order.metadata || {}),
    rewards_processed_at: new Date().toISOString(),
  };

  const { error: updateOrderError } = await supabase
    .from('orders')
    .update({
      referral_chain: referralChain,
      metadata,
    })
    .eq('id', orderId);

  if (updateOrderError) {
    throw new Error('Failed to update order');
  }

  if (!hadExistingRewards && orderType !== 'wholesale_pack') {
    await updateAmbassadorStats(supabase, order.ambassador_id, Number(order.total));
  }

  return {
    orderId,
    commissionCount: commissionEvents.length,
    totalCommission: commissionEvents.reduce(
      (sum: number, event: any) => sum + Number(event.amount || 0),
      0
    ),
    totalTokens: tokenEvent ? Number(tokenEvent.finalTokens || tokenEvent.final_tokens || 0) : 0,
    alreadyProcessed: hadExistingRewards,
  };
}

async function updateAmbassadorStats(
  supabase: any,
  ambassadorId: string,
  orderAmount: number
): Promise<void> {
  try {
    const { data: ambassador, error } = await supabase
      .from('ambassador_profiles')
      .select('*')
      .eq('id', ambassadorId)
      .single();

    if (error || !ambassador) {
      return;
    }

    const newPersonalSales = Number(ambassador.personal_sales_this_month || 0) + orderAmount;
    const newTotalSales = Number(ambassador.total_sales || 0) + orderAmount;
    const nowActive = newPersonalSales >= 300;

    await supabase
      .from('ambassador_profiles')
      .update({
        personal_sales_this_month: newPersonalSales,
        total_sales: newTotalSales,
        is_active: nowActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ambassadorId);
  } catch (error) {
    console.error('Failed to update ambassador stats:', error);
  }
}
