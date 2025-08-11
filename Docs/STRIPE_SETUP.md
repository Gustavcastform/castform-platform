# Stripe Setup for Castform Voice

This guide will walk you through the necessary steps to configure your Stripe account to work with the Castform Voice billing system.

## 1. Create a Product and Price

The application's subscription model is based on a single product with a recurring price.

1.  **Log in** to your [Stripe Dashboard](https://dashboard.stripe.com/).
2.  Navigate to the **Products** section from the left-hand menu.
3.  Click **+ Add product**.
4.  Fill in the product details:
    - **Name**: `Castform Voice Pro` (or a name of your choice).
    - **Description**: (Optional) A brief description of the subscription plan.
5.  Under **Pricing**, configure the price:
    - Select **Standard pricing**.
    - Set the price to **$149.00**.
    - Set the currency to **USD**.
    - Select **Recurring** for the billing period.
    - Set the billing period to **Monthly**.
6.  Click **Save product**.
7.  After the product is created, you will be taken to its detail page. Under the **Pricing** section, you will find the **API ID** for the price you just created (it will look like `price_...`).
8.  **Copy this Price ID**. You will need it for your environment variables.

## 2. Set Up Webhooks

Webhooks are used by Stripe to send events to your application, such as successful payments, subscription updates, and cancellations. The webhook handler for this is not yet implemented, but you can configure the endpoint in advance.

1.  In your Stripe Dashboard, navigate to **Developers > Webhooks**.
2.  Click **+ Add endpoint**.
3.  For the **Endpoint URL**, enter: `[YOUR_APP_URL]/api/webhooks/stripe`.
    - Replace `[YOUR_APP_URL]` with the deployed URL of your application (e.g., `https://your-app.pages.dev`).
4.  Click **+ Select events** to add the events to listen for. For a complete subscription lifecycle, you should listen for:
    - `checkout.session.completed`
    - `invoice.payment_succeeded`
    - `invoice.payment_failed`
    - `customer.subscription.updated`
    - `customer.subscription.deleted`
5.  Click **Add endpoint**.
6.  After the endpoint is created, you will be taken to its detail page. Under **Signing secret**, click **Click to reveal**.
7.  **Copy this Webhook Signing Secret**. You will need it for your environment variables.

## 3. Configure Environment Variables

You need to add the following secrets to your Cloudflare Pages project. You can do this in your `wrangler.toml` file for local development or in the Cloudflare dashboard for your deployed application (`Your Site > Settings > Environment variables`).

- `STRIPE_SECRET_KEY`: Your Stripe secret key. Found in **Developers > API keys** (it will look like `sk_live_...` or `sk_test_...`).
- `STRIPE_PUBLIC_KEY`: Your Stripe publishable key. Found in **Developers > API keys** (it will look like `pk_live_...` or `pk_test_...`).
- `STRIPE_PRICE_ID`: The Price ID you copied in Step 1.
- `STRIPE_WEBHOOK_SECRET`: The Webhook Signing Secret you copied in Step 2.
- `API_BASE_URL`: The base URL of your deployed application (e.g., `https://your-app.pages.dev`).

Once these steps are completed, your application's billing system will be fully configured to work with Stripe.
