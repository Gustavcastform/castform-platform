// app/api/billing/subscribe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getRequestContext } from '@cloudflare/next-on-pages';
import Stripe from 'stripe';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const userId = session.user.id;

  // Access the D1 database and environment variables from the Cloudflare context
  const context = getRequestContext();
  const db: D1Database = context.env.CASTFORM_DB;

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY!;
  const priceId = process.env.STRIPE_PRICE_ID!;
  const appUrl = process.env.API_BASE_URL!;

  // Initialize Stripe
  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2024-06-20' as any,
  });

  // Check if the user already has a Stripe customer ID
  const userResult = await db.prepare('SELECT stripe_customer_id FROM users WHERE id = ?').bind(userId).first<{ stripe_customer_id: string | null }>();

  let customerId = userResult?.stripe_customer_id;

  // If not, create a new Stripe customer
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email!,
      name: session.user.name!,
      metadata: {
        userId: userId,
      },
    });
    customerId = customer.id;

    // Save the new customer ID to the user's record
    await db.prepare('UPDATE users SET stripe_customer_id = ? WHERE id = ?').bind(customerId, userId).run();
  }

  // Create a Stripe Checkout session
  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${appUrl}/billing?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/billing`,
    metadata: {
      userId: userId,
    },
  });

  if (!checkoutSession.url) {
    return new NextResponse('Error creating checkout session', { status: 500 });
  }

  return NextResponse.json({ url: checkoutSession.url });
}
