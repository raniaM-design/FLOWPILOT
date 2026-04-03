import Stripe from "stripe";
import { getPublicAppUrl as getPublicAppUrlFromEnv } from "@/lib/public-app-url";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY manquant dans l'environnement");
    }
    stripeClient = new Stripe(key, { typescript: true });
  }
  return stripeClient;
}

export const getPublicAppUrl = getPublicAppUrlFromEnv;

export const PRICE_IDS = {
  solo_monthly: process.env.STRIPE_PRICE_SOLO_MONTHLY ?? "",
  solo_annual: process.env.STRIPE_PRICE_SOLO_ANNUAL ?? "",
  team_monthly: process.env.STRIPE_PRICE_TEAM_MONTHLY ?? "",
  team_annual: process.env.STRIPE_PRICE_TEAM_ANNUAL ?? "",
} as const;

export type PlanKey = keyof typeof PRICE_IDS;

export const PLAN_LABELS: Record<PlanKey, string> = {
  solo_monthly: "Solo — 12€/mois",
  solo_annual: "Solo — 120€/an",
  team_monthly: "Équipe — 49€/mois",
  team_annual: "Équipe — 490€/an",
};

export function isConfiguredPlanKey(planKey: string): planKey is PlanKey {
  return planKey in PRICE_IDS;
}

export function getPriceIdForPlan(planKey: PlanKey): string | null {
  const id = PRICE_IDS[planKey];
  return id && id.length > 0 ? id : null;
}

export function subscriptionTierFromPriceId(priceId: string): "solo" | "team" | "free" {
  if (
    priceId === process.env.STRIPE_PRICE_SOLO_MONTHLY ||
    priceId === process.env.STRIPE_PRICE_SOLO_ANNUAL
  ) {
    return "solo";
  }
  if (
    priceId === process.env.STRIPE_PRICE_TEAM_MONTHLY ||
    priceId === process.env.STRIPE_PRICE_TEAM_ANNUAL
  ) {
    return "team";
  }
  return "free";
}
