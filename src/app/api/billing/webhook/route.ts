import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/flows/admin-client'
import { isPlanId } from '@/lib/saas/entitlements'
import { mapPaddleStatus, verifyPaddleSignature } from '@/lib/billing/paddle'

export const runtime = 'nodejs'

type BillingEvent = {
  event_id: string
  event_type: string
  occurred_at?: string
  data?: {
    id?: string
    status?: 'active' | 'trialing' | 'past_due' | 'paused' | 'canceled'
    customer_id?: string
    custom_data?: Record<string, unknown> | null
    current_billing_period?: { starts_at?: string; ends_at?: string } | null
    scheduled_change?: { action?: string } | null
  }
}

const SUBSCRIPTION_EVENTS = new Set([
  'subscription.created',
  'subscription.updated',
  'subscription.activated',
  'subscription.trialing',
  'subscription.past_due',
  'subscription.paused',
  'subscription.resumed',
  'subscription.canceled',
])

export async function POST(request: Request) {
  const rawBody = await request.text()
  if (!verifyPaddleSignature(rawBody, request.headers.get('paddle-signature'))) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let event: BillingEvent
  try {
    event = JSON.parse(rawBody) as BillingEvent
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  if (!event.event_id || !event.event_type) {
    return NextResponse.json({ error: 'Invalid event' }, { status: 400 })
  }

  const admin = supabaseAdmin()
  const { data: seen } = await admin
    .from('billing_events')
    .select('processed_at')
    .eq('event_id', event.event_id)
    .maybeSingle()
  if (seen?.processed_at) return NextResponse.json({ received: true })

  await admin.from('billing_events').upsert(
    {
      event_id: event.event_id,
      event_type: event.event_type,
      occurred_at: event.occurred_at ?? null,
      last_error: null,
    },
    { onConflict: 'event_id' },
  )

  try {
    if (SUBSCRIPTION_EVENTS.has(event.event_type) && event.data) {
      const status = event.data.status
      const subscriptionId = event.data.id
      let accountId = event.data.custom_data?.account_id
      let plan = event.data.custom_data?.plan_id

      if (
        (!accountId || !plan || !isPlanId(typeof plan === 'string' ? plan : null)) &&
        subscriptionId
      ) {
        const { data: existing, error: lookupError } = await admin
          .from('account_subscriptions')
          .select('account_id, plan')
          .eq('provider', 'paddle')
          .eq('provider_subscription_id', subscriptionId)
          .maybeSingle()
        if (lookupError) throw lookupError
        if (existing) {
          accountId = existing.account_id
          plan = existing.plan
        }
      }

      if (
        typeof accountId === 'string' &&
        typeof plan === 'string' &&
        isPlanId(plan) &&
        status
      ) {
        const period = event.data.current_billing_period
        const cancelAtPeriodEnd = event.data.scheduled_change?.action === 'cancel'

        const { error } = await admin
          .from('account_subscriptions')
          .upsert(
            {
              account_id: accountId,
              plan,
              status: mapPaddleStatus(status),
              provider: 'paddle',
              provider_customer_id: event.data.customer_id ?? null,
              provider_subscription_id: subscriptionId ?? null,
              trial_ends_at: null,
              current_period_start: period?.starts_at ?? null,
              current_period_end: period?.ends_at ?? null,
              cancel_at_period_end: cancelAtPeriodEnd,
            },
            { onConflict: 'account_id' },
          )
        if (error) throw error
      } else if (SUBSCRIPTION_EVENTS.has(event.event_type)) {
        throw new Error('Subscription event could not be mapped to a FlowCRM account')
      }
    }

    await admin
      .from('billing_events')
      .update({ processed_at: new Date().toISOString(), last_error: null })
      .eq('event_id', event.event_id)

    return NextResponse.json({ received: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook processing failed'
    await admin
      .from('billing_events')
      .update({ last_error: message.slice(0, 1000) })
      .eq('event_id', event.event_id)
    console.error('[billing/webhook] failed:', err)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
