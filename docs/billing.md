# Global billing setup

FlowCRM uses Paddle for recurring SaaS billing. The application keeps plan entitlements in `account_subscriptions`; Paddle checkout and subscription webhooks synchronize that row.

## Plans

- Starter: USD 9/month
- Business: USD 19/month
- Pro: USD 39/month

Regional currencies and taxes are handled at checkout by the billing provider.

## Configuration

Set these server environment variables in the deployment platform:

```text
PADDLE_ENVIRONMENT=production
PADDLE_API_KEY=<api key>
PADDLE_WEBHOOK_SECRET=<webhook endpoint secret>
PADDLE_PRICE_STARTER_MONTHLY=<pri_...>
PADDLE_PRICE_BUSINESS_MONTHLY=<pri_...>
PADDLE_PRICE_PRO_MONTHLY=<pri_...>
PADDLE_CHECKOUT_URL=https://YOUR_DOMAIN/settings?tab=billing
```

For testing, use `PADDLE_ENVIRONMENT=sandbox` and sandbox price IDs.

## Dashboard setup

Create three recurring monthly prices matching the plans above. The checkout URL must be on a domain approved in Paddle.

Create a webhook destination at:

```text
https://YOUR_DOMAIN/api/billing/webhook
```

Enable subscription lifecycle notifications including created, updated, activated, trialing, past due, paused, resumed, and canceled.

## Database

Apply all Supabase migrations in numeric order. The SaaS additions begin at migration 043.

## Test before production

1. Sign up and confirm a Starter trial is created.
2. Open Settings → Plans & billing.
3. Complete a sandbox Business checkout.
4. Confirm the webhook changes the account to Business and active.
5. Confirm AI becomes available and public API remains unavailable.
6. Repeat with Pro and confirm public API access.
7. Simulate past-due/canceled subscription events and confirm paid access is removed.
8. Test Starter/Business/Pro automation, broadcast, and seat limits.

Do not merge the SaaS branch until lint, typecheck, tests, build, migrations, and an end-to-end sandbox checkout all pass.
