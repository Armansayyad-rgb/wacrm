ALTER TABLE account_subscriptions
  ADD COLUMN IF NOT EXISTS provider_event_occurred_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_account_subscriptions_provider_event
  ON account_subscriptions(provider_event_occurred_at);
