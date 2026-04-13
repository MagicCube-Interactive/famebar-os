/**
 * API Route: Record Manual Sale
 *
 * POST /api/record-sale
 *
 * Admin endpoint for recording manual sales (cash/Zelle/Venmo).
 * Creates an order record and triggers commission calculation.
 *
 * Flow:
 * 1. Validate input (units > 0, valid ambassador code)
 * 2. Look up ambassador from referral code
 * 3. Create order record
 * 4. Trigger commission engine
 * 5. Return order summary with commission details
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient, createAdminClient } from '@/lib/supabase/server';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface RecordSaleRequest {
  ambassadorCode: string;
  units: number;
  paymentMethod: 'cash' | 'zelle' | 'venmo';
  customerName?: string;
  notes?: string;
}

interface RecordSaleResponse {
  success: boolean;
  orderId?: string;
  total?: number;
  commissionsCreated?: number;
  tokensAwarded?: number;
  error?: string;
}

// ============================================================================
// POST HANDLER
// ============================================================================

export async function POST(
  request: NextRequest
): Promise<NextResponse<RecordSaleResponse>> {
  try {
    const body = (await request.json()) as RecordSaleRequest;
    const { ambassadorCode, units, paymentMethod, customerName, notes } = body;

    // ---- Validation ----
    if (!ambassadorCode || typeof ambassadorCode !== 'string') {
      return NextResponse.json(
        { success: false, error: 'ambassadorCode is required' },
        { status: 400 }
      );
    }

    if (!units || typeof units !== 'number' || units < 1) {
      return NextResponse.json(
        { success: false, error: 'units must be a positive number' },
        { status: 400 }
      );
    }

    if (units > 100) {
      return NextResponse.json(
        { success: false, error: 'units cannot exceed 100' },
        { status: 400 }
      );
    }

    const validMethods = ['cash', 'zelle', 'venmo'];
    if (!paymentMethod || !validMethods.includes(paymentMethod)) {
      return NextResponse.json(
        { success: false, error: 'paymentMethod must be cash, zelle, or venmo' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // ---- Get authenticated admin user from session cookie ----
    const serviceClient = createServiceClient();
    const {
      data: { user },
    } = await serviceClient.auth.getUser();

    const adminUserId = user?.id || 'system';

    // ---- Look up referral code ----
    const { data: referralCode, error: codeError } = await supabase
      .from('referral_codes')
      .select('id, code, ambassador_id')
      .eq('code', ambassadorCode.toUpperCase())
      .single();

    if (codeError || !referralCode) {
      return NextResponse.json(
        { success: false, error: 'Invalid ambassador code' },
        { status: 404 }
      );
    }

    const ambassadorId = referralCode.ambassador_id;
    const unitPrice = 25;
    const total = units * unitPrice;

    // ---- Create order ----
    const orderId = crypto.randomUUID();

    // The orders table schema: id, buyer_id, ambassador_code, ambassador_id,
    // items, subtotal, discount, total, payment_status, settlement_status,
    // referral_chain, age_verified, created_at, settled_at, refunded_at
    // Note: buyer_id is NOT NULL, so we use the ambassador's own ID
    // for admin-recorded sales (no separate buyer in 2-role system).
    // Extra info (customer_name, paymentMethod, notes) stored in items JSON.
    const { error: orderError } = await supabase.from('orders').insert({
      id: orderId,
      buyer_id: ambassadorId,
      ambassador_code: ambassadorCode.toUpperCase(),
      ambassador_id: ambassadorId,
      total,
      subtotal: total,
      discount: 0,
      payment_status: 'paid',
      settlement_status: 'pending',
      items: [
        {
          productId: 'FAME-001',
          productName: 'FameClub',
          quantity: units,
          unitPrice,
          lineTotal: total,
          customerName: customerName || null,
          paymentMethod,
          recordedBy: adminUserId,
          notes: notes || null,
        },
      ],
      age_verified: true,
    });

    if (orderError) {
      console.error('Error creating order:', orderError);
      return NextResponse.json(
        { success: false, error: 'Failed to create order' },
        { status: 500 }
      );
    }

    // ---- Trigger commission calculation via internal fetch ----
    const commissionUrl = new URL('/api/commission', request.url);
    const commissionRes = await fetch(commissionUrl.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId }),
    });

    let commissionsCreated = 0;
    let tokensAwarded = 0;

    if (commissionRes.ok) {
      const commissionData = await commissionRes.json();
      commissionsCreated = commissionData.commissionCount || 0;
      tokensAwarded = commissionData.totalTokens || 0;
    } else {
      console.error(
        'Commission calculation failed:',
        await commissionRes.text()
      );
      // Order was still created successfully, just note the commission failure
    }

    return NextResponse.json({
      success: true,
      orderId,
      total,
      commissionsCreated,
      tokensAwarded,
    });
  } catch (error) {
    console.error('Record sale error:', error);
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
