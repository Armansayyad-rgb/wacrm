import { DEFAULT_PLAN_ID, SAAS_PLANS, type PlanId } from "@/config/saas";

export type Entitlement =
  | "aiAssistant"
  | "apiAccess"
  | "prioritySupport";

export function isPlanId(value: string | null | undefined): value is PlanId {
  return value === "starter" || value === "business" || value === "pro";
}

export function getPlan(plan: string | null | undefined) {
  return SAAS_PLANS[isPlanId(plan) ? plan : DEFAULT_PLAN_ID];
}

export function hasEntitlement(
  plan: string | null | undefined,
  entitlement: Entitlement,
): boolean {
  return getPlan(plan)[entitlement];
}

export function canAddSeat(plan: string | null | undefined, currentSeatCount: number) {
  return currentSeatCount < getPlan(plan).seats;
}

export function canCreateAutomation(
  plan: string | null | undefined,
  currentAutomationCount: number,
) {
  return currentAutomationCount < getPlan(plan).automations;
}

export function canCreateBroadcast(
  plan: string | null | undefined,
  broadcastsThisMonth: number,
) {
  return broadcastsThisMonth < getPlan(plan).broadcastsPerMonth;
}
