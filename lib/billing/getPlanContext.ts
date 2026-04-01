import { getCurrentUserId } from "@/lib/flowpilot-auth/current-user";
import { prisma } from "@/lib/db";
import { getUserSubscriptionTierById } from "@/lib/subscription";

export type Plan = "free" | "pro" | "enterprise";

export interface PlanContext {
  plan: Plan;
  isEnterprise: boolean;
}

/**
 * Contexte d'abonnement pour l'app (mapping Stripe solo/team → pro/enterprise).
 */
export async function getPlanContext(): Promise<PlanContext> {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return { plan: "free", isEnterprise: false };
    }

    const tier = await getUserSubscriptionTierById(userId);

    if (tier === "team") {
      return { plan: "enterprise", isEnterprise: true };
    }
    if (tier === "solo") {
      return { plan: "pro", isEnterprise: false };
    }

    return { plan: "free", isEnterprise: false };
  } catch (error) {
    console.error("[getPlanContext] Erreur:", error);
    return { plan: "free", isEnterprise: false };
  }
}

/**
 * Récupère solo / team / free depuis la base (hors mapping legacy pro/enterprise).
 */
export async function getStripeSubscriptionContext(userId: string): Promise<{
  plan: string;
  stripeCurrentPeriodEnd: Date | null;
  stripeCustomerId: string | null;
  stripePriceId: string | null;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      plan: true,
      stripeCurrentPeriodEnd: true,
      stripeCustomerId: true,
      stripePriceId: true,
    },
  });
  return {
    plan: user?.plan ?? "free",
    stripeCurrentPeriodEnd: user?.stripeCurrentPeriodEnd ?? null,
    stripeCustomerId: user?.stripeCustomerId ?? null,
    stripePriceId: user?.stripePriceId ?? null,
  };
}

/**
 * Garde les fonctionnalités réservées au plan Équipe (Stripe team).
 */
export async function guardEnterprise(): Promise<void> {
  const { isEnterprise } = await getPlanContext();

  if (!isEnterprise) {
    throw new Error("FORBIDDEN: Plan Enterprise requis pour cette fonctionnalité");
  }
}
