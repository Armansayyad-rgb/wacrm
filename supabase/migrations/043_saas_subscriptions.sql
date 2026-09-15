-- ============================================================
-- 043_saas_subscriptions.sql — SaaS subscription foundation
-- One subscription row per account. Billing-provider webhooks use
-- the service role to update these rows; account members can read.
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'saas_plan_enum') THEN
    CREATE TYPE saas_plan_enum AS ENUM ('starter', 'business', 'pro');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status_enum') THEN
    CREATE TYPE subscription_status_enum AS ENUM (
      'trialing', 'active', 'past_due', 'cancelled', 'expired'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS account_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL UNIQUE REFERENCES accounts(id) ON DELETE CASCADE,
  plan saas_plan_enum NOT NULL DEFAULT 'starter',
  status subscription_status_enum NOT NULL DEFAULT 'trialing',
  provider TEXT,
  provider_customer_id TEXT,
  provider_subscription_id TEXT,
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_account_subscriptions_provider_subscription
  ON account_subscriptions(provider, provider_subscription_id)
  WHERE provider_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_account_subscriptions_status
  ON account_subscriptions(status);

ALTER TABLE account_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Account members can view subscription" ON account_subscriptions;
CREATE POLICY "Account members can view subscription"
  ON account_subscriptions
  FOR SELECT
  USING (is_account_member(account_id, 'viewer'));

DROP TRIGGER IF EXISTS set_updated_at ON account_subscriptions;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON account_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Backfill a starter trial for every existing business account.
INSERT INTO account_subscriptions (account_id, plan, status, trial_ends_at)
SELECT id, 'starter', 'trialing', NOW() + INTERVAL '14 days'
FROM accounts
ON CONFLICT (account_id) DO NOTHING;

-- Automatically provision a 14-day Starter trial for future accounts.
CREATE OR REPLACE FUNCTION provision_default_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO account_subscriptions (account_id, plan, status, trial_ends_at)
  VALUES (NEW.id, 'starter', 'trialing', NOW() + INTERVAL '14 days')
  ON CONFLICT (account_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS provision_default_subscription_on_account ON accounts;
CREATE TRIGGER provision_default_subscription_on_account
AFTER INSERT ON accounts
FOR EACH ROW EXECUTE FUNCTION provision_default_subscription();

-- Server-side helper used by feature gates and API routes.
CREATE OR REPLACE FUNCTION account_has_paid_access(target_account_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM account_subscriptions s
    WHERE s.account_id = target_account_id
      AND (
        s.status = 'active'
        OR (s.status = 'trialing' AND s.trial_ends_at > NOW())
      )
  );
$$;
