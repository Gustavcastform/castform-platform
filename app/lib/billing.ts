import { getRequestContext } from '@cloudflare/next-on-pages';
import { D1Database } from '@cloudflare/workers-types';
import Stripe from 'stripe';

const USAGE_THRESHOLD_CENTS = 2500; // $25.00 in cents

export interface UserCallEligibility {
  canMakeCall: boolean;
  reason?: string;
  currentUsage: number;
  thresholdAmount: number;
  subscriptionStatus: string;
}

export async function checkUserCallEligibility(userId: string): Promise<UserCallEligibility> {
  const context = getRequestContext();
  const db: D1Database = context.env.CASTFORM_DB;

  try {
    // Get user's subscription status and call permissions
    const userResult = await db.prepare(`
      SELECT stripe_customer_id, subscription_status, can_make_calls 
      FROM users 
      WHERE id = ?
    `).bind(userId).first<{
      stripe_customer_id: string | null;
      subscription_status: string;
      can_make_calls: boolean;
    }>();

    if (!userResult) {
      return {
        canMakeCall: false,
        reason: 'User not found',
        currentUsage: 0,
        thresholdAmount: USAGE_THRESHOLD_CENTS,
        subscriptionStatus: 'unknown'
      };
    }

    // Check if user has an active subscription
    if (userResult.subscription_status !== 'active' || !userResult.can_make_calls) {
      return {
        canMakeCall: false,
        reason: `Subscription is ${userResult.subscription_status}. Please update your billing information.`,
        currentUsage: 0,
        thresholdAmount: USAGE_THRESHOLD_CENTS,
        subscriptionStatus: userResult.subscription_status
      };
    }

    // Check current unbilled usage
    const usageResult = await db.prepare(`
      SELECT SUM(cost) as total_unbilled_cost 
      FROM calls 
      WHERE user_id = ? AND billing_status = 'unbilled'
    `).bind(userId).first<{ total_unbilled_cost: number | null }>();

    const currentUsage = usageResult?.total_unbilled_cost || 0;

    // Only block calls if user has ALREADY exceeded the $25 threshold
    if (currentUsage >= USAGE_THRESHOLD_CENTS) {
      return {
        canMakeCall: false,
        reason: `Usage limit exceeded. Current unbilled usage: $${(currentUsage / 100).toFixed(2)}. Please pay your outstanding balance to continue making calls.`,
        currentUsage,
        thresholdAmount: USAGE_THRESHOLD_CENTS,
        subscriptionStatus: userResult.subscription_status
      };
    }

    return {
      canMakeCall: true,
      currentUsage,
      thresholdAmount: USAGE_THRESHOLD_CENTS,
      subscriptionStatus: userResult.subscription_status
    };

  } catch (error) {
    console.error('Error checking user call eligibility:', error);
    return {
      canMakeCall: false,
      reason: 'Error checking account status. Please try again.',
      currentUsage: 0,
      thresholdAmount: USAGE_THRESHOLD_CENTS,
      subscriptionStatus: 'error'
    };
  }
}

