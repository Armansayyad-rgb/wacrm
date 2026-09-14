import { createHmac, timingSafeEqual } from 'node:crypto'
import type { PlanId } from '@/config/saas'

const API_BASE =
  process.env.PADDLE_ENVIRONMENT === 'sandbox'
    ? 'https://sandbox-api.paddle.com'
    : 'https://api.paddle.com'

const PRICE_ENV: Record<PlanId, string> = {
  starter: 'PADDLE_PRICE_STARTER_MONTHLY',
  business: 'PADDLE_PRICE_BUSINESS_MONTHLY',
  pro: 'PADDLE_PRICE_PRO_MONTHLY',
}

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) throw new Error(`${name} is not configured`)
  return value
}

export function getPaddlePriceId(plan: PlanId): string {
  return requiredEnv(PRICE_ENV[plan])
}

async function paddleRequest<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${requiredEnv('PADDLE_API_KEY')}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  })

  const body = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      body?.error?.detail || body?.error?.type || `Paddle API error ${response.status}`
    throw new Error(message)
  }
  return body as T
}

export async function createPaddleCheckout(input: {
  accountId: string
  plan: PlanId
}): Promise<string> {
  const checkoutUrl = requiredEnv('PADDLE_CHECKOUT_URL')
  const payload = {
    items: [{ price_id: getPaddlePriceId(input.plan), quantity: 1 }],
    collection_mode: 'automatic',
    custom_data: {
      account_id: input.accountId,
      plan_id: input.plan,
    },
    checkout: { url: checkoutUrl },
  }

  const result = await paddleRequest<{
    data: { checkout?: { url?: string | null } }
  }>('/transactions', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  const url = result.data.checkout?.url
  if (!url) throw new Error('Paddle did not return a checkout URL')
  return url
}

export async function createPaddlePortalSession(customerId: string): Promise<string> {
  const result = await paddleRequest<{
    data: { urls?: { general?: { overview?: string | null } } }
  }>(`/customers/${encodeURIComponent(customerId)}/portal-sessions`, {
    method: 'POST',
    body: JSON.stringify({}),
  })

  const url = result.data.urls?.general?.overview
  if (!url) throw new Error('Paddle did not return a portal URL')
  return url
}

export function verifyPaddleSignature(
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  if (!signatureHeader) return false
  const secret = process.env.PADDLE_WEBHOOK_SECRET?.trim()
  if (!secret) return false

  const parts = signatureHeader.split(';').map((part) => part.trim())
  const ts = parts.find((part) => part.startsWith('ts='))?.slice(3)
  const signatures = parts
    .filter((part) => part.startsWith('h1='))
    .map((part) => part.slice(3))
  if (!ts || signatures.length === 0) return false

  const timestamp = Number(ts)
  if (!Number.isFinite(timestamp)) return false
  // Five minutes permits normal delivery latency while still rejecting
  // old replayed payloads. Signature verification itself remains exact.
  if (Math.abs(Math.floor(Date.now() / 1000) - timestamp) > 300) return false

  const expected = createHmac('sha256', secret)
    .update(`${ts}:${rawBody}`)
    .digest('hex')

  const expectedBuffer = Buffer.from(expected, 'hex')
  return signatures.some((candidate) => {
    if (!/^[0-9a-f]+$/i.test(candidate)) return false
    const candidateBuffer = Buffer.from(candidate, 'hex')
    return (
      candidateBuffer.length === expectedBuffer.length &&
      timingSafeEqual(candidateBuffer, expectedBuffer)
    )
  })
}

export type PaddleSubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'paused'
  | 'canceled'

export function mapPaddleStatus(
  status: PaddleSubscriptionStatus,
): 'active' | 'trialing' | 'past_due' | 'cancelled' | 'expired' {
  if (status === 'active') return 'active'
  if (status === 'trialing') return 'trialing'
  if (status === 'past_due') return 'past_due'
  if (status === 'canceled') return 'cancelled'
  return 'expired'
}
