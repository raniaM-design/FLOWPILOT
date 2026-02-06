import { prisma } from "@/lib/db";

/**
 * Récupère les étapes d'onboarding complétées pour un utilisateur
 */
export async function getOnboardingSteps(userId: string): Promise<string[]> {
  try {
    // Vérifier si le modèle existe dans le client Prisma
    if (!prisma.onboardingStep) {
      console.warn("Le modèle OnboardingStep n'est pas encore disponible dans le client Prisma. Veuillez exécuter 'npx prisma generate'.");
      return [];
    }

    const steps = await prisma.onboardingStep.findMany({
      where: {
        userId,
        completed: true,
      },
      select: {
        stepKey: true,
      },
    });

    return steps.map((s) => s.stepKey);
  } catch (error: any) {
    // Si la table n'existe pas encore (erreur P2021), retourner un tableau vide
    if (error?.code === "P2021" || error?.message?.includes("does not exist")) {
      console.warn("La table OnboardingStep n'existe pas encore. Veuillez exécuter 'npx prisma migrate dev'.");
      return [];
    }
    console.error("Erreur lors de la récupération des étapes d'onboarding:", error);
    // En cas d'erreur, retourner un tableau vide
    return [];
  }
}

/**
 * Vérifie si l'utilisateur est un nouveau utilisateur (créé il y a moins de 7 jours)
 */
export async function isNewUser(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { createdAt: true },
    });

    if (!user) {
      return false;
    }

    const daysSinceCreation = Math.floor(
      (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    return daysSinceCreation < 7;
  } catch (error) {
    console.error("Erreur lors de la vérification du statut utilisateur:", error);
    return false;
  }
}