export async function checkAndChargeUsage(userId: string): Promise<void> {
  const context = getRequestContext();
  const db: D1Database = context.env.CASTFORM_DB;
  
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY!;
  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2024-06-20' as any,
  });

  try {
    // Get user's Stripe customer ID and subscription status
    const userResult = await db.prepare(`
      SELECT stripe_customer_id, subscription_status, can_make_calls 
      FROM users 
      WHERE id = ?
    `).bind(userId).first<{
      stripe_customer_id: string | null;
      subscription_status: string;
      can_make_calls: boolean;
    }>();

    if (!userResult || !userResult.stripe_customer_id) {
      console.error('User not found or missing Stripe customer ID:', userId);
      return;
    }

    // Only process usage billing for active subscribers
    if (userResult.subscription_status !== 'active' || !userResult.can_make_calls) {
      console.log('Skipping usage billing for inactive user:', userId);
      return;
    }

    // Calculate unbilled usage cost
    const unbilledResult = await db.prepare(`
      SELECT SUM(cost) as total_unbilled_cost 
      FROM calls 
      WHERE user_id = ? AND billing_status = 'unbilled'
    `).bind(userId).first<{ total_unbilled_cost: number | null }>();

    const totalUnbilledCost = unbilledResult?.total_unbilled_cost || 0;

    // Check if usage exceeds threshold
    if (totalUnbilledCost >= USAGE_THRESHOLD_CENTS) {
      console.log(`Usage threshold exceeded for user ${userId}: $${totalUnbilledCost / 100}`);
      
      // Create usage invoice in Stripe
      const invoice = await stripe.invoices.create({
        customer: userResult.stripe_customer_id,
        description: `Usage charges for calls totaling $${(totalUnbilledCost / 100).toFixed(2)}`,
        auto_advance: true, // Automatically finalize and attempt payment
        metadata: {
          user_id: userId,
          billing_type: 'usage',
          amount_cents: totalUnbilledCost.toString(),
        },
      });

      // Add invoice item for the usage
      await stripe.invoiceItems.create({
        customer: userResult.stripe_customer_id,
        invoice: invoice.id,
        amount: totalUnbilledCost,
        currency: 'usd',
        description: `Usage charges for voice calls`,
      });

      // Finalize and send the invoice
      if (invoice.id) {
        await stripe.invoices.finalizeInvoice(invoice.id);
      }

      // Mark calls as billed
      await db.prepare(`
        UPDATE calls 
        SET billing_status = 'billed' 
        WHERE user_id = ? AND billing_status = 'unbilled'
      `).bind(userId).run();

      // Record the invoice in our database
      await db.prepare(`
        INSERT INTO invoices (id, user_id, invoice_type, amount, status, hosted_invoice_url, created_at)
        VALUES (?, ?, 'usage', ?, 'open', ?, CURRENT_TIMESTAMP)
      `).bind(
        invoice.id,
        userId,
        totalUnbilledCost,
        invoice.hosted_invoice_url
      ).run();

      console.log(`Usage invoice created for user ${userId}: ${invoice.id}`);
    }
  } catch (error) {
    console.error('Error processing usage billing for user', userId, ':', error);
    throw error;
  }
}

export interface BillingDashboardData {
  // User subscription info
  subscriptionStatus: string;
  canMakeCall: boolean;
  stripeCustomerId: string | null;

  // Usage statistics
  totalUnbilledCost: number;
  totalBilledCost: number;
  unbilledCallCount: number;
  totalCallCount: number;
  thresholdAmount: number;
  percentageToThreshold: number;
  remainingUsage: number;
  unbilledTotalMinutes: number;
  unbilledSuccessfulCalls: number;
  unbilledFailedCalls: number;
  
  // Payment status flags
  hasExceededUsageLimit: boolean;
  hasUnpaidInvoices: boolean;
  needsPaymentRetry: boolean;
  
  // Recent activity
  recentCalls: Array<{
    id: string;
    call_name: string;
    cost: number | null;
    status: string;
    created_at: string;
  }>;
  
  // Subscription details
  currentPeriodEnd: string | null;
  subscriptionId: string | null;
  
  // Invoice history
  recentInvoices: Array<{
    id: string;
    amount: number;
    status: string;
    invoice_type: string;
    created_at: string;
    hosted_invoice_url: string | null;
  }>;
}

