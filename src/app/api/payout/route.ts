/**
 * API Route: Process Payout
 *
 * POST /api/payout
 *
 * Admin endpoint for marking commissions as paid.
 * Updates commission events with payment details.
 */

import { NextRequest, NextResponse } from 'next/server';
import { AccessError, requireAdminActor } from '@/lib/server/auth-guards';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface PayoutRequest {
  commissionIds: string[];
  payoutMethod: 'cash' | 'zelle' | 'venmo';
  paymentReference: string;
}

interface PayoutResponse {
  success: boolean;
  paidCount?: number;
  totalAmount?: number;
  error?: string;
}

// ============================================================================
// POST HANDLER
// ============================================================================

export async function POST(
  request: NextRequest
): Promise<NextResponse<PayoutResponse>> {
  try {
    const { supabase } = await requireAdminActor();
    const body = (await request.json()) as PayoutRequest;
    const { commissionIds, payoutMethod, paymentReference } = body;

    // ---- Validation ----
    if (!commissionIds || !Array.isArray(commissionIds) || commissionIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'commissionIds must be a non-empty array' },
        { status: 400 }
      );
    }

    const validMethods = ['cash', 'zelle', 'venmo'];
    if (!payoutMethod || !validMethods.includes(payoutMethod)) {
      return NextResponse.json(
        { success: false, error: 'payoutMethod must be cash, zelle, or venmo' },
        { status: 400 }
      );
    }

    if (!paymentReference || typeof paymentReference !== 'string' || paymentReference.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'paymentReference is required' },
        { status: 400 }
      );
    }

    // ---- Fetch commissions to validate they exist and are available ----
    const { data: commissions, error: fetchError } = await supabase
      .from('commission_events')
      .select('id, amount, status')
      .in('id', commissionIds);

    if (fetchError) {
      console.error('Error fetching commissions:', fetchError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch commissions' },
        { status: 500 }
      );
    }

    if (!commissions || commissions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No matching commissions found' },
        { status: 404 }
      );
    }

    // Only pay commissions that are in 'available' status
    const payableIds = commissions
      .filter((c) => c.status === 'available')
      .map((c) => c.id);

    if (payableIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No commissions in available status to pay' },
        { status: 400 }
      );
    }

    const totalAmount = commissions
      .filter((c) => c.status === 'available')
      .reduce((sum, c) => sum + Number(c.amount), 0);

    // ---- Update commission events ----
    const { error: updateError } = await supabase
      .from('commission_events')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        payment_reference: paymentReference.trim(),
        payout_method: payoutMethod,
      })
      .in('id', payableIds);

    if (updateError) {
      console.error('Error updating commissions:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update commissions' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      paidCount: payableIds.length,
      totalAmount,
    });
  } catch (error) {
    if (error instanceof AccessError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: error.status }
      );
    }
    console.error('Payout error:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
