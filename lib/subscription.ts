import { prisma } from "@/lib/db";

export type SubscriptionTier = "free" | "solo" | "team";

export async function getUserSubscriptionTierByEmail(email: string): Promise<SubscriptionTier> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { plan: true, stripeCurrentPeriodEnd: true },
  });
  if (!user) return "free";
  return normalizeTier(user.plan, user.stripeCurrentPeriodEnd);
}

export async function getUserSubscriptionTierById(userId: string): Promise<SubscriptionTier> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, stripeCurrentPeriodEnd: true },
  });
  if (!user) return "free";
  return normalizeTier(user.plan, user.stripeCurrentPeriodEnd);
}

function normalizeTier(
  plan: string,
  stripeCurrentPeriodEnd: Date | null
): SubscriptionTier {
  if (!plan || plan === "free") return "free";
  if (
    stripeCurrentPeriodEnd &&
    stripeCurrentPeriodEnd.getTime() < Date.now()
  ) {
    return "free";
  }
  if (plan === "solo" || plan === "team") return plan;
  return "free";
}

export function isPremiumTier(tier: SubscriptionTier): boolean {
  return tier === "solo" || tier === "team";
}

export function isTeamTier(tier: SubscriptionTier): boolean {
  return tier === "team";
}
