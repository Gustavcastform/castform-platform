import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createPaymentRetrySession } from '@/lib/billing';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const paymentSession = await createPaymentRetrySession(session.user.id);
    return NextResponse.json(paymentSession);
  } catch (error) {
    console.error('Error creating payment retry session:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
