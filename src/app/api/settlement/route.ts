/**
 * API Route: Process Settlement
 *
 * POST /api/settlement
 *
 * Settles orders that have passed the 14-day settlement window.
 * Moves commissions and tokens from pending to available status.
 *
 * Request body: { orderId?: string, daysOld?: number }
 * If orderId: settles that specific order
 * If daysOld: settles all orders older than daysOld days
 */

import { NextRequest, NextResponse } from 'next/server';
import { AccessError, requireAdminActor } from '@/lib/server/auth-guards';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface SettlementRequest {
  orderId?: string;
  daysOld?: number;
}

interface SettlementResponse {
  success: boolean;
  settledCount: number;
  totalCommissionReleased: number;
  totalTokensReleased: number;
  error?: string;
}

// ============================================================================
// POST HANDLER
// ============================================================================

export async function POST(
  request: NextRequest
): Promise<NextResponse<SettlementResponse>> {
  try {
    const { supabase } = await requireAdminActor();
    const body = (await request.json()) as SettlementRequest;
    const { orderId, daysOld } = body;

    if (orderId) {
      // Settle specific order
      return await settleOrder(supabase, orderId);
    } else {
      // Settle batch of old orders
      const days = daysOld || 14;
      return await settleBatch(supabase, days);
    }
  } catch (error) {
    if (error instanceof AccessError) {
      return NextResponse.json(
        {
          success: false,
          settledCount: 0,
          totalCommissionReleased: 0,
          totalTokensReleased: 0,
          error: error.message,
        },
        { status: error.status }
      );
    }
    console.error('Settlement processing error:', error);
    return NextResponse.json(
      {
        success: false,
        settledCount: 0,
        totalCommissionReleased: 0,
        totalTokensReleased: 0,
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
 * Settle a specific order
 */
async function settleOrder(supabase: any, orderId: string) {
  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (!order) {
    return NextResponse.json(
      {
        success: false,
        settledCount: 0,
        totalCommissionReleased: 0,
        totalTokensReleased: 0,
        error: 'Order not found',
      },
      { status: 404 }
    );
  }

  if (order.settlement_status !== 'pending') {
    return NextResponse.json(
      {
        success: false,
        settledCount: 0,
        totalCommissionReleased: 0,
        totalTokensReleased: 0,
        error: `Order already ${order.settlement_status}`,
      },
      { status: 400 }
    );
  }

  // Release commissions
  const { data: commissions } = await supabase
    .from('commission_events')
    .select('*')
    .eq('order_id', orderId);

  let totalCommission = 0;
  if (commissions && commissions.length > 0) {
    for (const commission of commissions) {
      totalCommission += commission.amount || 0;
    }

    await supabase
      .from('commission_events')
      .update({
        status: 'available',
        available_at: new Date().toISOString(),
      })
      .eq('order_id', orderId)
      .eq('status', 'pending');
  }

  // Release tokens
  const { data: tokens } = await supabase
    .from('token_events')
    .select('*')
    .eq('order_id', orderId);

  let totalTokens = 0;
  if (tokens && tokens.length > 0) {
    for (const token of tokens) {
      totalTokens += token.final_tokens || 0;
    }

    await supabase
      .from('token_events')
      .update({
        status: 'available',
      })
      .eq('order_id', orderId)
      .eq('status', 'pending');
  }

  // Update order status
  await supabase
    .from('orders')
    .update({
      settlement_status: 'settled',
      settled_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  return NextResponse.json({
    success: true,
    settledCount: 1,
    totalCommissionReleased: totalCommission,
    totalTokensReleased: totalTokens,
  });
}

/**
 * Settle batch of orders older than specified days
 */
async function settleBatch(supabase: any, daysOld: number) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  // Find orders to settle
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('settlement_status', 'pending')
    .lt('created_at', cutoffDate.toISOString());

  if (!orders || orders.length === 0) {
    return NextResponse.json({
      success: true,
      settledCount: 0,
      totalCommissionReleased: 0,
      totalTokensReleased: 0,
    });
  }

  let totalCommission = 0;
  let totalTokens = 0;
  const orderIds = orders.map((o: any) => o.id);

  // Release commissions for all orders
  const { data: allCommissions } = await supabase
    .from('commission_events')
    .select('*')
    .in('order_id', orderIds)
    .eq('status', 'pending');

  if (allCommissions && allCommissions.length > 0) {
    for (const commission of allCommissions) {
      totalCommission += commission.amount || 0;
    }

    await supabase
      .from('commission_events')
      .update({
        status: 'available',
        available_at: new Date().toISOString(),
      })
      .in('order_id', orderIds)
      .eq('status', 'pending');
  }

  // Release tokens for all orders
  const { data: allTokens } = await supabase
    .from('token_events')
    .select('*')
    .in('order_id', orderIds)
    .eq('status', 'pending');

  if (allTokens && allTokens.length > 0) {
    for (const token of allTokens) {
      totalTokens += token.final_tokens || 0;
    }

    await supabase
      .from('token_events')
      .update({
        status: 'available',
      })
      .in('order_id', orderIds)
      .eq('status', 'pending');
  }

  // Update orders
  await supabase
    .from('orders')
    .update({
      settlement_status: 'settled',
      settled_at: new Date().toISOString(),
    })
    .in('id', orderIds);

  return NextResponse.json({
    success: true,
    settledCount: orders.length,
    totalCommissionReleased: totalCommission,
    totalTokensReleased: totalTokens,
  });
}
