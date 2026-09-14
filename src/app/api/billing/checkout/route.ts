import { NextResponse } from 'next/server'
import { requireRole, toErrorResponse } from '@/lib/auth/account'
import { createPaddleCheckout } from '@/lib/billing/paddle'
import { isPlanId } from '@/lib/saas/entitlements'

export async function POST(request: Request) {
  try {
    const { accountId } = await requireRole('owner')
    const body = (await request.json().catch(() => null)) as { plan?: unknown } | null
    const plan = typeof body?.plan === 'string' ? body.plan : null

    if (!isPlanId(plan)) {
      return NextResponse.json(
        { error: 'plan must be starter, business, or pro' },
        { status: 400 },
      )
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
