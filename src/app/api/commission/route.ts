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
import { processOrderRewards } from '@/lib/commission/process-order';
import { AccessError, requireAdminActor } from '@/lib/server/auth-guards';

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
    const { supabase } = await requireAdminActor();
    const body = (await request.json()) as CommissionRequest;
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, orderId: '', error: 'orderId is required' },
        { status: 400 }
      );
    }

    const result = await processOrderRewards({ supabase, orderId });

    return NextResponse.json({
      success: true,
      orderId: result.orderId,
      commissionCount: result.commissionCount,
      totalCommission: result.totalCommission,
      totalTokens: result.totalTokens,
    });
  } catch (error) {
    if (error instanceof AccessError) {
      return NextResponse.json(
        {
          success: false,
          orderId: '',
          error: error.message,
        },
        { status: error.status }
      );
    }
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
