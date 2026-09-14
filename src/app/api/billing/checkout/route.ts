import { NextResponse } from 'next/server'
import { requireRole, toErrorResponse } from '@/lib/auth/account'
import {
  createPaddleCheckout,
  updatePaddleSubscription,
} from '@/lib/billing/paddle'
import { isPlanId } from '@/lib/saas/entitlements'

export async function POST(request: Request) {
  try {
    const { supabase, accountId } = await requireRole('owner')
    const body = (await request.json().catch(() => null)) as { plan?: unknown } | null
    const plan = typeof body?.plan === 'string' ? body.plan : null

    if (!isPlanId(plan)) {
      return NextResponse.json(
        { error: 'plan must be starter, business, or pro' },
        { status: 400 },
      )
    }

    const { data: existing, error } = await supabase
      .from('account_subscriptions')
      .select('plan,provider,provider_subscription_id')
      .eq('account_id', accountId)
      .maybeSingle()

    if (error) {
      console.error('[billing/checkout] subscription lookup failed:', error)
      return NextResponse.json({ error: 'Could not load subscription' }, { status: 500 })
    }

    if (
      existing?.provider === 'paddle' &&
      existing.provider_subscription_id
    ) {
      if (existing.plan === plan) {
        return NextResponse.json({ changed: false, plan })
      }
      await updatePaddleSubscription({
        subscriptionId: existing.provider_subscription_id,
        accountId,
        plan,
      })
      return NextResponse.json({ changed: true, plan })
    }

    const checkoutUrl = await createPaddleCheckout({ accountId, plan })
    return NextResponse.json({ checkout_url: checkoutUrl })
  } catch (err) {
    if (err instanceof Error && err.message.includes('PADDLE_')) {
      console.error('[billing/checkout] configuration error:', err.message)
      return NextResponse.json({ error: 'Billing is not configured yet' }, { status: 503 })
    }
    return toErrorResponse(err)
  }
}
