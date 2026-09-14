-- ============================================================
-- 044_saas_usage_quotas.sql — atomic SaaS usage counters
-- Tracks monthly campaign-style quotas without relying on UI state.
-- ============================================================

CREATE TABLE IF NOT EXISTS saas_usage_counters (
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  period_start DATE NOT NULL,
  used INTEGER NOT NULL DEFAULT 0 CHECK (used >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (account_id, feature, period_start)
);

ALTER TABLE saas_usage_counters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Account members can view SaaS usage" ON saas_usage_counters;
CREATE POLICY "Account members can view SaaS usage"
  ON saas_usage_counters
  FOR SELECT
  USING (is_account_member(account_id, 'viewer'));

-- Atomically consume one unit from a monthly quota. Dashboard callers
-- must belong to the account; service-role callers are allowed because
-- public API authentication has already resolved an account-scoped key.
CREATE OR REPLACE FUNCTION consume_saas_monthly_quota(
  target_account_id UUID,
  feature_name TEXT,
  quota_limit INTEGER
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_period DATE := date_trunc('month', NOW())::date;
  new_used INTEGER;
BEGIN
  IF quota_limit <= 0 THEN
    RETURN FALSE;
  END IF;

  IF auth.role() <> 'service_role'
     AND NOT is_account_member(target_account_id, 'agent') THEN
    RAISE EXCEPTION 'insufficient account role';
  END IF;

  INSERT INTO saas_usage_counters (account_id, feature, period_start, used)
  VALUES (target_account_id, feature_name, current_period, 1)
  ON CONFLICT (account_id, feature, period_start)
  DO UPDATE SET
    used = saas_usage_counters.used + 1,
    updated_at = NOW()
  WHERE saas_usage_counters.used < quota_limit
  RETURNING used INTO new_used;

  RETURN new_used IS NOT NULL AND new_used <= quota_limit;
END;
$$;

REVOKE ALL ON FUNCTION consume_saas_monthly_quota(UUID, TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION consume_saas_monthly_quota(UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION consume_saas_monthly_quota(UUID, TEXT, INTEGER) TO service_role;
