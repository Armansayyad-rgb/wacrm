-- ============================================================
-- 048_security_hardening.sql
--
-- Supabase/Postgres may grant EXECUTE on newly-created functions to
-- PUBLIC / API roles by default. A number of SECURITY DEFINER helpers
-- are trigger-only or service-role-only and must not be callable through
-- PostgREST by anonymous or ordinary authenticated clients.
--
-- This migration establishes an explicit allow-list of callers.
-- It also pins search_path on the remaining helper functions flagged by
-- the Supabase database linter.
-- ============================================================

-- Internal trigger / implementation helpers: no API role may invoke.
REVOKE ALL ON FUNCTION public._bcast_bump(UUID, TEXT, INTEGER) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.broadcast_recipient_aggregate_trigger() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.enforce_saas_seat_limit() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.merge_duplicate_contacts() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.merge_duplicate_conversations() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.notify_conversation_assigned() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.provision_default_subscription() FROM PUBLIC, anon, authenticated, service_role;

-- Service-only operational helpers.
REVOKE ALL ON FUNCTION public.account_has_paid_access(UUID) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.account_has_paid_access(UUID) TO service_role;

REVOKE ALL ON FUNCTION public.claim_ai_reply_slot(UUID, INTEGER) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.claim_ai_reply_slot(UUID, INTEGER) TO service_role;

REVOKE ALL ON FUNCTION public.recompute_broadcast_counts(UUID) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.recompute_broadcast_counts(UUID) TO service_role;

REVOKE ALL ON FUNCTION public.record_webhook_failure(UUID, INTEGER) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.record_webhook_failure(UUID, INTEGER) TO service_role;

-- Membership predicate is required by authenticated RLS policies and by
-- service-role server paths, but never by anonymous users.
REVOKE ALL ON FUNCTION public.is_account_member(UUID, account_role_enum) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_account_member(UUID, account_role_enum) TO authenticated, service_role;

-- Quota consumption is intentionally available to authenticated agents
-- (the function performs its own membership/role check) and service-role
-- public-API callers. Anonymous callers must never consume quota.
REVOKE ALL ON FUNCTION public.consume_saas_monthly_quota(UUID, TEXT, INTEGER) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.consume_saas_monthly_quota(UUID, TEXT, INTEGER) TO authenticated, service_role;

-- Invitation preview is intentionally public so a signed-out join page
-- can resolve a high-entropy invitation token.
REVOKE ALL ON FUNCTION public.peek_invitation(TEXT) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.peek_invitation(TEXT) TO anon, authenticated;

-- Authenticated account-management RPCs. Each function performs its own
-- auth.uid()/role validation internally.
REVOKE ALL ON FUNCTION public.redeem_invitation(TEXT) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.redeem_invitation(TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.remove_account_member(UUID) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.remove_account_member(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.set_member_role(UUID, account_role_enum) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.set_member_role(UUID, account_role_enum) TO authenticated;

REVOKE ALL ON FUNCTION public.touch_presence(TEXT) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.touch_presence(TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.transfer_account_ownership(UUID) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.transfer_account_ownership(UUID) TO authenticated;

-- Pin search_path for ordinary helpers flagged by the database linter.
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
ALTER FUNCTION public._bcast_cols_for_status(TEXT) SET search_path = public;
ALTER FUNCTION public.update_ai_configs_updated_at() SET search_path = public;
ALTER FUNCTION public.update_ai_knowledge_documents_updated_at() SET search_path = public;
