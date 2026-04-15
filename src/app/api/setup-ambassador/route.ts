import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error:
        'Legacy route disabled. Ambassador setup now happens only when an admin approves a 50-pack through the Commerce Hub.',
    },
    { status: 410 }
  );
}
