import { NextRequest, NextResponse } from 'next/server';
import { getRequestContext } from '@cloudflare/next-on-pages';
import { D1Database } from '@cloudflare/workers-types';
import Stripe from 'stripe';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
    const context = getRequestContext();
    const db: D1Database = context.env.CASTFORM_DB;

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY!;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

    console.log(stripeSecretKey, webhookSecret)

    const stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2025-07-30.basil' as any,
    });

    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
        return new NextResponse('Missing stripe-signature header', { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return new NextResponse('Webhook signature verification failed', { status: 400 });
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed':
                await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session, db);
                break;

            case 'invoice.payment_succeeded':
                await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice, db);
                break;

            case 'invoice.payment_failed':
                await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice, db);
                break;

            case 'customer.subscription.updated':
                await handleSubscriptionUpdated(event.data.object as Stripe.Subscription, db);
                break;

            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, db);
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return new NextResponse('Webhook handled successfully', { status: 200 });
    } catch (error) {
        console.error('Error processing webhook:', error);
        return new NextResponse('Webhook processing failed', { status: 500 });
    }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session, db: D1Database) {
    const customerId = session.customer as string;
    const subscriptionId = session.subscription as string;

    if (!customerId || !subscriptionId) {
        console.error('Missing customer ID or subscription ID in checkout session');
        return;
    }

    // Find user by Stripe customer ID
    const userResult = await db.prepare('SELECT id FROM users WHERE stripe_customer_id = ?')
        .bind(customerId)
        .first<{ id: string }>();

    if (!userResult) {
        console.error('User not found for customer ID:', customerId);
        return;
    }

    const userId = userResult.id;

    // Update user subscription status
    await db.prepare(`
    UPDATE users 
    SET subscription_status = 'active', can_make_calls = TRUE 
    WHERE id = ?
  `).bind(userId).run();

    console.log(`Subscription activated for user ${userId}`);
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice, db: D1Database) {
    const customerId = invoice.customer as string;
    const subscriptionId = (invoice as any).subscription as string;

    // Find user by Stripe customer ID
    const userResult = await db.prepare('SELECT id FROM users WHERE stripe_customer_id = ?')
        .bind(customerId)
        .first<{ id: string }>();

    if (!userResult) {
        console.error('User not found for customer ID:', customerId);
        return;
    }

    const userId = userResult.id;

    // Update or insert subscription record
    if (subscriptionId) {
        await db.prepare(`
      INSERT OR REPLACE INTO subscriptions (id, user_id, status, current_period_end, updated_at)
      VALUES (?, ?, 'active', ?, CURRENT_TIMESTAMP)
    `).bind(
            subscriptionId,
            userId,
            new Date(invoice.period_end * 1000).toISOString()
        ).run();
    }

    // Record the invoice
    await db.prepare(`
    INSERT OR REPLACE INTO invoices (id, user_id, invoice_type, amount, status, hosted_invoice_url, created_at)
    VALUES (?, ?, ?, ?, 'paid', ?, CURRENT_TIMESTAMP)
  `).bind(
        invoice.id,
        userId,
        subscriptionId ? 'subscription' : 'usage',
        invoice.amount_paid,
        invoice.hosted_invoice_url
    ).run();

    // Ensure user can make calls
    await db.prepare(`
    UPDATE users 
    SET subscription_status = 'active', can_make_calls = TRUE 
    WHERE id = ?
  `).bind(userId).run();

    console.log(`Payment succeeded for user ${userId}, invoice ${invoice.id}`);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice, db: D1Database) {
    const customerId = invoice.customer as string;

    // Find user by Stripe customer ID
    const userResult = await db.prepare('SELECT id FROM users WHERE stripe_customer_id = ?')
        .bind(customerId)
        .first<{ id: string }>();

    if (!userResult) {
        console.error('User not found for customer ID:', customerId);
        return;
    }

    const userId = userResult.id;

    // Record the failed invoice
    const subscriptionId = (invoice as any).subscription as string;
    await db.prepare(`
    INSERT OR REPLACE INTO invoices (id, user_id, invoice_type, amount, status, hosted_invoice_url, created_at)
    VALUES (?, ?, ?, ?, 'open', ?, CURRENT_TIMESTAMP)
  `).bind(
        invoice.id,
        userId,
        subscriptionId ? 'subscription' : 'usage',
        invoice.amount_due,
        invoice.hosted_invoice_url
    ).run();

    // Block user from making calls if payment failed
    await db.prepare(`
    UPDATE users 
    SET subscription_status = 'past_due', can_make_calls = FALSE 
    WHERE id = ?
  `).bind(userId).run();

    console.log(`Payment failed for user ${userId}, invoice ${invoice.id} - calls blocked`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription, db: D1Database) {
    const customerId = subscription.customer as string;

    // Find user by Stripe customer ID
    const userResult = await db.prepare('SELECT id FROM users WHERE stripe_customer_id = ?')
        .bind(customerId)
        .first<{ id: string }>();

    if (!userResult) {
        console.error('User not found for customer ID:', customerId);
        return;
    }

    const userId = userResult.id;

    // Update subscription record
    await db.prepare(`
    INSERT OR REPLACE INTO subscriptions (id, user_id, status, current_period_end, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).bind(
        subscription.id,
        userId,
        subscription.status,
        new Date((subscription as any).current_period_end * 1000).toISOString()
    ).run();

    // Update user status based on subscription status
    const canMakeCalls = subscription.status === 'active';
    await db.prepare(`
    UPDATE users 
    SET subscription_status = ?, can_make_calls = ? 
    WHERE id = ?
  `).bind(subscription.status, canMakeCalls, userId).run();

    console.log(`Subscription updated for user ${userId}: ${subscription.status}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription, db: D1Database) {
    const customerId = subscription.customer as string;

    // Find user by Stripe customer ID
    const userResult = await db.prepare('SELECT id FROM users WHERE stripe_customer_id = ?')
        .bind(customerId)
        .first<{ id: string }>();

    if (!userResult) {
        console.error('User not found for customer ID:', customerId);
        return;
    }

    const userId = userResult.id;

    // Update subscription record
    await db.prepare(`
    UPDATE subscriptions 
    SET status = 'canceled', updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).bind(subscription.id).run();

    // Block user from making calls
    await db.prepare(`
    UPDATE users 
    SET subscription_status = 'canceled', can_make_calls = FALSE 
    WHERE id = ?
  `).bind(userId).run();

    console.log(`Subscription canceled for user ${userId}`);
}
