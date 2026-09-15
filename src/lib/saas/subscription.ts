import type { SupabaseClient } from '@supabase/supabase-js';

export async function loadSubscription(supabase: SupabaseClient, accountId: string) {
  const { data, error } = await supabase
    .from('account_subscriptions')
    .select('plan, status, trial_ends_at')
    .eq('account_id', accountId)
    .maybeSingle();

  if (error || !data) return null;

  const trialActive =
    data.status === 'trialing' &&
    typeof data.trial_ends_at === 'string' &&
    new Date(data.trial_ends_at).getTime() > Date.now();

  return {
    plan: data.plan as 'starter' | 'business' | 'pro',
    active: data.status === 'active' || trialActive,
  };
}
