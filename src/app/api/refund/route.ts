/**
 * API Route: Process Refund / Clawback
 *
 * POST /api/refund
 *
 * Processes refunds and claws back commissions and tokens for an order.
 * Updates order status and associated commission/token events.
 *
 * Request body: { orderId: string, reason?: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface RefundRequest {
  orderId: string;
  reason?: string;
}

interface RefundResponse {
  success: boolean;
  orderId: string;
  commissionClawedBack: number;
  tokensClawedBack: number;
  error?: string;
}

// ============================================================================
// POST HANDLER
// ============================================================================

export async function POST(
  request: NextRequest
): Promise<NextResponse<RefundResponse>> {
  try {
    const body = (await request.json()) as RefundRequest;
    const { orderId, reason } = body;

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          orderId: '',
          commissionClawedBack: 0,
          tokensClawedBack: 0,
          error: 'orderId is required',
        },
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
        {
          success: false,
          orderId,
          commissionClawedBack: 0,
          tokensClawedBack: 0,
          error: 'Order not found',
        },
        { status: 404 }
      );
    }

    if (order.settlement_status === 'clawedback' || order.settlement_status === 'refunded') {
      return NextResponse.json(
        {
          success: false,
          orderId,
          commissionClawedBack: 0,
          tokensClawedBack: 0,
          error: `Order already ${order.settlement_status}`,
        },
        { status: 400 }
      );
    }

    // Clawback commissions
    const { data: commissions } = await supabase
      .from('commission_events')
      .select('*')
      .eq('order_id', orderId);

    let totalCommissionClawed = 0;

    if (commissions && commissions.length > 0) {
      for (const commission of commissions) {
        if (
          commission.status === 'pending' ||
          commission.status === 'available' ||
          commission.status === 'paid'
        ) {
          totalCommissionClawed += commission.amount || 0;
        }
      }

      // Update commission status
      await supabase
        .from('commission_events')
        .update({
          status: 'clawedback',
        })
        .eq('order_id', orderId)
        .in('status', ['pending', 'available', 'paid']);
    }

    // Clawback tokens
    const { data: tokens } = await supabase
      .from('token_events')
      .select('*')
      .eq('order_id', orderId);

    let totalTokensClawed = 0;

    if (tokens && tokens.length > 0) {
      for (const token of tokens) {
        if (
          token.status === 'pending' ||
          token.status === 'available' ||
          token.status === 'spent'
        ) {
          totalTokensClawed += token.final_tokens || 0;
        }
      }

      // Update token status
      await supabase
        .from('token_events')
        .update({
          status: 'clawedback',
        })
        .eq('order_id', orderId)
        .in('status', ['pending', 'available', 'spent']);
    }

    // Update order status
    await supabase
      .from('orders')
      .update({
        settlement_status: 'clawedback',
        payment_status: 'refunded',
        refunded_at: new Date().toISOString(),
        ...(reason && { refund_reason: reason }),
      })
      .eq('id', orderId);

    // Token clawback is recorded on token_events above (buyer_profiles table is dropped)

    return NextResponse.json({
      success: true,
      orderId,
      commissionClawedBack: totalCommissionClawed,
      tokensClawedBack: totalTokensClawed,
    });
  } catch (error) {
    console.error('Refund processing error:', error);
    return NextResponse.json(
      {
        success: false,
        orderId: '',
        commissionClawedBack: 0,
        tokensClawedBack: 0,
        error:
          error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
