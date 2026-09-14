import { after } from 'next/server';

import { requireApiKey } from '@/lib/auth/api-context';
import { ok, fail, toApiErrorResponse } from '@/lib/api/v1/respond';
import { resolveAuditUserId, ContactError } from '@/lib/api/v1/contacts';
import { loadSubscription } from '@/lib/saas/subscription';
import { getPlan } from '@/lib/saas/entitlements';
import {
  createBroadcast,
  deliverBroadcast,
  BroadcastError,
} from '@/lib/whatsapp/broadcast-core';

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const ctx = await requireApiKey(request, 'broadcasts:send');

    const body = (await request.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    if (!body || typeof body !== 'object') {
      return fail('bad_request', 'Request body must be a JSON object', 400);
    }

    const templateName =
      typeof body.template_name === 'string' ? body.template_name : '';
    const recipients = Array.isArray(body.recipients) ? body.recipients : [];

    if (!templateName || recipients.length === 0) {
      return fail(
        'bad_request',
        'template_name and at least one recipient are required',
        400,
      );
    }

    const subscription = await loadSubscription(ctx.supabase, ctx.accountId);
    if (!subscription?.active) {
      return fail('forbidden', 'An active subscription is required', 403);
    }

    const monthlyLimit = getPlan(subscription.plan).broadcastsPerMonth;
    const { data: quotaAllowed, error: quotaError } = await ctx.supabase.rpc(
      'consume_saas_monthly_quota',
      {
        target_account_id: ctx.accountId,
        feature_name: 'broadcast',
        quota_limit: monthlyLimit,
      },
    );

    if (quotaError) {
      console.error('[api/v1/broadcasts] quota check failed:', quotaError);
      return fail('internal', 'Could not verify broadcast quota', 500);
    }
    if (quotaAllowed !== true) {
      return fail(
        'forbidden',
        `${getPlan(subscription.plan).name} monthly broadcast limit reached`,
        403,
      );
    }

    const auditUserId = await resolveAuditUserId(ctx.supabase, ctx.accountId);

    const plan = await createBroadcast(ctx.supabase, ctx.accountId, auditUserId, {
      name: typeof body.name === 'string' ? body.name : null,
      templateName,
      templateLanguage:
        typeof body.template_language === 'string'
          ? body.template_language
          : null,
      recipients: recipients.map((r) => ({
        to: typeof r?.to === 'string' ? r.to : '',
        params: Array.isArray(r?.params) ? r.params : undefined,
      })),
    });

    after(() => deliverBroadcast(ctx.supabase, plan));

    return ok(
      {
        broadcast_id: plan.broadcastId,
        status: 'sending',
        total_recipients: plan.planned.length,
        accepted: plan.planned.length,
        rejected: plan.rejected,
      },
      202
    );
  } catch (err) {
    if (err instanceof BroadcastError) {
      return fail(err.code, err.message, err.status);
    }
    if (err instanceof ContactError) {
      return fail(
        err.status === 400 ? 'bad_request' : 'internal',
        err.message,
        err.status
      );
    }
    return toApiErrorResponse(err);
  }
}
