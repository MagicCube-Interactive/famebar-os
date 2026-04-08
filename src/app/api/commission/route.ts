/**
 * API Route: Process Commission on Order
 *
 * POST /api/commission
 *
 * Triggered when an order is completed.
 * Orchestrates commission calculation and token award for the order.
 *
 * Flow:
 * 1. Fetch order details and ambassador profile
 * 2. Build sponsor hierarchy (team tree)
 * 3. Calculate commission chain (all 7 tiers)
 * 4. Calculate token awards
 * 5. Persist CommissionEvent and TokenEvent records
 * 6. Update ambassador profiles with sales and stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import {
  calculateCommissionChain,
  calculateTotalCommissionPayout,
  validateCommissionChain,
} from '@/lib/commission/engine';
import { calculateTokensForOrder, getFounderMultiplier } from '@/lib/tokens/engine';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface CommissionRequest {
  orderId: string;
}

interface CommissionResponse {
  success: boolean;
  orderId: string;
  commissionCount?: number;
  totalCommission?: number;
  totalTokens?: number;
  error?: string;
}

// ============================================================================
// POST HANDLER
// ============================================================================

export async function POST(
  request: NextRequest
): Promise<NextResponse<CommissionResponse>> {
  try {
    const body = (await request.json()) as CommissionRequest;
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, orderId: '', error: 'orderId is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Fetch order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, orderId, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Verify order is paid
    if (order.payment_status !== 'paid') {
      return NextResponse.json(
        {
          success: false,
          orderId,
          error: `Order payment status is ${order.payment_status}, not paid`,
        },
        { status: 400 }
      );
    }

    // Fetch ambassador
    const { data: ambassador, error: ambError } = await supabase
      .from('ambassador_profiles')
      .select('*')
      .eq('id', order.ambassador_id)
      .single();

    if (ambError || !ambassador) {
      return NextResponse.json(
        { success: false, orderId, error: 'Ambassador not found' },
        { status: 404 }
      );
    }

    // Build team tree (sponsor chain)
    const teamTree = await buildTeamTree(supabase, order.ambassador_id);

    // Calculate commission chain
    const commissionEvents = calculateCommissionChain(
      orderId,
      order.total,
      order.ambassador_id,
      teamTree
    );

    // Validate chain
    const validation = validateCommissionChain(commissionEvents);

    // Calculate token event
    const tokenEvent = calculateTokensForOrder(
      order.total,
      order.ambassador_id,
      ambassador.is_founder,
      ambassador.founder_start_date,
      orderId
    );

    // Insert commission events
    const { error: commError } = await supabase
      .from('commission_events')
      .insert(
        commissionEvents.map((e) => ({
          id: e.commissionId,
          order_id: e.orderId,
          ambassador_id: e.ambassadorId,
          tier: e.tier,
          rate: e.rate,
          amount: e.amount,
          status: 'pending',
          source_ambassador_id: e.sourceAmbassadorId,
          created_at: new Date().toISOString(),
        }))
      );

    if (commError) {
      console.error('Error inserting commissions:', commError);
      return NextResponse.json(
        { success: false, orderId, error: 'Failed to insert commissions' },
        { status: 500 }
      );
    }

    // Insert token event
    const { error: tokenError } = await supabase
      .from('token_events')
      .insert({
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
      console.error('Error inserting token event:', tokenError);
      return NextResponse.json(
        { success: false, orderId, error: 'Failed to insert token event' },
        { status: 500 }
      );
    }

    // Update order with referral chain
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        referral_chain: commissionEvents.map((e) => ({
          ambassadorId: e.ambassadorId,
          tier: e.tier,
          commissionRate: e.rate,
          commissionAmount: e.amount,
          hasFounderBoost: e.tier === 0 && ambassador.is_founder,
        })),
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Error updating order:', updateError);
      return NextResponse.json(
        { success: false, orderId, error: 'Failed to update order' },
        { status: 500 }
      );
    }

    // Update ambassador stats
    await updateAmbassadorStats(supabase, order.ambassador_id, order.total);

    return NextResponse.json({
      success: true,
      orderId,
      commissionCount: commissionEvents.length,
      totalCommission: commissionEvents.reduce((sum, e) => sum + e.amount, 0),
      totalTokens: tokenEvent.finalTokens,
    });
  } catch (error) {
    console.error('Commission processing error:', error);
    return NextResponse.json(
      {
        success: false,
        orderId: '',
        error:
          error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Build team tree from sponsor chain
 */
async function buildTeamTree(supabase: any, ambassadorId: string) {
  const tree: Record<string, any> = {};
  const visited = new Set<string>();

  async function walkChain(currentId: string, level: number = 0): Promise<void> {
    if (visited.has(currentId)) return;
    visited.add(currentId);

    const { data: amb, error } = await supabase
      .from('ambassador_profiles')
      .select('*')
      .eq('id', currentId)
      .single();

    if (error || !amb) return;

    const path = [currentId];
    if (amb.sponsor_id && tree[amb.sponsor_id]) {
      path.unshift(...tree[amb.sponsor_id].path);
    }

    tree[currentId] = {
      ambassadorId: currentId,
      sponsorId: amb.sponsor_id,
      level,
      directRecruits: [],
      path,
      personalSalesThisMonth: amb.personal_sales_this_month || 0,
      teamSalesThisMonth: amb.total_sales || 0,
      isActive: amb.is_active,
      updatedAt: new Date().toISOString(),
    };

    if (amb.sponsor_id) {
      await walkChain(amb.sponsor_id, level + 1);
    }
  }

  await walkChain(ambassadorId);
  return tree;
}

/**
 * Update ambassador statistics after a sale
 */
async function updateAmbassadorStats(
  supabase: any,
  ambassadorId: string,
  orderAmount: number
): Promise<void> {
  try {
    const { data: amb, error } = await supabase
      .from('ambassador_profiles')
      .select('*')
      .eq('id', ambassadorId)
      .single();

    if (error || !amb) return;

    const newPersonalSales = (amb.personal_sales_this_month || 0) + orderAmount;
    const newTotalSales = (amb.total_sales || 0) + orderAmount;
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
    // Non-critical, don't throw
  }
}
