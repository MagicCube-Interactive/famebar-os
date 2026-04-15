import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createServiceClient } from '@/lib/supabase/server';
import { createPackRecord, promoteBuyerToAmbassador } from '@/lib/commerce/service';

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

    const pack = await createPackRecord({
      supabase,
      ambassadorId: promotion.ambassadorId,
      approvedBy: user.id,
      mode: 'consignment',
      notes,
      referralCodeIssued: promotion.referralCode,
    });

    return NextResponse.json({
      success: true,
      promoted: promotion.created,
      ambassadorId: promotion.ambassadorId,
      referralCode: promotion.referralCode,
      pack,
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
