import { getCurrentUserId } from "@/lib/flowpilot-auth/current-user";
import { prisma } from "@/lib/db";

export type Plan = "free" | "pro" | "enterprise";

export interface PlanContext {
  plan: Plan;
  isEnterprise: boolean;
}

/**
 * Récupère le contexte du plan d'abonnement de l'utilisateur
 * 
 * TODO: Intégrer avec Stripe pour récupérer le vrai plan
 * - Vérifier la subscription Stripe active
 * - Mapper les price IDs Stripe aux plans (free/pro/enterprise)
 * - Gérer les périodes d'essai et les annulations
 * 
 * Pour l'instant, retourne "free" par défaut (stub)
 */
export async function getPlanContext(): Promise<PlanContext> {
  try {
    const userId = await getCurrentUserId();
    
    if (!userId) {
      // Non authentifié = free
      return { plan: "free", isEnterprise: false };
    }

    // TODO: Récupérer la subscription depuis Stripe
    // Exemple de logique à implémenter :
    // const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
    // const priceId = subscription.items.data[0].price.id;
    // 
    // if (priceId === process.env.STRIPE_ENTERPRISE_PRICE_ID) {
    //   return { plan: "enterprise", isEnterprise: true };
    // } else if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
    //   return { plan: "pro", isEnterprise: false };
    // }
    
    // Pour l'instant, vérifier si l'utilisateur a une entreprise
    // Si oui, on considère qu'il a le plan enterprise (temporaire pour le dev)
    // TODO: Retirer cette logique une fois Stripe intégré
    let user = null;
    try {
      user = await (prisma as any).user.findUnique({
        where: { id: userId },
        select: {
          companyId: true,
        },
      });
    } catch (dbError) {
      console.error("[getPlanContext] Erreur DB lors de la récupération de l'utilisateur:", dbError);
      // En cas d'erreur DB, retourner free
      return { plan: "free", isEnterprise: false };
    }

    // Stub: Si l'utilisateur a une entreprise, on considère qu'il a le plan enterprise
    // À retirer une fois Stripe intégré
    if (user?.companyId) {
      // TODO: Vérifier réellement le plan Stripe ici
      // Pour l'instant, on retourne "free" pour forcer l'affichage du lock
      return { plan: "free", isEnterprise: false };
    }

    return { plan: "free", isEnterprise: false };
  } catch (error) {
    console.error("[getPlanContext] Erreur:", error);
    // En cas d'erreur, retourner free par sécurité
    return { plan: "free", isEnterprise: false };
  }
}

/**
 * Guard pour protéger les routes/actions nécessitant le plan Enterprise
 * 
 * TODO: Utiliser cette fonction dans tous les endpoints API et server actions
 * liés à la collaboration entreprise :
 * - POST /api/company/create
 * - POST /api/company/members/add
 * - POST /api/company/join
 * - etc.
 * 
 * Exemple d'utilisation :
 * ```ts
 * export async function POST() {
 *   await guardEnterprise();
 *   // ... logique métier
 * }
 * ```
 */
export async function guardEnterprise(): Promise<void> {
  const { isEnterprise } = await getPlanContext();
  
  if (!isEnterprise) {
    throw new Error("FORBIDDEN: Plan Enterprise requis pour cette fonctionnalité");
  }
}

