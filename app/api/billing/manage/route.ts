// app/api/billing/manage/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getRequestContext } from '@cloudflare/next-on-pages';
import Stripe from 'stripe';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const userId = session.user.id;

    // Access the D1 database and environment variables from the Cloudflare context
    const context = getRequestContext();
    const db: D1Database = context.env.CASTFORM_DB;

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY!;
    const appUrl = process.env.API_BASE_URL!;

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-06-20' as any,
    });

    // Get the user's Stripe customer ID
    const userResult = await db.prepare('SELECT stripe_customer_id FROM users WHERE id = ?').bind(userId).first<{ stripe_customer_id: string | null }>();

    const customerId = userResult?.stripe_customer_id;

    if (!customerId) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
    }

    // Create a Stripe Customer Portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appUrl}/billing`,
    });

    if (!portalSession.url) {
      return NextResponse.json({ error: 'Error creating portal session' }, { status: 500 });
    }

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('Error creating billing portal session:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
