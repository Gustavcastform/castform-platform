import { NextResponse } from 'next/server';
export const runtime = 'edge';

export async function GET() {
  return NextResponse.json({ phoneNumberId: 'd61b3554-f358-4073-9982-ac23c51c4411' });
}
