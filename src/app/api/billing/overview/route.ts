import { NextResponse } from 'next/server'
import { getCurrentAccount, toErrorResponse } from '@/lib/auth/account'

export async function GET() {
  try {
    const { supabase, accountId } = await getCurrentAccount()
    const { data, error } = await supabase
      .from('account_subscriptions')
      .select('plan,status,trial_ends_at,current_period_end,cancel_at_period_end,provider')
      .eq('account_id', accountId)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: 'Could not load subscription' }, { status: 500 })
    }

    return NextResponse.json({ subscription: data ?? null })
  } catch (err) {
    return toErrorResponse(err)
  }
}
