import { supabaseAdmin } from '@/lib/flows/admin-client';
import { loadSubscription } from '@/lib/saas/subscription';
import { hasEntitlement } from '@/lib/saas/entitlements';

export interface ApiKeyRow {
  id: string;
  account_id: string;
  created_by: string | null;
  name: string;
  scopes: string[];
  expires_at: string | null;
  revoked_at: string | null;
}

export async function findActiveKeyByHash(
  hash: string
): Promise<ApiKeyRow | null> {
  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from('api_keys')
    .select('id, account_id, created_by, name, scopes, expires_at, revoked_at')
    .eq('key_hash', hash)
    .maybeSingle();

  if (error) {
    console.error('[api-keys/store] lookup error:', error.message);
    return null;
  }
  if (!data) return null;
  if (data.revoked_at) return null;
  if (data.expires_at && new Date(data.expires_at).getTime() <= Date.now()) {
    return null;
  }

  const subscription = await loadSubscription(admin, data.account_id);
  if (!subscription?.active) return null;
  if (!hasEntitlement(subscription.plan, 'apiAccess')) return null;

  return data as ApiKeyRow;
}

export async function getAccountName(
  accountId: string
): Promise<string | null> {
  const { data, error } = await supabaseAdmin()
    .from('accounts')
    .select('name')
    .eq('id', accountId)
    .maybeSingle();
  if (error || !data) return null;
  return (data.name as string) ?? null;
}

export function touchLastUsed(id: string): void {
  void supabaseAdmin()
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', id)
    .then(({ error }) => {
      if (error) {
        console.warn(
          '[api-keys/store] last_used_at bump failed:',
          error.message
        );
      }
    });
}