export async function getBillingDashboardData(userId: string): Promise<BillingDashboardData> {
  const context = getRequestContext();
  const db: D1Database = context.env.CASTFORM_DB;

  try {
    // Get user subscription info
    const userResult = await db.prepare(`
      SELECT stripe_customer_id, subscription_status, can_make_calls 
      FROM users 
      WHERE id = ?
    `).bind(userId).first<{
      stripe_customer_id: string | null;
      subscription_status: string;
      can_make_calls: boolean;
    }>();

    if (!userResult) {
      throw new Error('User not found');
    }

    // Get usage statistics
    const [unbilledStats, billedStats, totalCallCount] = await Promise.all([
      // Unbilled usage
      db.prepare(`
        SELECT 
          SUM(cost) as total_cost, 
          COUNT(*) as call_count,
          SUM(duration) as total_duration,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful_calls,
          SUM(CASE WHEN status NOT IN ('completed', 'in-progress') THEN 1 ELSE 0 END) as failed_calls
        FROM calls 
        WHERE user_id = ? AND billing_status = 'unbilled'
      `).bind(userId).first<{ 
        total_cost: number | null; 
        call_count: number; 
        total_duration: number | null;
        successful_calls: number;
        failed_calls: number;
      }>(),
      
      // Billed usage
      db.prepare(`
        SELECT SUM(cost) as total_cost 
        FROM calls 
        WHERE user_id = ? AND billing_status = 'billed'
      `).bind(userId).first<{ total_cost: number | null }>(),
      
      // Total call count
      db.prepare(`
        SELECT COUNT(*) as total_count 
        FROM calls 
        WHERE user_id = ?
      `).bind(userId).first<{ total_count: number }>()
    ]);

    const totalUnbilledCost = unbilledStats?.total_cost || 0;
    const totalBilledCost = billedStats?.total_cost || 0;
    const unbilledCallCount = unbilledStats?.call_count || 0;
    const totalCalls = totalCallCount?.total_count || 0;
    const unbilledTotalMinutes = Math.floor((unbilledStats?.total_duration || 0) / 60);
    const unbilledSuccessfulCalls = unbilledStats?.successful_calls || 0;
    const unbilledFailedCalls = unbilledStats?.failed_calls || 0;
    
    const percentageToThreshold = Math.min((totalUnbilledCost / USAGE_THRESHOLD_CENTS) * 100, 100);
    const remainingUsage = Math.max(USAGE_THRESHOLD_CENTS - totalUnbilledCost, 0);

    // Get recent calls (last 10)
    const recentCalls = await db.prepare(`
      SELECT id, call_name, cost, status, created_at
      FROM calls 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 10
    `).bind(userId).all<{
      id: string;
      call_name: string;
      cost: number | null;
      status: string;
      created_at: string;
    }>();

    // Get subscription details
    const subscriptionResult = await db.prepare(`
      SELECT id, current_period_end 
      FROM subscriptions 
      WHERE user_id = ? AND status = 'active'
      ORDER BY created_at DESC 
      LIMIT 1
    `).bind(userId).first<{
      id: string;
      current_period_end: string;
    }>();

    // Get recent invoices (last 5)
    const recentInvoices = await db.prepare(`
      SELECT id, amount, status, invoice_type, created_at, hosted_invoice_url
      FROM invoices 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 5
    `).bind(userId).all<{
      id: string;
      amount: number;
      status: string;
      invoice_type: string;
      created_at: string;
      hosted_invoice_url: string | null;
    }>();
    
    // Calculate payment status flags
    const hasExceededUsageLimit = totalUnbilledCost >= USAGE_THRESHOLD_CENTS;
    const hasUnpaidInvoices = (recentInvoices.results || []).some(invoice => 
      invoice.status === 'open' || invoice.status === 'past_due'
    );
    const needsPaymentRetry = userResult.subscription_status === 'past_due' || 
                              userResult.subscription_status === 'canceled' || 
                              hasExceededUsageLimit || 
                              hasUnpaidInvoices;

    return {
      // User subscription info
      subscriptionStatus: userResult.subscription_status,
      canMakeCall: userResult.can_make_calls,
      stripeCustomerId: userResult.stripe_customer_id,
      
      // Usage statistics
      totalUnbilledCost,
      totalBilledCost,
      unbilledCallCount,
      totalCallCount: totalCalls,
      thresholdAmount: USAGE_THRESHOLD_CENTS,
      percentageToThreshold,
      remainingUsage,
      unbilledTotalMinutes,
      unbilledSuccessfulCalls,
      unbilledFailedCalls,
      
      // Payment status flags
      hasExceededUsageLimit,
      hasUnpaidInvoices,
      needsPaymentRetry,
      
      // Recent activity
      recentCalls: recentCalls.results || [],
      
      // Subscription details
      currentPeriodEnd: subscriptionResult?.current_period_end || null,
      subscriptionId: subscriptionResult?.id || null,
      
      // Invoice history
      recentInvoices: recentInvoices.results || [],
    };

  } catch (error) {
    console.error('Error getting billing dashboard data:', error);
    throw error;
  }
}

