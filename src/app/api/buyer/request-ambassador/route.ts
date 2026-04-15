import { NextResponse } from 'next/server';
import { AccessError, getRequestActor } from '@/lib/server/auth-guards';

export async function POST() {
  try {
    const { user, role, supabase } = await getRequestActor();

    if (role !== 'buyer' && role !== 'ambassador' && role !== 'admin') {
      throw new AccessError('Buyer access required', 403);
    }

    const { data: existing } = await supabase
      .from('buyer_profiles')
      .select('requested_ambassador_at, promoted_at')
      .eq('id', user.id)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Buyer profile not found' },
        { status: 404 }
      );
    }

    if (existing.promoted_at) {
      return NextResponse.json({
        success: true,
        alreadyPromoted: true,
      });
    }

    if (existing.requested_ambassador_at) {
      return NextResponse.json({
        success: true,
        alreadyRequested: true,
        requestedAt: existing.requested_ambassador_at,
      });
    }

    await supabase
      .from('buyer_profiles')
      .update({
        requested_ambassador_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    return NextResponse.json({ success: true });
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
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
