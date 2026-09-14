-- ============================================================
-- 045_saas_seat_limits.sql — enforce seats at membership write time
-- ============================================================

CREATE OR REPLACE FUNCTION enforce_saas_seat_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  plan_name TEXT;
  seat_limit INTEGER;
  current_seats INTEGER;
BEGIN
  IF NEW.account_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.account_id IS NOT DISTINCT FROM NEW.account_id THEN
    RETURN NEW;
  END IF;

  SELECT plan::text
  INTO plan_name
  FROM account_subscriptions
  WHERE account_id = NEW.account_id
    AND (
      status = 'active'
      OR (status = 'trialing' AND trial_ends_at > NOW())
    );

  IF plan_name IS NULL THEN
    RAISE EXCEPTION 'active subscription required';
  END IF;

  seat_limit := CASE plan_name
    WHEN 'starter' THEN 2
    WHEN 'business' THEN 5
    WHEN 'pro' THEN 15
    ELSE 0
  END;

  SELECT COUNT(*)
  INTO current_seats
  FROM profiles
  WHERE account_id = NEW.account_id
    AND (TG_OP <> 'UPDATE' OR user_id <> OLD.user_id);

  IF current_seats >= seat_limit THEN
    RAISE EXCEPTION 'account seat limit reached for plan %', plan_name;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_saas_seat_limit_on_profiles ON profiles;
CREATE TRIGGER enforce_saas_seat_limit_on_profiles
BEFORE INSERT OR UPDATE OF account_id ON profiles
FOR EACH ROW EXECUTE FUNCTION enforce_saas_seat_limit();
