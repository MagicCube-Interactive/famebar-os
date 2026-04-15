import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')?.trim().toUpperCase();

  if (!code) {
    return NextResponse.json({ valid: false }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('referral_codes')
      .select(
        'code, ambassador_id, ambassador_profiles!referral_codes_ambassador_id_fkey(id, profiles!ambassador_profiles_id_fkey(full_name))'
      )
      .eq('code', code)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return NextResponse.json({ valid: false }, { status: 404 });
    }

    const sponsorName =
      (data as any).ambassador_profiles?.profiles?.full_name || 'Founding Ambassador';

    return NextResponse.json({
      valid: true,
      sponsorName,
      ambassadorId: data.ambassador_id,
      code: data.code,
    });
  } catch (error) {
    return NextResponse.json(
      { valid: false, error: error instanceof Error ? error.message : 'Lookup failed' },
      { status: 500 }
    );
  }
}
