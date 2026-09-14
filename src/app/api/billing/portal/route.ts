import { NextResponse } from 'next/server'
import { requireRole, toErrorResponse } from '@/lib/auth/account'
import { createPaddlePortalSession } from '@/lib/billing/paddle'

export async function POST() {
  try {
    const { supabase, accountId } = await requireRole('owner')
    const { data, error } = await supabase
      .from('account_subscriptions')
      .select('provider_customer_id')
      .eq('account_id', accountId)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: 'Could not load billing account' }, { status: 500 })
    }
    if (!data?.provider_customer_id) {
      return NextResponse.json({ error: 'No customer billing account exists' }, { status: 404 })
    }

    const portalUrl = await createPaddlePortalSession(data.provider_customer_id)
    return NextResponse.json({ portal_url: portalUrl })
  } catch (err) {
    return toErrorResponse(err)
  }
}
