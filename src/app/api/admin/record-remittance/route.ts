import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, createServiceClient } from '@/lib/supabase/server';
import { syncPackBalances } from '@/lib/commerce/service';

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
    const { packId, amount, method, reference, notes } = body;
    const normalizedAmount = Number(amount);

    if (!packId || !Number.isFinite(normalizedAmount) || normalizedAmount <= 0 || !method) {
      return NextResponse.json(
        { success: false, error: 'packId, positive amount, and method are required' },
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

    await supabase.from('pack_remittances').insert({
      pack_id: packId,
      ambassador_id: pack.ambassador_id,
      amount: normalizedAmount,
      method,
      reference: reference || null,
      notes: notes || null,
      recorded_by: user.id,
    });

    await supabase
      .from('ambassador_packs')
      .update({
        remitted_amount: Number(pack.remitted_amount || 0) + normalizedAmount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', packId);

    const updatedPack = await syncPackBalances(supabase, packId);

    return NextResponse.json({ success: true, pack: updatedPack });
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
