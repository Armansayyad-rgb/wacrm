'use client'

import { useState } from 'react'
import { SAAS_PLANS, type PlanId } from '@/config/saas'

export function BillingSettings() {
  const [loading, setLoading] = useState<PlanId | 'portal' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  async function choosePlan(plan: PlanId) {
    setLoading(plan)
    setError(null)
    setNotice(null)
    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const body = await response.json().catch(() => null)
      if (!response.ok) throw new Error(body?.error || 'Could not update plan')

      if (body?.checkout_url) {
        window.location.assign(body.checkout_url)
        return
      }

      if (body?.changed === true) {
        setNotice('Plan change submitted. Access updates when the billing webhook confirms it.')
      } else {
        setNotice('This workspace is already on that plan.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update plan')
    } finally {
      setLoading(null)
    }
  }

  async function openPortal() {
    setLoading('portal')
    setError(null)
    setNotice(null)
    try {
      const response = await fetch('/api/billing/portal', { method: 'POST' })
      const body = await response.json().catch(() => null)
      if (!response.ok || !body?.portal_url) {
        throw new Error(body?.error || 'Billing portal is not available yet')
      }
      window.location.assign(body.portal_url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open billing portal')
      setLoading(null)
    }
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Plans & billing</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Global monthly pricing. Checkout can localize currency and applicable taxes.
          </p>
        </div>
        <button
          type="button"
          onClick={openPortal}
          disabled={loading !== null}
          className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
        >
          {loading === 'portal' ? 'Opening…' : 'Manage billing'}
        </button>
      </div>

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {notice ? (
        <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-foreground">
          {notice}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-3">
        {Object.values(SAAS_PLANS).map((plan) => (
          <div key={plan.id} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-semibold text-foreground">{plan.name}</h3>
              <div className="text-right">
                <span className="text-2xl font-bold text-foreground">${plan.monthlyPriceUsd}</span>
                <span className="text-sm text-muted-foreground">/mo</span>
              </div>
            </div>

            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>{plan.seats} team seats</li>
              <li>{plan.broadcastsPerMonth} broadcasts / month</li>
              <li>{plan.automations} automations</li>
              <li>{plan.aiAssistant ? 'AI assistant included' : 'AI assistant not included'}</li>
              <li>{plan.apiAccess ? 'Public API included' : 'Public API not included'}</li>
            </ul>

            <button
              type="button"
              onClick={() => choosePlan(plan.id)}
              disabled={loading !== null}
              className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {loading === plan.id ? 'Updating…' : `Choose ${plan.name}`}
            </button>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Billing changes require the workspace owner. WhatsApp conversation charges from Meta are separate from the software subscription.
      </p>
    </section>
  )
}
