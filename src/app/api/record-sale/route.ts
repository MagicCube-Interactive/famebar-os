import { NextResponse } from 'next/server';

interface RecordSaleResponse {
  success: boolean;
  error?: string;
}

export async function POST(): Promise<NextResponse<RecordSaleResponse>> {
  return NextResponse.json(
    {
      success: false,
      error:
        'Legacy route disabled. Use /api/admin/record-consignment-sale or /api/admin/record-wholesale-pack through the Commerce Hub.',
    },
    { status: 410 }
  );
}
