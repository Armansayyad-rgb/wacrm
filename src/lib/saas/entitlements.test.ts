import { describe, expect, it } from 'vitest'
import {
  canAddSeat,
  canCreateAutomation,
  canCreateBroadcast,
  getPlan,
  hasEntitlement,
  isPlanId,
} from './entitlements'

describe('SaaS entitlements', () => {
  it('recognizes supported plan ids', () => {
    expect(isPlanId('starter')).toBe(true)
    expect(isPlanId('business')).toBe(true)
    expect(isPlanId('pro')).toBe(true)
    expect(isPlanId('enterprise')).toBe(false)
  })

  it('falls back safely to Starter for unknown plan values', () => {
    expect(getPlan('unknown').id).toBe('starter')
  })

  it('gates AI and API by plan', () => {
    expect(hasEntitlement('starter', 'aiAssistant')).toBe(false)
    expect(hasEntitlement('business', 'aiAssistant')).toBe(true)
    expect(hasEntitlement('business', 'apiAccess')).toBe(false)
    expect(hasEntitlement('pro', 'apiAccess')).toBe(true)
  })

  it('enforces seat, automation, and broadcast limits', () => {
    expect(canAddSeat('starter', 1)).toBe(true)
    expect(canAddSeat('starter', 2)).toBe(false)
    expect(canCreateAutomation('business', 19)).toBe(true)
    expect(canCreateAutomation('business', 20)).toBe(false)
    expect(canCreateBroadcast('pro', 49)).toBe(true)
    expect(canCreateBroadcast('pro', 50)).toBe(false)
  })
})
