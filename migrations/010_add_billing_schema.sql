-- Migration: 010_add_billing_schema.sql
-- Description: Sets up the tables and columns required for Stripe billing.

-- Step 1: Add billing-related columns to the users table
ALTER TABLE users ADD COLUMN stripe_customer_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users (stripe_customer_id);
ALTER TABLE users ADD COLUMN subscription_status TEXT NOT NULL DEFAULT 'inactive';
ALTER TABLE users ADD COLUMN can_make_calls BOOLEAN NOT NULL DEFAULT FALSE;

-- Step 2: Add a billing status to the calls table
ALTER TABLE calls ADD COLUMN billing_status TEXT NOT NULL DEFAULT 'unbilled';

-- Step 3: Create the subscri
CREATE TABLE subscriptions (
    id TEXT PRIMARY KEY, -- Stripe Subscription ID (sub_...)
    user_id TEXT NOT NULL,
    status TEXT NOT NULL, -- e.g., active, past_due, canceled
    current_period_end TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Step 4: Create the invoices table
CREATE TABLE invoices (
    id TEXT PRIMARY KEY, -- Stripe Invoice ID (in_...)
    user_id TEXT NOT NULL,
    invoice_type TEXT NOT NULL, -- 'subscription' or 'usage'
    amount INTEGER NOT NULL, -- Amount in cents
    status TEXT NOT NULL, -- e.g., paid, open, void, uncollectible
    hosted_invoice_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
