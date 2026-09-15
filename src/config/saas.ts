export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME?.trim() || "FlowCRM";

export const APP_TAGLINE =
  process.env.NEXT_PUBLIC_APP_TAGLINE?.trim() ||
  "Turn WhatsApp conversations into leads, follow-ups, and sales.";

export const APP_DESCRIPTION =
  process.env.NEXT_PUBLIC_APP_DESCRIPTION?.trim() ||
  "A shared inbox and lightweight sales CRM for small businesses using the official WhatsApp Business API.";

export const APP_LOCALE = process.env.NEXT_PUBLIC_APP_LOCALE || "en";

export type PlanId = "starter" | "business" | "pro";

export type SaaSPlan = {
  id: PlanId;
  name: string;
  monthlyPriceUsd: number;
  seats: number;
  broadcastsPerMonth: number;
  automations: number;
  aiAssistant: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
};

export const SAAS_PLANS: Record<PlanId, SaaSPlan> = {
  starter: {
    id: "starter",
    name: "Starter",
    monthlyPriceUsd: 9,
    seats: 2,
    broadcastsPerMonth: 2,
    automations: 3,
    aiAssistant: false,
    apiAccess: false,
    prioritySupport: false,
  },
  business: {
    id: "business",
    name: "Business",
    monthlyPriceUsd: 19,
    seats: 5,
    broadcastsPerMonth: 10,
    automations: 20,
    aiAssistant: true,
    apiAccess: false,
    prioritySupport: false,
  },
  pro: {
    id: "pro",
    name: "Pro",
    monthlyPriceUsd: 39,
    seats: 15,
    broadcastsPerMonth: 50,
    automations: 100,
    aiAssistant: true,
    apiAccess: true,
    prioritySupport: true,
  },
};

export const DEFAULT_PLAN_ID: PlanId = "starter";