export async function getUserUsageStats(userId: string): Promise<{
  totalUnbilledCost: number;
  totalBilledCost: number;
  callCount: number;
  thresholdAmount: number;
  percentageToThreshold: number;
}> {
  const context = getRequestContext();
  const db: D1Database = context.env.CASTFORM_DB;

  try {
    // Get unbilled usage
    const unbilledResult = await db.prepare(`
      SELECT SUM(cost) as total_cost, COUNT(*) as call_count 
      FROM calls 
      WHERE user_id = ? AND billing_status = 'unbilled'
    `).bind(userId).first<{ total_cost: number | null; call_count: number }>();

    // Get total billed usage
    const billedResult = await db.prepare(`
      SELECT SUM(cost) as total_cost 
      FROM calls 
      WHERE user_id = ? AND billing_status = 'billed'
    `).bind(userId).first<{ total_cost: number | null }>();

    const totalUnbilledCost = unbilledResult?.total_cost || 0;
    const totalBilledCost = billedResult?.total_cost || 0;
    const callCount = unbilledResult?.call_count || 0;
    const percentageToThreshold = Math.min((totalUnbilledCost / USAGE_THRESHOLD_CENTS) * 100, 100);

    return {
      totalUnbilledCost,
      totalBilledCost,
      callCount,
      thresholdAmount: USAGE_THRESHOLD_CENTS,
      percentageToThreshold,
    };
  } catch (error) {
    console.error('Error getting usage stats for user', userId, ':', error);
    throw error;
  }
}

export async function blockUserForFailedPayment(userId: string): Promise<void> {
  const context = getRequestContext();
  const db: D1Database = context.env.CASTFORM_DB;

  try {
    await db.prepare(`
      UPDATE users 
      SET can_make_calls = FALSE, subscription_status = 'past_due' 
      WHERE id = ?
    `).bind(userId).run();

    console.log(`User ${userId} blocked due to failed payment`);
  } catch (error) {
    console.error('Error blocking user for failed payment:', error);
    throw error;
  }
}

export async function unblockUserAfterPayment(userId: string): Promise<void> {
  const context = getRequestContext();
  const db: D1Database = context.env.CASTFORM_DB;

  try {
    await db.prepare(`
      UPDATE users 
      SET can_make_calls = TRUE, subscription_status = 'active' 
      WHERE id = ?
    `).bind(userId).run();

    console.log(`User ${userId} unblocked after successful payment`);
  } catch (error) {
    console.error('Error unblocking user after payment:', error);
    throw error;
  }
}

export async function createPaymentRetrySession(userId: string): Promise<{ url: string }> {
  const context = getRequestContext();
  const db: D1Database = context.env.CASTFORM_DB;
  
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY!;
  const appUrl = process.env.API_BASE_URL!;

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2024-06-20' as any,
  });

  try {
    // Get user's Stripe customer ID and billing info
    const userResult = await db.prepare(`
      SELECT stripe_customer_id, subscription_status 
      FROM users 
      WHERE id = ?
    `).bind(userId).first<{
      stripe_customer_id: string | null;
      subscription_status: string;
    }>();

    if (!userResult?.stripe_customer_id) {
      throw new Error('User does not have a Stripe customer ID');
    }

    // Get unbilled usage amount
    const usageResult = await db.prepare(`
      SELECT SUM(cost) as total_unbilled_cost 
      FROM calls 
      WHERE user_id = ? AND billing_status = 'unbilled'
    `).bind(userId).first<{ total_unbilled_cost: number | null }>();

    const totalUnbilledCost = usageResult?.total_unbilled_cost || 0;

    // Create a checkout session for the outstanding amount
    if (totalUnbilledCost > 0) {
      // Create usage payment session
      const session = await stripe.checkout.sessions.create({
        customer: userResult.stripe_customer_id,
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Outstanding Usage Charges',
                description: `Voice call usage charges totaling $${(totalUnbilledCost / 100).toFixed(2)}`,
              },
              unit_amount: totalUnbilledCost,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${appUrl}/billing?payment_success=true`,
        cancel_url: `${appUrl}/billing?payment_canceled=true`,
        metadata: {
          user_id: userId,
          payment_type: 'usage_retry',
        },
      });

      return { url: session.url! };
    } else {
      // Create subscription retry session (for subscription issues)
      const priceId = process.env.STRIPE_PRICE_ID!;
      
      const session = await stripe.checkout.sessions.create({
        customer: userResult.stripe_customer_id,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${appUrl}/billing?subscription_success=true`,
        cancel_url: `${appUrl}/billing?payment_canceled=true`,
        metadata: {
          user_id: userId,
          payment_type: 'subscription_retry',
        },
      });

      return { url: session.url! };
    }
  } catch (error) {
    console.error('Error creating payment retry session:', error);
    throw error;
  }
}
