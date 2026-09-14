# Global billing setup

FlowCRM uses Paddle for recurring SaaS billing. The application keeps plan entitlements in `account_subscriptions`; Paddle checkout and subscription webhooks synchronize that row.

## Plans

- Starter: USD 9/month
- Business: USD 19/month
- Pro: USD 39/month

Regional currencies and taxes are handled at checkout by the billing provider.

## Configuration

Browser checkout configuration:

```text
NEXT_PUBLIC_PADDLE_ENVIRONMENT=production
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=<live_... client-side token>
```

Server billing configuration:

```text
PADDLE_ENVIRONMENT=production
PADDLE_API_KEY=<api key>
PADDLE_WEBHOOK_SECRET=<webhook endpoint secret>
PADDLE_PRICE_STARTER_MONTHLY=<pri_...>
PADDLE_PRICE_BUSINESS_MONTHLY=<pri_...>
PADDLE_PRICE_PRO_MONTHLY=<pri_...>
PADDLE_CHECKOUT_URL=https://YOUR_DOMAIN/pay
```

Use sandbox values while integrating. The client-side token is intentionally usable in browser code; never expose the Paddle API key or webhook secret to the browser.

## Dashboard setup

Create three recurring monthly prices matching the plans above. Create a Paddle client-side token for Paddle.js. Configure the default/approved payment-link domain so `https://YOUR_DOMAIN/pay` is valid. The `/pay` page loads Paddle.js and opens generated transaction payment links.

Create a webhook destination at:

```text
https://YOUR_DOMAIN/api/billing/webhook
```

Enable subscription lifecycle notifications including created, updated, activated, trialing, past due, paused, resumed, and canceled.

## Database

Apply all Supabase migrations in numeric order. The SaaS additions begin at migration 043. Migration 047 adds out-of-order webhook protection.

## Test before production

1. Sign up and confirm a Starter trial is created.
2. Open Settings → Plans & billing.
3. Complete a sandbox Business checkout through `/pay`.
4. Confirm the webhook changes the account to Business and active.
5. Confirm AI becomes available and public API remains unavailable.
6. Repeat with Pro and confirm public API access.
7. Test an upgrade and downgrade on the existing subscription.
8. Simulate past-due/canceled subscription events and confirm paid access is removed.
9. Replay a webhook event and send an older lifecycle event after a newer one; confirm state does not roll backward.
10. Test Starter/Business/Pro automation, broadcast, and seat limits.

Do not merge the SaaS branch until lint, typecheck, tests, build, migrations, and an end-to-end sandbox checkout all pass.
